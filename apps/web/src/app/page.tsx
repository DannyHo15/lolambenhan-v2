import Link from "next/link";
import { Tabs, TabsList, TabsContent } from "@/components/tabs";
import { CategoryCard } from "@/components/category-card";
import { CommentsSection } from "@/components/comments-section";
import { Button } from "@/components/ui/button";
// import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-strong border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white flex items-center justify-center font-semibold text-sm shadow-lg transition-transform group-hover:scale-105">
              MB
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              LoLamBenhAn
            </h1>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/hoichan">
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground/80 hover:text-foreground"
              >
                Hội chẩn
              </Button>
            </Link>
            <Link href="/admin">
              <Button
                size="sm"
                className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white"
              >
                Admin
              </Button>
            </Link>
            {/* <ThemeToggleButton /> */}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <div className="glass rounded-2xl px-6 py-2 inline-flex items-center gap-2 shadow-sm border">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
              <span className="text-sm font-medium text-foreground">
                Miễn phí cho sinh viên
              </span>
            </div>
          </div>
          <h2
            className="text-[40px] font-semibold text-foreground mb-4"
            style={{ letterSpacing: "-0.5px" }}
          >
            Hỗ trợ sinh viên Y khoa làm bệnh án
          </h2>
          <p className="text-[17px] text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Nền tảng hỗ trợ sinh viên Y khoa lập bệnh án nhanh, gọn, đúng chuẩn:
            nội khoa, tiền phẫu, hậu phẫu, sản – phụ – nhi khoa.
          </p>
        </div>

        {/* Categories */}
        <Tabs>
          <TabsList />
          <TabsContent value="tutu">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <CategoryCard
                title="Nội khoa"
                description="Bệnh án nội khoa"
                href="/benhan/noi-khoa"
              />
              <CategoryCard
                title="Tiền phẫu"
                description="Bệnh án tiền phẫu thuật"
                href="/benhan/tien-phau"
              />
              <CategoryCard
                title="Hậu phẫu"
                description="Bệnh án hậu phẫu thuật"
                href="/benhan/hau-phau"
              />
              <CategoryCard
                title="Sản khoa"
                description="Bệnh án sản khoa"
                href="/benhan/san-khoa"
              />
              <CategoryCard
                title="Phụ khoa"
                description="Bệnh án phụ khoa"
                href="/benhan/phu-khoa"
              />
              <CategoryCard
                title="Nhi khoa"
                description="Bệnh án nhi khoa"
                href="/benhan/nhi-khoa"
              />
            </div>
          </TabsContent>
          <TabsContent value="ckle">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
              <CategoryCard
                title="Gây mê hồi sức (SV)"
                description="Bệnh án dành cho sinh viên Y khoa"
                href="/benhan/gmhs-sv"
              />
              <CategoryCard
                title="Gây mê hồi sức (BS)"
                description="Bệnh án dành cho bác sĩ sau đại học"
                href="/benhan/gmhs-bs"
              />
            </div>
          </TabsContent>
          <TabsContent value="khac">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
              <CategoryCard
                title="Y học cổ truyền"
                description="Bệnh án Y học cổ truyền"
                href="/benhan/yhct"
              />
              <CategoryCard
                title="Điều dưỡng"
                description="Bệnh án điều dưỡng"
                href="/benhan/dieu-duong"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Comments Section */}
        <CommentsSection />
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Copyright © 2025 LoLamBenhAn. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
