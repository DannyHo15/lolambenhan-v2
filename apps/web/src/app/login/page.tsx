import { LoginPage } from "@/components/auth";

export default function LoginPageRoute() {
  return (
    <LoginPage
      title="Đăng nhập Admin"
      subtitle="Đăng nhập để truy cập trang quản trị"
      redirectTo="/admin"
    />
  );
}
