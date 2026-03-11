"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { UserRole, ROLE_HIERARCHY } from "@/lib/store/auth-store";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** @deprecated Use requiredRoles instead */
  requireAdmin?: boolean;
  /** Array of roles that can access this route. User must have at least one. */
  requiredRoles?: UserRole[];
  /** Minimum role level required. User must have this role or higher in hierarchy. */
  minimumRole?: UserRole;
  /** Custom access check function */
  accessCheck?: (user: { role: UserRole; id: string; email: string }) => boolean;
  /** Redirect path if not authenticated */
  redirectTo?: string;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  requiredRoles,
  minimumRole,
  accessCheck,
  redirectTo = "/login",
  loadingComponent,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isAdmin, user, hasRole, hasAnyRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user has access based on configured rules
  const checkAccess = (): boolean => {
    if (!user) return false;

    // Legacy support: requireAdmin prop
    if (requireAdmin && !isAdmin) return false;

    // Check specific roles array
    if (requiredRoles && !hasAnyRole(requiredRoles)) return false;

    // Check minimum role level
    if (minimumRole && !hasRole(minimumRole)) return false;

    // Custom access check
    if (accessCheck && !accessCheck(user)) return false;

    return true;
  };

  useEffect(() => {
    if (mounted && !isLoading) {
      if (!isAuthenticated) {
        // Save the attempted URL for redirect after login (client-side only)
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem("redirectAfterLogin", pathname);
        }
        router.push(redirectTo);
      } else if (!checkAccess()) {
        // User is authenticated but doesn't have required role
        router.push("/unauthorized");
      }
    }
  }, [mounted, isAuthenticated, isLoading, user, requireAdmin, requiredRoles, minimumRole, router, redirectTo, pathname]);

  // Show loading state during hydration or auth check
  if (!mounted || isLoading) {
    return (
      loadingComponent || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
            <p className="text-sm text-muted-foreground">Dang xac thuc...</p>
          </div>
        </div>
      )
    );
  }

  // Not authenticated or insufficient permissions
  if (!isAuthenticated || !checkAccess()) {
    return null;
  }

  return <>{children}</>;
}

// Higher-order component version for easier use
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, "children"> = {}
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Hook to get redirect URL after login
export function useRedirectAfterLogin() {
  const router = useRouter();

  const redirect = (defaultPath = "/") => {
    // Check if running on client side
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      const savedPath = sessionStorage.getItem("redirectAfterLogin");
      if (savedPath) {
        sessionStorage.removeItem("redirectAfterLogin");
        router.push(savedPath);
        return;
      }
    }
    router.push(defaultPath);
  };

  return redirect;
}

// Utility function to check role hierarchy (can be used outside components)
export function hasRoleLevel(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
