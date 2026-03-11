"use client";

import { Home, Share2, FileDown, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface MedicalTopbarProps {
  onExport: () => void | Promise<void>;
  onPreview: () => void;
  onReset: () => void;
  onShare?: () => void;
  shareUrl?: string | null;
  isSharing?: boolean;
  onChatToggle?: () => void;
  chatExpanded?: boolean;
  homeHref?: string;
}

export function MedicalTopbar({
  onExport,
  onPreview,
  onReset,
  onShare,
  shareUrl,
  isSharing = false,
  onChatToggle,
  chatExpanded = false,
  homeHref = "/",
}: MedicalTopbarProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport();
    } finally {
      setIsExporting(false);
    }
  };

  const copyShareUrl = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
    }
  };

  return (
    <>
      <header className="topbar-glass">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Home button */}
            <a href={homeHref} className="flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                title="Trang chủ"
                className="rounded-lg hover:bg-accent"
              >
                <Home className="h-5 w-5" />
              </Button>
            </a>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {onShare && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onShare}
                  disabled={isSharing}
                  className="rounded-xl px-4 py-2 hover:bg-accent"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">
                    {isSharing ? "Đang chia sẻ..." : "Chia sẻ"}
                  </span>
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
                className="rounded-xl px-4 py-2 hover:bg-accent"
              >
                <FileDown className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">
                  {isExporting ? "Đang xuất..." : "Xuất file"}
                </span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onPreview}
                className="rounded-xl px-4 py-2 hover:bg-accent"
              >
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Xem trước</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="rounded-xl px-4 py-2 hover:bg-red-50/50 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Xóa hết</span>
              </Button>

              {onChatToggle && (
                <Button
                  variant={chatExpanded ? "default" : "ghost"}
                  size="sm"
                  onClick={onChatToggle}
                  className={`rounded-xl px-4 py-2 ${chatExpanded ? "bg-primary hover:bg-primary/90" : "hover:bg-accent"}`}
                >
                  <span>💬</span>
                  <span className="hidden sm:inline ml-1">Chat</span>
                </Button>
              )}
            </div>
          </div>

          {/* Share URL display */}
          {shareUrl && (
            <div className="mt-3">
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 text-sm">
                <span className="text-emerald-700 dark:text-emerald-400 font-medium whitespace-nowrap">
                  ✓ Đã chia sẻ:
                </span>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-600 dark:text-sky-400 hover:underline truncate flex-1"
                >
                  {shareUrl}
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyShareUrl}
                  className="flex-shrink-0 rounded-lg"
                >
                  Copy
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
