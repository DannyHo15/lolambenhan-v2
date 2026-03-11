"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Users, FileText, Settings, BarChart3, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/auth";
import { useAuth } from "@/hooks/useAuth";
// import { ThemeToggleButton } from "@/components/theme-toggle";

function AdminDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-transparent">
      <header className="topbar-glass">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-lg hover:bg-accent"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="ml-4 text-xl font-semibold text-foreground">
              Admin Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {user.picture && (
                  <Image
                    src={user.picture}
                    alt={user.fullName}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                )}
                <span>{user.fullName}</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="rounded-lg hover:bg-accent"
              title="Dang xuat"
            >
              <LogOut className="h-5 w-5" />
            </Button>
            {/* <ThemeToggleButton /> */}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 rounded-2xl shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-sky-100 dark:bg-sky-900/30 rounded-xl">
                <FileText className="h-6 w-6 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tong benh an</p>
                <p className="text-2xl font-semibold text-foreground">0</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nguoi dung</p>
                <p className="text-2xl font-semibold text-foreground">0</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                <BarChart3 className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Luot xem</p>
                <p className="text-2xl font-semibold text-foreground">0</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <Settings className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cai dat</p>
                <p className="text-2xl font-semibold text-foreground">-</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6 rounded-2xl shadow-lg">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Quan ly benh an
          </h2>
          <p className="text-muted-foreground">
            Tinh nang dang phat trien. Vui long quay lai sau.
          </p>
        </Card>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute requireAdmin redirectTo="/login">
      <AdminDashboard />
    </ProtectedRoute>
  );
}
