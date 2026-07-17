"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import { merchantLogos } from "@/lib/merchant-logos";

export default function CheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.invoiceId) return;

    if (success === "true") {
      fetch(`/api/invoices/${params.invoiceId}/mark-paid`, { method: "POST" }).catch(() => {});
    }

    fetch(`/api/payments/create-checkout/${params.invoiceId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); }
        else {
          setData(d);
          if (!success && !canceled) {
            const type = d.invoice?.merchant_type;
            if (["stripe", "paypal", "razorpay", "square"].includes(type)) {
              window.location.href = `/api/payments/redirect/${params.invoiceId}`;
              return;
            }
          }
        }
      })
      .catch(() => setError("Failed to load invoice"))
      .finally(() => setLoading(false));
  }, [params.invoiceId, success, canceled]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-[3px] border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
          <p className="text-sm text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (success === "true") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-zinc-950">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Payment Successful!</h1>
          <p className="mt-2 text-zinc-500">Thank you for your payment. A confirmation has been sent to your email.</p>
          <a href={`/api/invoices/${params.invoiceId}/pdf`} target="_blank"
            className="mt-6 inline-block rounded-md bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
            Download Invoice PDF
          </a>
        </div>
      </div>
    );
  }

  if (canceled === "true") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-zinc-950">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Payment Canceled</h1>
          <p className="mt-2 text-zinc-500">Your payment was not completed. You can try again.</p>
          <a href={`/checkout/${params.invoiceId}`}
            className="mt-6 inline-block rounded-md bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
            Try Again
          </a>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-zinc-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Payment Unavailable</h1>
          <p className="mt-2 text-zinc-500">{error || "Invoice not found"}</p>
        </div>
      </div>
    );
  }

  const { invoice, items, company } = data;

  return (
    <div className="min-h-screen bg-zinc-50 py-8 dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-6 text-center">
          {company?.company_logo ? (
            <Image src={company.company_logo} alt="Logo" width={120} height={40} className="mx-auto mb-2" />
          ) : null}
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{company?.company_name || "Company"}</h1>
          <a href={`/api/invoices/${params.invoiceId}/pdf`} target="_blank"
            className="mt-2 inline-block text-xs font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-300">
            Download Invoice PDF
          </a>
        </div>

        <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Invoice #{invoice.invoice_number}
          </h2>
          <p className="text-sm text-zinc-500">Due: {new Date(invoice.due_date).toLocaleDateString()}</p>

          <div className="mt-4 space-y-2">
            {items?.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-zinc-700 dark:text-zinc-300">{item.description} × {item.quantity}</span>
                <span className="text-zinc-900 dark:text-zinc-100">${parseFloat(item.total).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <div className="flex justify-between text-sm text-zinc-500">
              <span>Subtotal</span>
              <span>${parseFloat(invoice.subtotal).toFixed(2)}</span>
            </div>
            {parseFloat(invoice.tax) > 0 && (
              <div className="flex justify-between text-sm text-zinc-500">
                <span>Tax ({invoice.tax_rate}%)</span>
                <span>${parseFloat(invoice.tax).toFixed(2)}</span>
              </div>
            )}
            {parseFloat(invoice.discount) > 0 && (
              <div className="flex justify-between text-sm text-red-500">
                <span>Discount</span>
                <span>-${parseFloat(invoice.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="mt-2 flex justify-between text-lg font-bold text-zinc-900 dark:text-zinc-100">
              <span>Total Due</span>
              <span>${parseFloat(invoice.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {invoice.merchant_id && (
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center gap-3">
              {merchantLogos[invoice.merchant_type] ? (
                <img src={merchantLogos[invoice.merchant_type]} alt={invoice.merchant_name} className="h-8 w-8 rounded object-contain bg-white" />
              ) : null}
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Pay with {invoice.merchant_name}
              </h3>
            </div>

            {(invoice.merchant_type === "bank_transfer") && (
              <div className="space-y-3 rounded-md bg-zinc-50 p-4 dark:bg-zinc-800">
                <div className="flex items-center gap-2">
                  {merchantLogos.bank_transfer && <img src={merchantLogos.bank_transfer} alt="Bank Transfer" className="h-5 w-5 rounded object-contain" />}
                  <h4 className="font-medium text-zinc-900 dark:text-zinc-100">Bank Transfer Details</h4>
                </div>
                {invoice.account_holder && <p className="text-sm text-zinc-600 dark:text-zinc-400">Account Holder: {invoice.account_holder}</p>}
                {invoice.account_number && <p className="text-sm text-zinc-600 dark:text-zinc-400">Account Number: {invoice.account_number}</p>}
                {invoice.bank_name && <p className="text-sm text-zinc-600 dark:text-zinc-400">Bank: {invoice.bank_name}</p>}
                {invoice.account_email && <p className="text-sm text-zinc-600 dark:text-zinc-400">Email: {invoice.account_email}</p>}
                <p className="mt-3 text-xs text-zinc-500">Please include invoice # {invoice.invoice_number} in your payment reference.</p>
              </div>
            )}

            {(invoice.merchant_type === "payoneer") && (
              <div className="space-y-3 rounded-md bg-zinc-50 p-4 dark:bg-zinc-800">
                <div className="flex items-center gap-2">
                  {merchantLogos.payoneer && <img src={merchantLogos.payoneer} alt="Payoneer" className="h-5 w-5 rounded object-contain" />}
                  <h4 className="font-medium text-zinc-900 dark:text-zinc-100">Payoneer Payment</h4>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Please send payment via Payoneer to:</p>
                {invoice.account_email && <p className="text-sm text-zinc-600 dark:text-zinc-400">Email: {invoice.account_email}</p>}
                {invoice.account_holder && <p className="text-sm text-zinc-600 dark:text-zinc-400">Name: {invoice.account_holder}</p>}
              </div>
            )}

            {(invoice.merchant_type === "other") && (
              <div className="space-y-3 rounded-md bg-zinc-50 p-4 dark:bg-zinc-800">
                <h4 className="font-medium text-zinc-900 dark:text-zinc-100">Payment Instructions</h4>
                {invoice.account_email && <p className="text-sm text-zinc-600 dark:text-zinc-400">Email: {invoice.account_email}</p>}
                {invoice.account_holder && <p className="text-sm text-zinc-600 dark:text-zinc-400">Account: {invoice.account_holder}</p>}
                {invoice.account_number && <p className="text-sm text-zinc-600 dark:text-zinc-400">Account #: {invoice.account_number}</p>}
              </div>
            )}

            {["stripe", "paypal", "razorpay", "square"].includes(invoice.merchant_type) && (
              <div className="text-center py-4">
                <div className="mb-3 flex justify-center">
                  {merchantLogos[invoice.merchant_type] && (
                    <img src={merchantLogos[invoice.merchant_type]} alt={invoice.merchant_name} className="h-10 w-10 rounded object-contain bg-white" />
                  )}
                </div>
                <p className="text-sm text-zinc-500">Redirecting to {invoice.merchant_name} to complete your payment...</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-center text-xs text-zinc-400">
          {company?.company_name && <p>{company.company_name}</p>}
        </div>
      </div>
    </div>
  );
}
