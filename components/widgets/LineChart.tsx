"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { LineChartProps } from "@/types/page-config";

interface DataRow {
  group: string;
  total: number;
  count: number;
}

const METRIC_TO_KEY: Record<string, string> = {
  total_revenue: "total",
  order_count: "count",
  net_revenue: "total",
};

export function LineChart({ title, dataSource, xAxis, metric, timeRange, category, color = "#10b981" }: LineChartProps & { category?: string }) {
  const [data, setData] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ groupBy: xAxis });
    if (timeRange) params.set("timeRange", timeRange);
    if (category) params.set("category", category);

    fetch(`/api/data/${dataSource}?${params}`)
      .then((r) => r.json())
      .then((d) => setData(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [dataSource, xAxis, timeRange, category]);

  const valueKey = METRIC_TO_KEY[metric] ?? "total";

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 flex flex-col gap-4 h-full">
      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{title}</p>
      {loading ? (
        <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
      ) : (
        <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
            <defs>
              <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
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
            <Area
              type="monotone"
              dataKey={valueKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${color.replace("#", "")})`}
            />
          </AreaChart>
        </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
