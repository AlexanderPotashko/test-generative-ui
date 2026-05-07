"use client";

import { useEffect, useState } from "react";

function formatValue(value: number, format: string): string {
  if (format === "currency") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }
  if (format === "percent") {
    return `${value.toFixed(2)}%`;
  }
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

import type { MetricCardProps } from "@/types/page-config";

export function MetricCard({ title, dataSource, metric, timeRange, category, format = "number" }: MetricCardProps & { category?: string }) {
  const [data, setData] = useState<{ value: number; label: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ metric });
    if (timeRange) params.set("timeRange", timeRange);
    if (category) params.set("category", category);

    fetch(`/api/data/${dataSource}?${params}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [dataSource, metric, timeRange, category]);

  return (
    <div style={{ background: "var(--card-bg, #ffffff)", border: "1px solid var(--card-border, #e4e4e7)" }} className="rounded-xl px-4 py-3 h-full flex flex-col justify-center gap-0.5">
      <p className="text-xs font-medium truncate" style={{ color: "#71717a" }}>{title}</p>
      {loading ? (
        <div className="h-7 w-28 rounded animate-pulse mt-1" style={{ background: "#f4f4f5" }} />
      ) : (
        <p className="text-2xl font-bold tabular-nums leading-tight" style={{ color: "#09090b" }}>
          {data ? formatValue(data.value, format) : "—"}
        </p>
      )}
    </div>
  );
}
