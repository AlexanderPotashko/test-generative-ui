"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { usePageStore } from "@/lib/store/page-store";
import { cn } from "@/lib/cn";
import { Send, X, Loader2, AlertCircle } from "lucide-react";
import { useRef, useEffect, useState, useMemo } from "react";
import type { WidgetType } from "@/types/page-config";

const WIDGET_MAP: Record<string, WidgetType> = {
  addMetricCard: "metric-card",
  addBarChart: "bar-chart",
  addLineChart: "line-chart",
  addDataTable: "data-table",
  addFilterBar: "filter-bar",
};

interface ChatPanelProps {
  pageId: string;
  open: boolean;
  onClose: () => void;
  initialMessages?: { id: string; role: "user" | "assistant"; content: string }[];
}

export function ChatPanel({ pageId, open, onClose, initialMessages = [] }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const { addWidget, clearWidgets, updatePageTitle, pages } = usePageStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Track processed tool call IDs to prevent double-processing
  const processedToolCalls = useRef(new Set<string>());

  const page = pages[pageId];

  const uiInitialMessages = useMemo(
    () =>
      initialMessages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        parts: [{ type: "text" as const, text: m.content }],
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat", body: { pageId } }),
    [pageId]
  );

  const { messages, sendMessage, status, error } = useChat({
    transport,
    messages: uiInitialMessages,
    onFinish: () => {
      // Single persist call after AI finishes all tool calls
      setTimeout(() => {
        const updatedPage = usePageStore.getState().pages[pageId];
        if (updatedPage) {
          fetch(`/api/pages/${pageId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ config: updatedPage }),
          }).catch(console.error);
        }
      }, 50);
    },
  });

  // Process tool calls from messages as they arrive (more reliable than onToolCall in v6)
  useEffect(() => {
    console.log("[ChatPanel] messages changed, count:", messages.length, "status:", status);
    for (const msg of messages) {
      if (msg.role !== "assistant") continue;
      console.log("[ChatPanel] assistant msg parts:", msg.parts.map(p => ({ type: (p as Record<string,unknown>).type, state: (p as Record<string,unknown>).state })));
      for (const part of msg.parts) {
        const p = part as Record<string, unknown>;
        const partType = p.type as string | undefined;
        if (!partType?.startsWith("tool-")) continue;

        const toolCallId = p.toolCallId as string | undefined;
        if (!toolCallId) continue;

        // Only process when full input is available (input-available = client tool,
        // output-available = server-executed tool with execute: async () => ({ ok: true }))
        const state = p.state as string | undefined;
        console.log("[ChatPanel] tool part:", partType, "state:", state, "id:", toolCallId);
        if (state !== "input-available" && state !== "output-available") continue;

        // Skip already-processed tool calls
        if (processedToolCalls.current.has(toolCallId)) continue;
        processedToolCalls.current.add(toolCallId);

        // "tool-addMetricCard" -> "addMetricCard"
        const toolName = partType.slice(5);
        const input = (p.input ?? {}) as Record<string, unknown>;

        if (toolName === "clearPage") {
          clearWidgets(pageId);
          continue;
        }
        if (toolName === "setPageTitle") {
          updatePageTitle(pageId, input.title as string);
          continue;
        }

        const widgetType = WIDGET_MAP[toolName];
        if (widgetType) {
          const { colSpan = 4, rowSpan = 2, ...props } = input;
          addWidget(pageId, {
            type: widgetType,
            colSpan: colSpan as number,
            rowSpan: rowSpan as number,
            props,
          });
        }
      }
    }
  }, [messages, pageId, addWidget, clearWidgets, updatePageTitle]);

  const isLoading = status === "submitted" || status === "streaming";

  // Detect if the last assistant message contains tool calls (dashboard being built)
  const lastMsg = messages[messages.length - 1];
  const isBuilding =
    isLoading &&
    lastMsg?.role === "assistant" &&
    lastMsg.parts.some((p) =>
      (p as Record<string, unknown>).type?.toString().startsWith("tool-")
    );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    sendMessage({ text: inputValue });
    setInputValue("");
  };

  return (
    <>
      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-96 bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-40 flex flex-col transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Dashboard Chat</p>
            <p className="text-xs text-zinc-400 truncate max-w-[200px]">{page?.title}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="text-center text-zinc-400 text-sm mt-8 px-4">
              <p className="mb-3">Tell me what to show on this page.</p>
              <p className="text-xs">Example: &quot;Show sales for the last month&quot;</p>
            </div>
          )}
          {messages.map((m) => {
            const text = m.parts
              .filter((p) => p.type === "text")
              .map((p) => (p as { type: "text"; text: string }).text)
              .join("");

            const toolCount = m.parts.filter((p) =>
              (p as Record<string, unknown>).type?.toString().startsWith("tool-")
            ).length;

            // Skip completely empty assistant messages
            if (!text && toolCount === 0 && m.role !== "user") return null;

            return (
              <div
                key={m.id}
                className={cn(
                  "rounded-xl px-4 py-3 text-sm max-w-[85%]",
                  m.role === "user"
                    ? "bg-indigo-600 text-white self-end"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 self-start"
                )}
              >
                {text ||
                  (toolCount > 0
                    ? `Added ${toolCount} widget${toolCount === 1 ? '' : 's'}`
                    : isLoading
                    ? "..."
                    : "")}
              </div>
            );
          })}
          {isLoading && (
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 self-start flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />
              <span className="text-xs text-zinc-400">
                {isBuilding ? "Building dashboard..." : "Thinking..."}
              </span>
            </div>
          )}
          {error && (
            <div className="rounded-xl px-4 py-3 text-sm self-start bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-start gap-2 max-w-[85%]">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error.message || "Something went wrong"}</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-2"
        >
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Describe what to build..."
            className="flex-1 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </>
  );
}
