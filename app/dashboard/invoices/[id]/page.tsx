"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { merchantLogos } from "@/lib/merchant-logos";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadInvoice();
  }, []);

  const loadInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${params.id}`);
      const data = await res.json();
      setInvoice(data.invoice);
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    setSending(true);
    setMessage("");
    try {
      const res = await fetch(`/api/invoices/${params.id}/send-email`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage("Email sent successfully!");
      loadInvoice();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const isPaid = status === "paid";
    const base = isPaid
      ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700"
      : "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700";
    return base;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" /></div>;
  }

  if (!invoice) {
    return <div className="py-20 text-center text-zinc-500">Invoice not found</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{invoice.invoice_number}</h1>
            <span className={`inline-block rounded-full border px-3 py-0.5 text-xs font-medium ${getStatusBadge(invoice.status)}`}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">{invoice.client_name || "No client"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/invoices/${params.id}/pdf`} target="_blank"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
            Download PDF
          </a>
          <button onClick={handleSendEmail} disabled={sending}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
            {sending ? "Sending..." : "Send Email"}
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 rounded-md border px-4 py-3 text-sm ${
          message.startsWith("Error") ? "border-red-200 bg-red-50 text-red-600" : "border-green-200 bg-green-50 text-green-600"
        }`}>
          {message}
        </div>
      )}

      {/* Invoice Preview */}
      <div className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">

        {/* Top Section: Logo + Business Name left, Invoice metadata right */}
        <div className="mb-8 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {invoice.company_logo ? (
              <img src={invoice.company_logo} alt="Business Logo" className="h-14 w-auto object-contain" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <svg className="h-7 w-7 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{invoice.company_name || "Your Business"}</h2>
              {invoice.company_address && <p className="mt-0.5 text-xs text-zinc-500 whitespace-pre-line">{invoice.company_address}</p>}
            </div>
          </div>
          <div className="text-right">
            <div className="space-y-1 text-sm">
              <p><span className="font-medium text-zinc-500">Invoice Number:</span> <span className="text-zinc-900 dark:text-zinc-100">{invoice.invoice_number}</span></p>
              <p><span className="font-medium text-zinc-500">Issue Date:</span> <span className="text-zinc-900 dark:text-zinc-100">{invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : ""}</span></p>
              <p><span className="font-medium text-zinc-500">Due Date:</span> <span className="text-zinc-900 dark:text-zinc-100">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : ""}</span></p>
            </div>
          </div>
        </div>

        {/* INVOICE Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold uppercase tracking-wide text-zinc-900 dark:text-zinc-100">Invoice</h1>
          <p className="mt-1 text-sm text-zinc-500">#{invoice.invoice_number}</p>
        </div>

        <div className="mb-8 border-t border-zinc-200 dark:border-zinc-800" />

        {/* From / Bill To */}
        <div className="mb-8 grid gap-8 sm:grid-cols-2">
          {/* From */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">From</p>
            <div className="mt-2 flex items-center gap-2">
              {invoice.company_logo && <img src={invoice.company_logo} alt="Logo" className="h-6 w-6 rounded object-contain" />}
              <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{invoice.company_name || "Your Business"}</p>
            </div>
            {invoice.company_address && (
              <p className="mt-1 text-sm text-zinc-600 whitespace-pre-line dark:text-zinc-400">{invoice.company_address}</p>
            )}
          </div>
          {/* Bill To */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Bill To</p>
            <p className="mt-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">{invoice.client_name}</p>
            {invoice.client_company && <p className="text-sm text-zinc-600 dark:text-zinc-400">{invoice.client_company}</p>}
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{invoice.client_email}</p>
            {invoice.client_phone && <p className="text-sm text-zinc-600 dark:text-zinc-400">{invoice.client_phone}</p>}
            {invoice.client_address && <p className="mt-1 text-sm text-zinc-500 whitespace-pre-line">{invoice.client_address}</p>}
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-zinc-900 dark:border-zinc-100">
              <th className="pb-2 font-semibold text-zinc-900 dark:text-zinc-100">Description</th>
              <th className="pb-2 text-center font-semibold text-zinc-900 dark:text-zinc-100">Qty</th>
              <th className="pb-2 text-right font-semibold text-zinc-900 dark:text-zinc-100">Unit Price</th>
              <th className="pb-2 text-right font-semibold text-zinc-900 dark:text-zinc-100">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="py-3 text-zinc-700 dark:text-zinc-300">
                  <p className="font-medium">{item.description}</p>
                </td>
                <td className="py-3 text-center text-zinc-700 dark:text-zinc-300">{item.quantity}</td>
                <td className="py-3 text-right text-zinc-700 dark:text-zinc-300">${Number(item.unit_price).toFixed(2)}</td>
                <td className="py-3 text-right font-medium text-zinc-900 dark:text-zinc-100">${Number(item.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Payment Details & Totals */}
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          {/* Payment Details */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Payment Details</p>
            {invoice.merchant_name ? (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  {merchantLogos[invoice.merchant_type] ? (
                    <img src={merchantLogos[invoice.merchant_type]} alt={invoice.merchant_name} className="h-6 w-6 rounded object-contain bg-white" />
                  ) : null}
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{invoice.merchant_name}</span>
                </div>
                <div className="space-y-1 text-sm">
                  {invoice.merchant_bank && <p className="text-zinc-600 dark:text-zinc-400"><span className="font-medium text-zinc-500">Bank:</span> <span className="text-zinc-900 dark:text-zinc-100">{invoice.merchant_bank}</span></p>}
                  {invoice.merchant_account && <p className="text-zinc-600 dark:text-zinc-400"><span className="font-medium text-zinc-500">Account:</span> <span className="text-zinc-900 dark:text-zinc-100">{invoice.merchant_account}</span></p>}
                  {invoice.merchant_email && <p className="text-zinc-600 dark:text-zinc-400"><span className="font-medium text-zinc-500">Email:</span> <span className="text-zinc-900 dark:text-zinc-100">{invoice.merchant_email}</span></p>}
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-zinc-400">No payment method set</p>
            )}
          </div>

          {/* Totals */}
          <div className="space-y-2 text-right">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Subtotal</span>
              <span className="text-zinc-900 dark:text-zinc-100">${Number(invoice.subtotal).toFixed(2)}</span>
            </div>
            {Number(invoice.tax) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Tax ({invoice.tax_rate}%)</span>
                <span className="text-zinc-900 dark:text-zinc-100">${Number(invoice.tax).toFixed(2)}</span>
              </div>
            )}
            {Number(invoice.discount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Discount</span>
                <span className="text-red-600">-${Number(invoice.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="border-t-2 border-zinc-900 pt-2 dark:border-zinc-100">
              <div className="flex justify-between">
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Total Amount</span>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">${Number(invoice.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-zinc-200 pt-6 text-center text-sm text-zinc-400 dark:border-zinc-800">
          Thank you for choosing Invoice. We appreciate your business.
        </div>
      </div>
    </div>
  );
}
