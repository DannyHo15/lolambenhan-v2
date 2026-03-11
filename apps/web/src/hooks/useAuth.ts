"use client";

import { useCallback, useEffect } from "react";
import { useAuthStore, User, UserRole, ROLE_HIERARCHY } from "@/lib/store/auth-store";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/apis/v1";

// Response from POST /auth/login
interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
    user: User;
  };
  message?: string;
}

// Response from POST /auth/verify
interface VerifyResponse {
  success: boolean;
  data: {
    valid: boolean;
    user: User;
  };
  message?: string;
}

// Response from POST /auth/refresh
interface RefreshResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
  };
  message?: string;
}

export function useAuth() {
  const {
    user,
    token,
    refreshToken,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    setLoading,
    setError,
    setTokens,
  } = useAuthStore();

  // Verify stored token on mount
  useEffect(() => {
    const verifyStoredToken = async () => {
      if (!token) return;

      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/auth/verify`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data: VerifyResponse = await response.json();

        if (!response.ok || !data.success || !data.data.valid) {
          // Token invalid - try to refresh
          if (refreshToken) {
            const refreshed = await refreshTokens();
            if (!refreshed) {
              logout();
            }
          } else {
            logout();
          }
          return;
        }

        // Update user data from verification response
        if (data.data.user) {
          login(token, data.data.user);
        }
      } catch (err) {
        console.error("Token verification failed:", err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyStoredToken();
  }, []);

  // Refresh tokens
  const refreshTokens = useCallback(async (): Promise<boolean> => {
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data: RefreshResponse = await response.json();

      if (!response.ok || !data.success) {
        return false;
      }

      // Update tokens in store
      setTokens(data.data.accessToken, data.data.refreshToken);
      return true;
    } catch (err) {
      console.error("Token refresh failed:", err);
      return false;
    }
  }, [refreshToken, setTokens]);

  // Google OAuth login - send ID token to backend
  const verifyGoogleToken = useCallback(async (googleIdToken: string) => {
    setLoading(true);
    setError(null);

    try {
      // Send Google ID token to backend /auth/login endpoint
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken: googleIdToken }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Authentication failed");
      }

      // Store tokens and user info
      setTokens(data.data.accessToken, data.data.refreshToken);
      login(data.data.accessToken, data.data.user);
      return { success: true, user: data.data.user };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
      return { success: false, error: message };
    }
  }, [login, setLoading, setError, setTokens]);

  // Logout - call backend to revoke tokens
  const handleLogout = useCallback(async () => {
    try {
      if (token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      logout();
    }
  }, [token, logout]);

  // Role-based helpers
  const isAdmin = user?.role === "admin";
  const isDoctor = user?.role === "doctor" || user?.role === "admin";
  const isStudent = user?.role === "student" || isDoctor;
  const isGuest = user?.role === "guest";

  // Check if user has at least the specified role level
  const hasRole = useCallback((requiredRole: UserRole): boolean => {
    if (!user?.role) return false;
    return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[requiredRole];
  }, [user?.role]);

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    if (!user?.role) return false;
    return roles.includes(user.role);
  }, [user?.role]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    // Role checks
    isAdmin,
    isDoctor,
    isStudent,
    isGuest,
    hasRole,
    hasAnyRole,
    // Actions
    verifyGoogleToken,
    logout: handleLogout,
    refreshTokens,
    clearError: () => setError(null),
  };
}
