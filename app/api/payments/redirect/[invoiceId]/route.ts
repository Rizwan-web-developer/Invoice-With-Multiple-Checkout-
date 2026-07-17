import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  try {
    const { invoiceId } = await params;

    const invoices = await query(`
      SELECT i.*, m.id as merchant_id, m.name as merchant_name, m.type as merchant_type,
             m.api_key, m.api_secret, m.account_email, m.account_holder, m.account_number, m.bank_name
      FROM invoices i
      LEFT JOIN merchants m ON i.merchant_id = m.id
      WHERE i.id = ? AND m.is_active = 1
    `, [invoiceId]);

    const invoice = (invoices as any[])[0];
    if (!invoice) {
      return NextResponse.redirect(new URL("/checkout/" + invoiceId, request.url));
    }

    const baseUrl = process.env.BASE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    // Stripe - create checkout session & redirect
    if (invoice.merchant_type === "stripe" && invoice.api_key) {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(invoice.api_secret || invoice.api_key, { apiVersion: "2025-03-31.basil" as any });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { name: `Invoice #${invoice.invoice_number}` },
              unit_amount: Math.round(Number(invoice.total) * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${baseUrl}/checkout/${invoiceId}?success=true`,
        cancel_url: `${baseUrl}/checkout/${invoiceId}?canceled=true`,
        metadata: { invoice_id: invoiceId },
      });

      if (session.url) {
        return NextResponse.redirect(session.url);
      }
    }

    // PayPal - redirect to PayPal checkout
    if (invoice.merchant_type === "paypal") {
      const paypalUrl = `https://www.paypal.com/checkout?amount=${Number(invoice.total).toFixed(2)}&currency=USD&invoice=${invoice.invoice_number}`;
      return NextResponse.redirect(paypalUrl);
    }

    // Razorpay
    if (invoice.merchant_type === "razorpay") {
      const razorpayUrl = `https://razorpay.com/checkout/?amount=${Number(invoice.total) * 100}&invoice=${invoice.invoice_number}`;
      return NextResponse.redirect(razorpayUrl);
    }

    // Square
    if (invoice.merchant_type === "square") {
      const squareUrl = `https://squareup.com/checkout/?amount=${Number(invoice.total).toFixed(2)}&invoice=${invoice.invoice_number}`;
      return NextResponse.redirect(squareUrl);
    }

    // Default: redirect to local checkout page (for bank_transfer, payoneer, other)
    return NextResponse.redirect(new URL("/checkout/" + invoiceId, request.url));
  } catch (error: any) {
    const baseUrl = process.env.BASE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    return NextResponse.redirect(new URL("/checkout/" + params, baseUrl));
  }
}
