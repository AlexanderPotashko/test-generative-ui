import { db } from "@/lib/db";
import { orders, transactions, products } from "@/lib/db/schema";
import { and, eq, gte, lte, sql, sum, count, avg } from "drizzle-orm";

export type TimeRange =
  | "7d"
  | "30d"
  | "90d"
  | "6m"
  | "12m"
  | "all"
  | string; // YYYY-MM

function dateFilter(timeRange?: string) {
  if (!timeRange || timeRange === "all") return undefined;

  const now = new Date();
  const map: Record<string, number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "6m": 180,
    "12m": 365,
  };
  if (map[timeRange]) {
    const from = new Date(now);
    from.setDate(from.getDate() - map[timeRange]);
    return from.toISOString().slice(0, 10);
  }
  // YYYY-MM format
  return `${timeRange}-01`;
}

// ── Orders ────────────────────────────────────────────────────────────────────

export async function queryOrders(params: {
  timeRange?: TimeRange;
  category?: string;
  status?: string;
  groupBy?: string;
  metric?: string;
  limit?: number;
}) {
  const { timeRange, category, status, groupBy, metric, limit = 100 } = params;
  const fromDate = dateFilter(timeRange);

  const conditions = [];
  if (fromDate) conditions.push(gte(orders.date, fromDate));
  if (category) conditions.push(eq(orders.category, category));
  if (status) conditions.push(eq(orders.status, status as "completed" | "pending" | "cancelled" | "refunded"));

  const where = conditions.length ? and(...conditions) : undefined;

  if (groupBy === "month") {
    return db
      .select({
        group: orders.month,
        total: sql<number>`sum(${orders.amount})`,
        count: sql<number>`count(*)`,
        avg: sql<number>`avg(${orders.amount})`,
      })
      .from(orders)
      .where(where)
      .groupBy(orders.month)
      .orderBy(orders.month)
      .limit(limit);
  }

  if (groupBy === "category") {
    return db
      .select({
        group: orders.category,
        total: sql<number>`sum(${orders.amount})`,
        count: sql<number>`count(*)`,
        avg: sql<number>`avg(${orders.amount})`,
      })
      .from(orders)
      .where(where)
      .groupBy(orders.category)
      .orderBy(sql`sum(${orders.amount}) desc`)
      .limit(limit);
  }

  if (groupBy === "status") {
    return db
      .select({
        group: orders.status,
        total: sql<number>`sum(${orders.amount})`,
        count: sql<number>`count(*)`,
        avg: sql<number>`avg(${orders.amount})`,
      })
      .from(orders)
      .where(where)
      .groupBy(orders.status)
      .orderBy(sql`count(*) desc`)
      .limit(limit);
  }

  // Raw list
  return db
    .select()
    .from(orders)
    .where(where)
    .orderBy(sql`${orders.date} desc`)
    .limit(limit);
}

// ── Metrics ───────────────────────────────────────────────────────────────────

export async function queryMetric(params: {
  source: string;
  metric: string;
  timeRange?: TimeRange;
  category?: string;
}) {
  const { source, metric, timeRange, category } = params;
  const fromDate = dateFilter(timeRange);

  if (source === "orders") {
    const conditions = [];
    if (fromDate) conditions.push(gte(orders.date, fromDate));
    if (category) conditions.push(eq(orders.category, category));
    const where = conditions.length ? and(...conditions) : undefined;

    if (metric === "total_revenue") {
      const [row] = await db
        .select({ value: sql<number>`sum(${orders.amount})` })
        .from(orders)
        .where(where);
      return { value: row?.value ?? 0, label: "Total Revenue" };
    }
    if (metric === "order_count") {
      const [row] = await db
        .select({ value: sql<number>`count(*)` })
        .from(orders)
        .where(where);
      return { value: row?.value ?? 0, label: "Total Orders" };
    }
    if (metric === "avg_order_value") {
      const [row] = await db
        .select({ value: sql<number>`avg(${orders.amount})` })
        .from(orders)
        .where(where);
      return { value: row?.value ?? 0, label: "Avg Order Value" };
    }
    if (metric === "completed_orders") {
      const [row] = await db
        .select({ value: sql<number>`count(*)` })
        .from(orders)
        .where(
          and(...(conditions ?? []), eq(orders.status, "completed"))
        );
      return { value: row?.value ?? 0, label: "Completed Orders" };
    }
    if (metric === "return_rate") {
      const [total] = await db
        .select({ value: sql<number>`count(*)` })
        .from(orders)
        .where(where);
      const [returned] = await db
        .select({ value: sql<number>`count(*)` })
        .from(orders)
        .where(
          and(...(conditions ?? []), eq(orders.status, "refunded"))
        );
      const rate =
        total?.value
          ? parseFloat(((returned?.value ?? 0) / total.value * 100).toFixed(2))
          : 0;
      return { value: rate, label: "Return Rate %" };
    }
  }

  if (source === "transactions") {
    const conditions = [];
    if (fromDate) conditions.push(gte(transactions.date, fromDate));
    if (category) conditions.push(eq(transactions.category, category));
    const where = conditions.length ? and(...conditions) : undefined;

    if (metric === "net_revenue") {
      const [row] = await db
        .select({ value: sql<number>`sum(${transactions.amount})` })
        .from(transactions)
        .where(where);
      return { value: row?.value ?? 0, label: "Net Revenue" };
    }
    if (metric === "total_transactions") {
      const [row] = await db
        .select({ value: sql<number>`count(*)` })
        .from(transactions)
        .where(where);
      return { value: row?.value ?? 0, label: "Total Transactions" };
    }
  }

  if (source === "products") {
    if (metric === "total_products") {
      const [row] = await db
        .select({ value: sql<number>`count(*)` })
        .from(products);
      return { value: row?.value ?? 0, label: "Total Products" };
    }
    if (metric === "low_stock") {
      const [row] = await db
        .select({ value: sql<number>`count(*)` })
        .from(products)
        .where(lte(products.stock, 10));
      return { value: row?.value ?? 0, label: "Low Stock Items" };
    }
  }

  return { value: 0, label: metric };
}

// ── Products ──────────────────────────────────────────────────────────────────

export async function queryProducts(params: {
  category?: string;
  limit?: number;
}) {
  const { category, limit = 50 } = params;
  const conditions = category ? [eq(products.category, category)] : [];
  return db
    .select()
    .from(products)
    .where(conditions.length ? and(...conditions) : undefined)
    .limit(limit);
}

// ── Categories list ───────────────────────────────────────────────────────────

export async function getCategories() {
  const rows = await db
    .selectDistinct({ category: orders.category })
    .from(orders);
  return rows.map((r) => r.category);
}
