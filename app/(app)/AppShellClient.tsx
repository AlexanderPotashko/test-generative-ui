"use client";

import { useEffect } from "react";
import { usePageStore } from "@/lib/store/page-store";
import { TabBar } from "@/components/layout/TabBar";
import type { PageConfig } from "@/types/page-config";

interface AppShellClientProps {
  pages: PageConfig[];
  userId: string;
  children: React.ReactNode;
}

export function AppShellClient({ pages, userId, children }: AppShellClientProps) {
  const { setPages } = usePageStore();

  useEffect(() => {
    setPages(pages);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <TabBar userId={userId} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
