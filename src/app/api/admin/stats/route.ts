import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const revenue = await db.execute(sql`SELECT COALESCE(SUM(total),0)::int as t, COUNT(*)::int as c FROM orders WHERE status != 'cancelled'`);
    const today = await db.execute(sql`SELECT COALESCE(SUM(total),0)::int as t, COUNT(*)::int as c FROM orders WHERE created_at >= CURRENT_DATE AND status != 'cancelled'`);
    const pending = await db.execute(sql`SELECT COUNT(*)::int as c FROM orders WHERE status = 'pending'`);
    const lowStock = await db.execute(sql`SELECT COUNT(*)::int as c FROM product_variants WHERE stock <= 5 AND active = true`);
    const top = await db.execute(sql`SELECT oi.product_name, SUM(oi.quantity)::int as qty, SUM(oi.total)::int as rev FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.status != 'cancelled' GROUP BY oi.product_name ORDER BY qty DESC LIMIT 5`);
    const daily = await db.execute(sql`SELECT TO_CHAR(created_at,'DD Mon') as d, COUNT(*)::int as c, COALESCE(SUM(total),0)::int as t FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '13 days' GROUP BY 1, DATE(created_at) ORDER BY DATE(created_at)`);
    const errors = await db.execute(sql`SELECT * FROM error_logs ORDER BY created_at DESC LIMIT 10`);
    return NextResponse.json({
      total: (revenue.rows[0] as { t: number; c: number }) ?? { t: 0, c: 0 },
      today: (today.rows[0] as { t: number; c: number }) ?? { t: 0, c: 0 },
      pending: (pending.rows[0] as { c: number })?.c ?? 0,
      lowStock: (lowStock.rows[0] as { c: number })?.c ?? 0,
      topProducts: top.rows,
      daily: daily.rows,
      recentErrors: errors.rows,
    });
  } catch (e) {
    console.error("stats failed", e);
    return NextResponse.json({ error: "Could not load stats" }, { status: 500 });
  }
}
