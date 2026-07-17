import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Monthly revenue for last 6 months
    const monthlyRevenue = await query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month,
             SUM(total) as revenue,
             COUNT(*) as count
      FROM invoices
      WHERE user_id = ? AND status = 'paid'
        AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `, [user.userId]);

    // Invoice status breakdown
    const statusBreakdown = await query(`
      SELECT status, COUNT(*) as count, SUM(total) as amount
      FROM invoices
      WHERE user_id = ?
      GROUP BY status
    `, [user.userId]);

    // Top clients by revenue
    const topClients = await query(`
      SELECT c.name, c.email, COUNT(i.id) as invoice_count, SUM(i.total) as total_amount
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      WHERE i.user_id = ? AND i.status = 'paid'
      GROUP BY c.id, c.name, c.email
      ORDER BY total_amount DESC
      LIMIT 5
    `, [user.userId]);

    // Merchant usage
    const merchantUsage = await query(`
      SELECT m.name, m.type, COUNT(i.id) as invoice_count, SUM(i.total) as total_amount
      FROM invoices i
      JOIN merchants m ON i.merchant_id = m.id
      WHERE i.user_id = ?
      GROUP BY m.id, m.name, m.type
      ORDER BY total_amount DESC
    `, [user.userId]);

    return NextResponse.json({
      monthlyRevenue: monthlyRevenue || [],
      statusBreakdown: statusBreakdown || [],
      topClients: topClients || [],
      merchantUsage: merchantUsage || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
