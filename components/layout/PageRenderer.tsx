"use client";

import { MetricCard } from "@/components/widgets/MetricCard";
import { BarChart } from "@/components/widgets/BarChart";
import { LineChart } from "@/components/widgets/LineChart";
import { DataTable } from "@/components/widgets/DataTable";
import { FilterBar } from "@/components/widgets/FilterBar";
import { usePageStore } from "@/lib/store/page-store";
import type { Widget } from "@/types/page-config";

interface PageRendererProps {
  pageId: string;
}

function WidgetWrapper({ widget, pageId }: { widget: Widget; pageId: string }) {
  const { filters } = usePageStore();
  const pageFilters = filters[pageId] ?? {};
  const p = widget.props as Record<string, unknown>;

  // Merge page-level filters into widget props
  const timeRange = (pageFilters["timeRange"] as string) || (p.timeRange as string);
  const category = (pageFilters["category"] as string) || (p.category as string);

  const style: React.CSSProperties = {
    gridColumn: widget.colStart
      ? `${widget.colStart} / span ${widget.colSpan}`
      : `span ${widget.colSpan}`,
    gridRow: `span ${widget.rowSpan}`,
  };

  return (
    <div style={style} className="min-h-0">
      {widget.type === "metric-card" && (
        <MetricCard
          title={p.title as string}
          dataSource={p.dataSource as string}
          metric={p.metric as string}
          timeRange={timeRange}
          category={category}
          format={(p.format as "number" | "currency" | "percent") ?? "number"}
        />
      )}
      {widget.type === "bar-chart" && (
        <BarChart
          title={p.title as string}
          dataSource={p.dataSource as string}
          groupBy={p.groupBy as string}
          metric={p.metric as string}
          timeRange={timeRange}
          category={category}
          color={(p.color as string) ?? "#6366f1"}
        />
      )}
      {widget.type === "line-chart" && (
        <LineChart
          title={p.title as string}
          dataSource={p.dataSource as string}
          xAxis={p.xAxis as string}
          metric={p.metric as string}
          timeRange={timeRange}
          category={category}
          color={(p.color as string) ?? "#10b981"}
        />
      )}
      {widget.type === "data-table" && (
        <DataTable
          title={p.title as string}
          dataSource={p.dataSource as string}
          columns={p.columns as string[]}
          timeRange={timeRange}
          category={category}
          status={p.status as string | undefined}
          pageSize={(p.pageSize as number) ?? 10}
        />
      )}
      {widget.type === "filter-bar" && (
        <FilterBar
          filters={p.filters as import("@/types/page-config").FilterDef[]}
          pageId={pageId}
        />
      )}
    </div>
  );
}

export function PageRenderer({ pageId }: PageRendererProps) {
  const { pages } = usePageStore();
  const page = pages[pageId];

  if (!page) return null;

  if ((page.widgets ?? []).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-4 px-8">
        <div className="text-5xl">✨</div>
        <h2 className="text-xl font-semibold text-zinc-700 dark:text-zinc-300">
          Your dashboard is empty
        </h2>
        <p className="text-zinc-400 max-w-sm">
          Open the chat panel and tell me what you want to see. For example:{" "}
          <em>&quot;Show me sales overview for the last 30 days&quot;</em>
        </p>
      </div>
    );
  }

  return (
    <div
      className="grid gap-4 p-6 h-full auto-rows-[minmax(80px,auto)]"
      style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}
    >
      {(page.widgets ?? []).map((widget) => (
        <WidgetWrapper key={widget.id} widget={widget} pageId={pageId} />
      ))}
    </div>
  );
}
