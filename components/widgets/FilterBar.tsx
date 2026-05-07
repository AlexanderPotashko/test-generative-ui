"use client";

import { useEffect, useState } from "react";
import { usePageStore } from "@/lib/store/page-store";
import type { FilterBarProps } from "@/types/page-config";

interface FilterBarWidgetProps extends FilterBarProps {
  pageId: string;
}

export function FilterBar({ filters, pageId }: FilterBarWidgetProps) {
  const { setFilter, filters: activeFilters } = usePageStore();
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/data/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  const pageFilters = activeFilters[pageId] ?? {};

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 px-5 py-3 flex flex-wrap items-center gap-4">
      {filters.map((f) => {
        if (f.type === "date_range") {
          return (
            <div key={f.id} className="flex items-center gap-2">
              <label className="text-xs text-zinc-500 font-medium">{f.label}</label>
              <select
                className="text-sm border border-zinc-200 dark:border-zinc-700 rounded-md px-2 py-1 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                value={pageFilters[f.field] ?? ""}
                onChange={(e) => setFilter(pageId, f.field, e.target.value)}
              >
                <option value="">All time</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="6m">Last 6 months</option>
                <option value="12m">Last 12 months</option>
              </select>
            </div>
          );
        }

        if (f.type === "category_select") {
          const opts = f.options?.length ? f.options : categories;
          return (
            <div key={f.id} className="flex items-center gap-2">
              <label className="text-xs text-zinc-500 font-medium">{f.label}</label>
              <select
                className="text-sm border border-zinc-200 dark:border-zinc-700 rounded-md px-2 py-1 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                value={pageFilters[f.field] ?? ""}
                onChange={(e) => setFilter(pageId, f.field, e.target.value)}
              >
                <option value="">All categories</option>
                {opts.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
