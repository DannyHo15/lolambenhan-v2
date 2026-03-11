"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function UnauthorizedPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-6">
          <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg
              className="h-8 w-8 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Khong co quyen truy cap
        </h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          {user
            ? `Xin chao ${user.fullName}, ban khong co quyen truy cap trang nay. Vui long lien he quan tri vien neu can ho tro.`
            : "Ban khong co quyen truy cap trang nay."}
        </p>

        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button variant="outline">Ve trang chu</Button>
          </Link>
          {user && (
            <Button variant="destructive" onClick={logout}>
              Dang xuat
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
