"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, X, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { marked } from "marked";
import DOMPurify from "dompurify";

interface ChatMessage {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
}

let messageIdCounter = 0;
const generateMessageId = () => `msg-${Date.now()}-${++messageIdCounter}`;

const SYSTEM_PROMPT = `Bạn tên là LÒ - trợ lý AI hỗ trợ hoàn thành bệnh án y khoa.

## Nhiệm vụ của bạn:
1. Hỗ trợ biện luận chẩn đoán dựa trên dữ liệu bệnh án
2. Gợi ý nội dung cho các trường trong bệnh án
3. Đưa ra ý kiến chuyên môn về bệnh lý

## Khi người dùng yêu cầu gợi ý:
Trả lời theo định dạng chuẩn để dễ điền vào form:

**GỢI Ý CHO BỆNH ÁN:**

I. Hỏi bệnh
1. Lý do vào viện: [nội dung]
2. Bệnh sử: [nội dung]
3. Tiền sử: [nội dung]

II. Khám bệnh
1. Toàn trạng: [nội dung]
2. Các cơ quan:
   - Tuần hoàn: [nội dung]
   - Hô hấp: [nội dung]
   - Tiêu hoá: [nội dung]
   - Thận: [nội dung]
   - Thần kinh: [nội dung]
   - Cơ xương khớp: [nội dung]

III. Kết luận
1. Tóm tắt bệnh án: [nội dung]
2. Chẩn đoán sơ bộ: [nội dung]
3. Chẩn đoán phân biệt: [nội dung]
4. Chẩn đoán xác định: [nội dung]
5. Điều trị: [nội dung]
6. Tiên lượng: [nội dung]

## Khi người dùng hỏi về một trường cụ thể:
Trả lời ngắn gọn, tập trung vào trường đó và đưa ra 2-3 gợi ý cụ thể.

## Lưu ý:
- Sử dụng ngôn ngữ y khoa chuẩn tiếng Việt
- Tham khảo dữ liệu bệnh án hiện tại nếu có
- Luôn giải thích lý do cho các gợi ý`;

const GLM_API_KEY = process.env.NEXT_PUBLIC_GLM_API_KEY || "";

// Field labels mapping for display
const FIELD_LABELS: Record<string, string> = {
  hoten: "Họ và tên",
  gioitinh: "Giới tính",
  namsinh: "Năm sinh",
  dantoc: "Dân tộc",
  nghenghiep: "Nghề nghiệp",
  diachi: "Địa chỉ",
  ngaygio: "Ngày giờ vào viện",
  lydo: "Lý do vào viện",
  benhsu: "Bệnh sử",
  tiensu: "Tiền sử",
  tongtrang: "Toàn trạng",
  timmach: "Tim mạch",
  hopho: "Hô hấp",
  tieuhoa: "Tiêu hoá",
  than: "Thận - Tiết niệu",
  thankinh: "Thần kinh",
  cokhop: "Cơ xương khớp",
  coquankhac: "Cơ quan khác",
  tomtat: "Tóm tắt bệnh án",
  chandoanso: "Chẩn đoán sơ bộ",
  chandoanpd: "Chẩn đoán phân biệt",
  chandoanxacdinh: "Chẩn đoán xác định",
  cls_thuongquy: "CLS thường quy",
  cls_chuandoan: "CLS chẩn đoán",
  ketqua: "Kết quả CLS",
  huongdieutri: "Hướng điều trị",
  dieutri: "Điều trị cụ thể",
  tienluong: "Tiên lượng",
  bienluan: "Biện luận",
};

interface FormData {
  hoten?: string;
  gioitinh?: string;
  namsinh?: string;
  tuoi?: string;
  dantoc?: string;
  nghenghiep?: string;
  diachi?: string;
  ngaygio?: string;
  lydo?: string;
  benhsu?: string;
  tiensu?: string;
  mach?: string;
  nhietdo?: string;
  ha_tren?: string;
  ha_duoi?: string;
  nhiptho?: string;
  chieucao?: string;
  cannang?: string;
  bmi?: string;
  phanloai?: string;
  tongtrang?: string;
  timmach?: string;
  hopho?: string;
  tieuhoa?: string;
  than?: string;
  thankinh?: string;
  cokhop?: string;
  coquankhac?: string;
  tomtat?: string;
  chandoanso?: string;
  chandoanpd?: string;
  cls_thuongquy?: string;
  cls_chuandoan?: string;
  ketqua?: string;
  chandoanxacdinh?: string;
  huongdieutri?: string;
  dieutri?: string;
  tienluong?: string;
  bienluan?: string;
}

interface AiChatPanelProps {
  formContext?: FormData;
  apiUrl?: string;
  apiKey?: string;
  onApplySuggestion?: (field: string, value: string) => void;
}

