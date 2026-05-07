"use client";

import { usePageStore } from "@/lib/store/page-store";
import { cn } from "@/lib/cn";
import { X, Plus, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";

interface TabBarProps {
  userId: string;
}

export function TabBar({ userId }: TabBarProps) {
  const { pages, activePageId, setActivePage, removePage } = usePageStore();
  const router = useRouter();

  const pageList = Object.values(pages)
    .filter((p) => !!p?.pageId)
    .sort((a, b) => a.pageId.localeCompare(b.pageId));

  const handleNewPage = async () => {
    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Page" }),
    });
    const { pageId } = await res.json();
    router.push(`/page/${pageId}`);
  };

  const handleClose = async (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation();
    if (pageList.length <= 1) return; // don't close last tab
    await fetch(`/api/pages/${pageId}`, { method: "DELETE" });
    removePage(pageId);
    const remaining = pageList.filter((p) => p.pageId !== pageId);
    if (remaining.length > 0) {
      router.push(`/page/${remaining[0].pageId}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-100 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 w-14 items-center py-3 gap-2 overflow-y-auto">
      {pageList.map((page, i) => (
        <div key={page.pageId} className="relative group w-10">
          <button
            onClick={() => {
              setActivePage(page.pageId);
              router.push(`/page/${page.pageId}`);
            }}
            title={page.title}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center text-xs font-semibold transition-all",
              activePageId === page.pageId
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
          </button>
          {pageList.length > 1 && (
            <button
              onClick={(e) => handleClose(e, page.pageId)}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-zinc-400 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      ))}

      <button
        onClick={handleNewPage}
        title="New page"
        className="w-10 h-10 rounded-lg flex items-center justify-center border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors mt-1"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
