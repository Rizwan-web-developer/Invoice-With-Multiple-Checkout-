"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadInvoices(); }, []);

  const loadInvoices = async () => {
    try {
      const res = await fetch("/api/invoices");
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this invoice?")) return;
    try {
      await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      loadInvoices();
    } catch (err) { console.error(err); }
  };

  const isUnpaid = (status: string) => ["sent", "draft", "overdue"].includes(status);
  const isPaid = (status: string) => status === "paid";

  const getStatusBadge = (status: string) => {
    if (isPaid(status)) return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700";
    return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700";
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" /></div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Invoices</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage all invoices</p>
        </div>
        <Link href="/dashboard/invoices/create"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
          + Create Invoice
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-6 py-3 font-medium text-zinc-500">Invoice</th>
                <th className="px-6 py-3 font-medium text-zinc-500">Client</th>
                <th className="px-6 py-3 font-medium text-zinc-500">Amount</th>
                <th className="px-6 py-3 font-medium text-zinc-500">Status</th>
                <th className="px-6 py-3 font-medium text-zinc-500">Issue Date</th>
                <th className="px-6 py-3 font-medium text-zinc-500">Due Date</th>
                <th className="px-6 py-3 font-medium text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-zinc-400">
                    No invoices yet.{" "}
                    <Link href="/dashboard/invoices/create" className="font-medium text-zinc-900 underline dark:text-zinc-100">
                      Create your first invoice
                    </Link>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const unpaid = isUnpaid(inv.status);
                  return (
                    <tr key={inv.id} className={`border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800/50 dark:hover:bg-zinc-800/30 ${unpaid ? "bg-red-50/40 dark:bg-red-950/20" : "bg-green-50/40 dark:bg-green-950/20"}`}>
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                        <Link href={`/dashboard/invoices/${inv.id}`} className="hover:underline">{inv.invoice_number}</Link>
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{inv.client_name || "N/A"}</td>
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">${parseFloat(inv.total).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(inv.status)}`}>
                          {inv.status === "paid" ? "Paid" : "Unpaid"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-500">{inv.issue_date ? new Date(inv.issue_date).toLocaleDateString() : "N/A"}</td>
                      <td className="px-6 py-4 text-zinc-500">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "N/A"}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link href={`/dashboard/invoices/${inv.id}`} className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">View</Link>
                          <button onClick={() => handleDelete(inv.id)} className="text-sm font-medium text-red-600 hover:text-red-800">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