export function AiChatPanel({
  formContext,
  apiUrl = "https://api.z.ai/api/coding/paas/v4/chat/completions",
  apiKey = GLM_API_KEY,
  onApplySuggestion,
}: AiChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: generateMessageId(), role: "system", content: SYSTEM_PROMPT },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Build context string from form data
  const buildFormContextString = useCallback(() => {
    if (!formContext) return "";

    const sections: string[] = ["\n## DỮ LIỆU BỆNH ÁN HIỆN TẠI:\n"];

    // Group fields by section
    const hanhchinh = ["hoten", "gioitinh", "namsinh", "dantoc", "nghenghiep", "diachi", "ngaygio"];
    const hoibenh = ["lydo", "benhsu", "tiensu"];
    const khamtongtrang = ["mach", "nhietdo", "ha_tren", "ha_duoi", "nhiptho", "chieucao", "cannang", "tongtrang"];
    const coquan = ["timmach", "hopho", "tieuhoa", "than", "thankinh", "cokhop", "coquankhac"];
    const ketluan = ["tomtat", "chandoanso", "chandoanpd", "chandoanxacdinh", "huongdieutri", "dieutri", "tienluong"];

    const formatFields = (fields: string[], title: string) => {
      const items = fields
        .filter((f) => formContext[f as keyof FormData])
        .map((f) => {
          const value = formContext[f as keyof FormData];
          return value ? `- ${FIELD_LABELS[f] || f}: ${value}` : null;
        })
        .filter(Boolean);

      if (items.length > 0) {
        return `\n### ${title}\n${items.join("\n")}`;
      }
      return "";
    };

    sections.push(formatFields(hanhchinh, "A. Hành chính"));
    sections.push(formatFields(hoibenh, "B1. Hỏi bệnh"));
    sections.push(formatFields(khamtongtrang, "B2. Toàn trạng & Dấu hiệu sinh tồn"));
    sections.push(formatFields(coquan, "B3. Khám các cơ quan"));
    sections.push(formatFields(ketluan, "C. Kết luận"));

    return sections.filter(Boolean).join("\n");
  }, [formContext]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    if (!apiKey) {
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          role: "assistant",
          content:
            "⚠️ Lỗi: Chưa cấu hình API Key. Vui lòng thêm NEXT_PUBLIC_GLM_API_KEY vào file .env.local",
        },
      ]);
      return;
    }

    // Build user content with full form context
    let userContent = text;
    const formContextStr = buildFormContextString();

    if (formContextStr) {
      userContent = `${formContextStr}\n\n---\n\n**Yêu cầu:** ${text}`;
    }

    setMessages((prev) => [...prev, { id: generateMessageId(), role: "user", content: text }]);
    setInput("");
    setIsLoading(true);
    setStreamingMessage("");

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": "vi-VN,vi",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "glm-4.7",
          messages: [...messages, { role: "user", content: userContent }],
          temperature: 1.0,
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Không thể đọc response stream");
      }

      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed?.choices?.[0]?.delta?.content || "";
              if (content) {
                fullContent += content;
                setStreamingMessage(fullContent);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Add complete message to history
      setMessages((prev) => [
        ...prev,
        { id: generateMessageId(), role: "assistant", content: fullContent || "Bot không trả lời." },
      ]);
      setStreamingMessage("");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        // Request was cancelled, don't show error
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            role: "assistant",
            content: `⚠️ Lỗi: ${error instanceof Error ? error.message : String(error)}`,
          },
        ]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [input, formContext, messages, apiKey, apiUrl, isLoading, buildFormContextString]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Quick action handlers
  const handleQuickAction = (action: string) => {
    setInput(action);
    setTimeout(() => {
      const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
      document.activeElement?.dispatchEvent(event);
    }, 100);
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant={isOpen ? "default" : "outline"}
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-40 shadow-lg"
      >
        💬 Chat
      </Button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 z-40 w-96 h-[500px] bg-background rounded-lg shadow-xl border flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-2 bg-muted rounded-t-lg">
            <span className="font-medium text-foreground">
              💬 Biện luận cùng bot Lò
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsOpen(false);
                abortControllerRef.current?.abort();
              }}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="border-b px-3 py-2 flex flex-wrap gap-2 bg-muted/50">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => handleQuickAction("Gợi ý toàn bộ bệnh án dựa trên thông tin đã nhập")}
              disabled={isLoading}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Gợi ý toàn bộ
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => handleQuickAction("Gợi ý chẩn đoán sơ bộ và chẩn đoán phân biệt")}
              disabled={isLoading}
            >
              <FileText className="h-3 w-3 mr-1" />
              Gợi ý chẩn đoán
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => handleQuickAction("Gợi ý hướng điều trị và tiên lượng")}
              disabled={isLoading}
            >
              <FileText className="h-3 w-3 mr-1" />
              Gợi ý điều trị
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {messages
              .filter((m) => m.role !== "system")
              .map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-lg px-3 py-2 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground ml-8"
                      : "bg-muted text-foreground mr-8"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(marked.parse(msg.content) as string),
                      }}
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              ))}
            {/* Streaming message */}
            {streamingMessage && (
              <div className="bg-muted rounded-lg px-3 py-2 mr-8">
                <div
                  className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(marked.parse(streamingMessage) as string),
                  }}
                />
                <span className="inline-flex gap-1 ml-2">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce delay-100">●</span>
                  <span className="animate-bounce delay-200">●</span>
                </span>
              </div>
            )}
            {isLoading && !streamingMessage && (
              <div className="bg-muted rounded-lg px-3 py-2 mr-8">
                <span className="text-sm text-foreground">Đang soạn tin</span>
                <span className="inline-flex gap-1 ml-2">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce delay-100">●</span>
                  <span className="animate-bounce delay-200">●</span>
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3 flex gap-2 rounded-b-lg">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn... (Shift+Enter để xuống dòng)"
              disabled={isLoading}
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
