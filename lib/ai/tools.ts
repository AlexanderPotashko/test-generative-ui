import { tool } from "ai";
import { z } from "zod";
import { queryOrders, queryMetric, queryProducts, getCategories } from "@/lib/db/data-queries";

// ── Server tools (have execute, fetch data for AI context) ─────────────────────

export const serverTools = {
  getDataSources: tool({
    description:
      "Get a list of available data sources and their fields. Call this first to understand what data is available.",
    inputSchema: z.object({}),
    execute: async () => ({
      sources: [
        {
          name: "orders",
          description: "Sales orders with amount, category, status, date",
          fields: ["id", "customerName", "productName", "category", "amount", "quantity", "status", "date", "month"],
          metrics: ["total_revenue", "order_count", "avg_order_value", "completed_orders", "return_rate"],
          groupBy: ["month", "category", "status"],
        },
        {
          name: "transactions",
          description: "Financial transactions (sales, returns, refunds)",
          fields: ["id", "type", "amount", "date", "month", "category"],
          metrics: ["net_revenue", "total_transactions"],
          groupBy: ["month", "category", "type"],
        },
        {
          name: "products",
          description: "Product catalog with pricing and stock",
          fields: ["id", "name", "category", "price", "stock"],
          metrics: ["total_products", "low_stock"],
        },
      ],
    }),
  }),

  queryData: tool({
    description:
      "Query data to preview what's available before deciding which widgets to render. Use this to check data shape.",
    inputSchema: z.object({
      source: z.enum(["orders", "transactions", "products"]).describe("Data source name"),
      groupBy: z.string().optional().describe("Group results by: month, category, status"),
      timeRange: z.string().optional().describe("Time range: 7d, 30d, 90d, 6m, 12m, all"),
      category: z.string().optional().describe("Filter by category"),
      limit: z.number().int().min(1).max(20).optional().default(5),
    }),
    execute: async ({ source, groupBy, timeRange, category, limit }) => {
      if (source === "orders") {
        return queryOrders({ timeRange, category, groupBy, limit });
      }
      if (source === "products") {
        return queryProducts({ category, limit });
      }
      return queryOrders({ timeRange, category, groupBy, limit });
    },
  }),

  getCategories: tool({
    description: "Get the list of available product/order categories for filtering.",
    inputSchema: z.object({}),
    execute: async () => {
      const categories = await getCategories();
      return { categories };
    },
  }),
};

// ── Client tools (no execute — rendered on the client) ─────────────────────────

const colSpanSchema = z
  .number()
  .int()
  .min(1)
  .max(12)
  .describe("Width in grid columns (1–12, where 12 = full width)");

const rowSpanSchema = z
  .number()
  .int()
  .min(1)
  .max(6)
  .describe("Height in grid rows (1–6)");

export const clientTools = {
  setPageTitle: tool({
    description: "Set the title of the current dashboard page.",
    inputSchema: z.object({
      title: z.string().describe("The new page title"),
    }),
    execute: async () => ({ ok: true }),
  }),

  clearPage: tool({
    description:
      "Remove all widgets from the current page. Use before rebuilding the page from scratch.",
    inputSchema: z.object({}),
    execute: async () => ({ ok: true }),
  }),

  addMetricCard: tool({
    description:
      "Add a KPI metric card showing a single number with a label. Perfect for totals like revenue, order count, etc.",
    inputSchema: z.object({
      title: z.string().describe("Card title displayed above the metric"),
      dataSource: z
        .enum(["orders", "transactions", "products"])
        .describe("Data source"),
      metric: z
        .string()
        .describe(
          "Metric key: total_revenue | order_count | avg_order_value | completed_orders | return_rate | net_revenue | total_transactions | total_products | low_stock"
        ),
      timeRange: z
        .string()
        .optional()
        .describe("Time range: 7d | 30d | 90d | 6m | 12m | all"),
      category: z.string().optional().describe("Filter by category"),
      format: z
        .enum(["number", "currency", "percent"])
        .optional()
        .default("number")
        .describe("Number format"),
      colSpan: colSpanSchema.default(3),
      rowSpan: rowSpanSchema.default(1),
    }),
    execute: async () => ({ ok: true }),
  }),

  addBarChart: tool({
    description:
      "Add a bar chart. Great for comparing categories, monthly sales, top products, etc.",
    inputSchema: z.object({
      title: z.string(),
      dataSource: z.enum(["orders", "transactions", "products"]),
      groupBy: z
        .string()
        .describe("Group dimension: month | category | status"),
      metric: z
        .string()
        .describe("Value to measure: total | count | avg"),
      timeRange: z.string().optional(),
      category: z.string().optional(),
      color: z.string().optional().default("#6366f1"),
      colSpan: colSpanSchema.default(6),
      rowSpan: rowSpanSchema.default(3),
    }),
    execute: async () => ({ ok: true }),
  }),

  addLineChart: tool({
    description:
      "Add a line/area chart. Best for trends over time (revenue by month, order count trend).",
    inputSchema: z.object({
      title: z.string(),
      dataSource: z.enum(["orders", "transactions"]),
      xAxis: z
        .string()
        .describe("X-axis field: month | date"),
      metric: z.string().describe("Metric: total_revenue | order_count | net_revenue"),
      timeRange: z.string().optional(),
      category: z.string().optional(),
      color: z.string().optional().default("#10b981"),
      colSpan: colSpanSchema.default(8),
      rowSpan: rowSpanSchema.default(3),
    }),
    execute: async () => ({ ok: true }),
  }),

  addDataTable: tool({
    description:
      "Add a sortable data table with pagination. Good for showing raw records or ranked lists.",
    inputSchema: z.object({
      title: z.string(),
      dataSource: z.enum(["orders", "products"]),
      columns: z
        .array(z.string())
        .describe(
          "Columns to show. For orders: date, customerName, productName, category, amount, status. For products: name, category, price, stock"
        ),
      timeRange: z.string().optional(),
      category: z.string().optional(),
      status: z.string().optional(),
      pageSize: z.number().int().min(5).max(50).optional().default(10),
      colSpan: colSpanSchema.default(12),
      rowSpan: rowSpanSchema.default(4),
    }),
    execute: async () => ({ ok: true }),
  }),

  addFilterBar: tool({
    description:
      "Add a filter bar that controls all other widgets on the page. Add this first if the user wants to filter data.",
    inputSchema: z.object({
      filters: z.array(
        z.object({
          id: z.string(),
          type: z.enum(["date_range", "category_select"]),
          label: z.string(),
          field: z.string(),
          options: z.array(z.string()).optional(),
        })
      ),
      colSpan: colSpanSchema.default(12),
      rowSpan: rowSpanSchema.default(1),
    }),
    execute: async () => ({ ok: true }),
  }),
};

export const allTools = { ...serverTools, ...clientTools };
