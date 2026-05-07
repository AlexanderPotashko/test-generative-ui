import { auth } from "@/auth";
import {
  queryOrders,
  queryMetric,
  queryProducts,
  getCategories,
} from "@/lib/db/data-queries";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ source: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { source } = await params;
  const url = new URL(req.url);
  const q = (key: string) => url.searchParams.get(key) ?? undefined;

  const timeRange = q("timeRange");
  const category = q("category");
  const groupBy = q("groupBy");
  const metric = q("metric");
  const status = q("status");
  const limit = parseInt(q("limit") ?? "100");

  try {
    // Single metric value
    if (metric && ["total_revenue", "order_count", "avg_order_value", "completed_orders", "return_rate", "net_revenue", "total_transactions", "total_products", "low_stock"].includes(metric)) {
      const data = await queryMetric({ source, metric, timeRange, category });
      return NextResponse.json(data);
    }

    if (source === "orders") {
      const data = await queryOrders({ timeRange, category, groupBy, status, limit });
      return NextResponse.json(data);
    }

    if (source === "products") {
      const data = await queryProducts({ category, limit });
      return NextResponse.json(data);
    }

    if (source === "categories") {
      const data = await getCategories();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Unknown source" }, { status: 400 });
  } catch (err) {
    console.error("[data api]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
