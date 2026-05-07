"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { ChatPanel } from "@/components/layout/ChatPanel";
import { PageRenderer } from "@/components/layout/PageRenderer";
import { PageInitializer } from "./PageInitializer";
import type { PageConfig } from "@/types/page-config";

interface Props {
  pageId: string;
  title: string;
  config: PageConfig;
  initialMessages: { id: string; role: "user" | "assistant"; content: string }[];
}

export function PageClientLayout({ pageId, title, config, initialMessages }: Props) {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <PageInitializer config={config} />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <h1 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
          {title}
        </h1>
        <button
          onClick={() => setChatOpen(true)}
          className="flex items-center gap-2 px-3 h-8 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors shrink-0"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Chat
        </button>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-49px)] overflow-auto">
        <PageRenderer pageId={pageId} />
      </div>

      <ChatPanel
        pageId={pageId}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        initialMessages={initialMessages}
      />
    </>
  );
}
