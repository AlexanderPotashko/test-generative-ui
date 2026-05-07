export type WidgetType =
  | "metric-card"
  | "bar-chart"
  | "line-chart"
  | "data-table"
  | "filter-bar";

export interface Widget {
  id: string;
  type: WidgetType;
  colSpan: number; // 1–12
  rowSpan: number; // 1–6
  colStart?: number;
  props: Record<string, unknown>;
}

export interface PageConfig {
  pageId: string;
  title: string;
  widgets: Widget[];
}

// ---- Widget-specific props ----

export interface MetricCardProps {
  title: string;
  dataSource: string;
  metric: string;
  timeRange?: string;
  format?: "number" | "currency" | "percent";
}

export interface BarChartProps {
  title: string;
  dataSource: string;
  groupBy: string;
  metric: string;
  timeRange?: string;
  color?: string;
}

export interface LineChartProps {
  title: string;
  dataSource: string;
  xAxis: string;
  metric: string;
  timeRange?: string;
  color?: string;
}

export interface DataTableProps {
  title: string;
  dataSource: string;
  columns: string[];
  pageSize?: number;
}

export interface FilterBarProps {
  filters: FilterDef[];
}

export interface FilterDef {
  id: string;
  type: "date_range" | "category_select";
  label: string;
  field: string;
  options?: string[];
}
