"use client";

import { useEffect } from "react";
import { usePageStore } from "@/lib/store/page-store";
import type { PageConfig } from "@/types/page-config";

export function PageInitializer({ config }: { config: PageConfig }) {
  const { setPageConfig, setActivePage } = usePageStore();

  useEffect(() => {
    setPageConfig(config);
    setActivePage(config.pageId);
  }, [config.pageId]);

  return null;
}
