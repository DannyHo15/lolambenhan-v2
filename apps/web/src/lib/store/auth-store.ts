import { create } from "zustand";
import { persist } from "zustand/middleware";

// Role types matching backend schema
export type UserRole = "admin" | "doctor" | "student" | "guest";

// Role hierarchy for permission checks
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 100,
  doctor: 50,
  student: 25,
  guest: 0,
};

export interface User {
  id: string;
  email: string;
  username?: string;
  fullName: string;
  picture?: string;
  role: UserRole;
  department?: string | null;
  isActive: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (token: string, user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateUser: (user: Partial<User>) => void;
  setRefreshToken: (refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      login: (token: string, user: User) => {
        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      },

      logout: () => {
        set(initialState);
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error, isLoading: false });
      },

      updateUser: (userData: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },

      setRefreshToken: (refreshToken: string) => {
        set({ refreshToken });
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        set({ token: accessToken, refreshToken });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selector hooks for better performance
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useRefreshToken = () => useAuthStore((state) => state.refreshToken);

// Role-based selector hooks
export const useUserRole = () => useAuthStore((state) => state.user?.role ?? null);
export const useIsAdmin = () => useAuthStore((state) => state.user?.role === "admin");
export const useIsDoctor = () => useAuthStore((state) => state.user?.role === "doctor" || state.user?.role === "admin");

// Check if user has at least the specified role level
export const useHasRole = (requiredRole: UserRole): boolean => {
  const userRole = useAuthStore((state) => state.user?.role);
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

// Check if user has any of the specified roles
export const useHasAnyRole = (roles: UserRole[]): boolean => {
  const userRole = useAuthStore((state) => state.user?.role);
  if (!userRole) return false;
  return roles.includes(userRole);
};
