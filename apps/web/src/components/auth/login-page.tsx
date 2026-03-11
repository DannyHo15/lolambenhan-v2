"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleLoginButton } from "./login-button";
import { useAuth } from "@/hooks/useAuth";
import { useRedirectAfterLogin } from "./protected-route";

interface LoginPageProps {
  title?: string;
  subtitle?: string;
  redirectTo?: string;
}

export function LoginPage({
  title = "Đăng nhập",
  subtitle = "Đăng nhập để tiếp tục",
  redirectTo = "/admin",
}: LoginPageProps) {
  const { isAuthenticated, isLoading, error, clearError } = useAuth();
  const router = useRouter();
  const redirectAfterLogin = useRedirectAfterLogin();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      redirectAfterLogin(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectAfterLogin, redirectTo]);

  const handleSuccess = () => {
    clearError();
    redirectAfterLogin(redirectTo);
  };

  const handleError = (errorMessage: string) => {
    console.error("Login error:", errorMessage);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="glass rounded-2xl p-8 shadow-lg border">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white flex items-center justify-center font-semibold text-lg shadow-lg">
              MB
            </div>
            <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
            <p className="text-muted-foreground mt-2">{subtitle}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive text-center">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <GoogleLoginButton
              onSuccess={handleSuccess}
              onError={handleError}
              className="w-full"
              variant="outline"
            />
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Bằng việc đăng nhập, bạn đồng ý với{" "}
            <span className="text-sky-500 hover:underline cursor-pointer">
              Điều khoản dịch vụ
            </span>{" "}
            và{" "}
            <span className="text-sky-500 hover:underline cursor-pointer">
              Chính sách bảo mật
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
