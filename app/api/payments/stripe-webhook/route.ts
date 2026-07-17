import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature") || "";

    const merchants = await query(
      "SELECT api_key, webhook_secret FROM merchants WHERE type = 'stripe' AND is_active = 1 LIMIT 1"
    );
    const merchant = (merchants as any[])[0];
    if (!merchant?.webhook_secret) {
      return NextResponse.json({ error: "No Stripe merchant configured" }, { status: 400 });
    }

    const stripe = new Stripe(merchant.api_key || "", { apiVersion: "2025-03-31.basil" as any });
    const event = stripe.webhooks.constructEvent(body, signature, merchant.webhook_secret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const invoiceId = session.metadata?.invoice_id;

      if (invoiceId) {
        await query(
          "UPDATE payments SET status = 'completed', transaction_id = ?, paid_at = NOW() WHERE invoice_id = ? AND status = 'pending'",
          [session.id, invoiceId]
        );
        await query("UPDATE invoices SET status = 'paid' WHERE id = ?", [invoiceId]);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
