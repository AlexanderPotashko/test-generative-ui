"use client";

import { useEffect, useState } from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { BarChartProps } from "@/types/page-config";

interface DataRow {
  group: string;
  total: number;
  count: number;
  avg: number;
}

export function BarChart({ title, dataSource, groupBy, metric, timeRange, category, color = "#6366f1" }: BarChartProps & { category?: string }) {
  const [data, setData] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ groupBy });
    if (timeRange) params.set("timeRange", timeRange);
    if (category) params.set("category", category);

    fetch(`/api/data/${dataSource}?${params}`)
      .then((r) => r.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [dataSource, groupBy, timeRange, category]);

  const valueKey = metric === "count" ? "count" : metric === "avg" ? "avg" : "total";

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 flex flex-col gap-4 h-full">
      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{title}</p>
      {loading ? (
        <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
      ) : (
        <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis
              dataKey="group"
              tick={{ fontSize: 11, fill: "#71717a" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#71717a" }}
              tickLine={false}
              axisLine={false}
              width={60}
              tickFormatter={(v) =>
                v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v
              }
            />
            <Tooltip
              contentStyle={{
                background: "#18181b",
                border: "none",
                borderRadius: 8,
                color: "#fafafa",
                fontSize: 12,
              }}
            />
            <Bar dataKey={valueKey} fill={color} radius={[4, 4, 0, 0]} />
          </RechartsBarChart>
        </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
