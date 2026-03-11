"use client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
}

export function PreviewModal({
  isOpen,
  onClose,
  htmlContent,
}: PreviewModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (isOpen && iframeRef.current) {
      iframeRef.current.srcdoc = htmlContent;
    }
  }, [isOpen, htmlContent]);

  // Khóa scroll body - cách tối ưu nhất
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="button"
      tabIndex={-1}
      aria-label="Đóng modal"
    >
      <div
        className="bg-background rounded-lg w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="presentation"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0 bg-muted">
          <h2 className="text-lg font-semibold text-foreground">Xem trước (A4)</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 p-4 bg-muted/30">
          <iframe
            ref={iframeRef}
            className="w-full h-full bg-white rounded border-0"
            title="Preview"
          />
        </div>
      </div>
    </div>
  );
}
