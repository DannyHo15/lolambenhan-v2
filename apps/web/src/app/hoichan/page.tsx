"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HoiChanPage() {
  const [messages, setMessages] = useState<Array<{ id: number; role: string; content: string }>>([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), role: "user", content: input }]);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-transparent">
      <header className="topbar-glass">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-lg hover:bg-accent">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="ml-4 text-xl font-semibold text-foreground">Hội chẩn</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Card className="p-6 rounded-2xl shadow-lg">
          <h2 className="text-[28px] font-semibold text-foreground mb-2">Phòng hội chẩn</h2>
          <p className="text-muted-foreground mb-6">
            Tính năng đang phát triển. Vui lòng quay lại sau.
          </p>

          <div className="h-96 border rounded-xl bg-muted/30 p-4 mb-4 overflow-auto">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground mt-20">Chưa có tin nhắn nào</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`mb-4 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                  <span className={`inline-block px-4 py-2 rounded-lg ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {msg.content}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Nhập tin nhắn..."
              className="flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring input-apple"
            />
            <Button onClick={handleSend} className="rounded-xl bg-primary hover:bg-primary/90">Gửi</Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
