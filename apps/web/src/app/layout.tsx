import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "LoLamBenhAn - Hỗ trợ sinh viên Y khoa làm bệnh án nhanh chóng",
  description:
    "LoLamBenhAn – Công cụ hỗ trợ sinh viên Y khoa làm bệnh án nội khoa, ngoại khoa, sản, nhi nhanh chóng, chính xác và dễ sử dụng.",
  keywords:
    "làm bệnh án, bệnh án y khoa, sinh viên y khoa, bệnh án nội khoa, bệnh án ngoại khoa, tiền phấu, hậu phấu, sản khoa, phụ khoa, nhi khoa",
  authors: [{ name: "LoLamBenhAn" }],
  openGraph: {
    type: "website",
    title: "LoLamBenhAn – Hỗ trợ sinh viên Y khoa làm bệnh án nhanh chóng",
    description:
      "Nền tảng hỗ trợ sinh viên Y khoa lập bệnh án nhanh, gọn, đúng chuẩn: nội khoa, tiền phẫu, hậu phẫu, sản – phụ – nhi khoa.",
    url: "https://lolambenhan.vercel.app",
    siteName: "LoLamBenhAn",
    locale: "vi_VN",
  },
  twitter: {
    card: "summary_large_image",
    title: "LoLamBenhAn – Hỗ trợ sinh viên Y khoa làm bệnh án",
    description:
      "Công cụ hỗ trợ sinh viên Y khoa làm bệnh án nhanh, chuẩn, dễ dùng cho học tập và thực hành lâm sàng.",
  },
  icons: {
    icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQmj7drT8_gPK2zwTd5CMdWRNdIQmHNP2T9Kg&s",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <div className="bg-fixed" />
        <ThemeProvider>
          <div className="relative z-[1]">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
