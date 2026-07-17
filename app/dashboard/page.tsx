"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface DashboardData {
  totalUsers: number;
  totalInvoices: number;
  totalClients: number;
  totalMerchants: number;
  paidInvoicesCount: number;
  sentInvoicesCount: number;
  paidAmount: number;
  pendingAmount: number;
  recentInvoices: any[];
}

interface AnalyticsData {
  monthlyRevenue: { month: string; revenue: number; count: number }[];
  statusBreakdown: { status: string; count: number; amount: number }[];
  topClients: { name: string; email: string; invoice_count: number; total_amount: number }[];
  merchantUsage: { name: string; type: string; invoice_count: number; total_amount: number }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invRes, cliRes, merRes, usrRes, anaRes] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/clients"),
        fetch("/api/merchants"),
        fetch("/api/users"),
        fetch("/api/analytics"),
      ]);

      const anaData = await anaRes.json();
      if (anaData.monthlyRevenue) setAnalytics(anaData);

      const invData = await invRes.json();
      const cliData = await cliRes.json();
      const merData = await merRes.json();
      const usrData = await usrRes.json();

      const invoices = invData.invoices || [];
      const paidInvoices = invoices.filter((i: any) => i.status === "paid");
      const sentInvoices = invoices.filter((i: any) => i.status === "sent" || i.status === "draft");

      setData({
        totalUsers: usrData.count || 1,
        totalInvoices: invoices.length,
        totalClients: (cliData.clients || []).length,
        totalMerchants: (merData.merchants || []).length,
        paidInvoicesCount: paidInvoices.length,
        sentInvoicesCount: sentInvoices.length,
        paidAmount: paidInvoices.reduce((sum: number, i: any) => sum + parseFloat(i.total || 0), 0),
        pendingAmount: sentInvoices.reduce((sum: number, i: any) => sum + parseFloat(i.total || 0), 0),
        recentInvoices: invoices.slice(0, 5),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent dark:border-zinc-100" />
      </div>
    );
  }

  const stats = [
    { label: "Users", value: data?.totalUsers || 0, color: "bg-zinc-900", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg> },
    { label: "Invoices", value: data?.totalInvoices || 0, color: "bg-zinc-700", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { label: "Clients", value: data?.totalClients || 0, color: "bg-zinc-500", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { label: "Merchants", value: data?.totalMerchants || 0, color: "bg-zinc-400", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
    { label: "Paid", value: data?.paidInvoicesCount || 0, color: "bg-green-600", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: "Unpaid", value: data?.sentInvoicesCount || 0, color: "bg-red-500", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: "Collected", value: `$${(data?.paidAmount || 0).toFixed(2)}`, color: "bg-green-700", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v2m0 4v2m0 4v2m0-10a4 4 0 100 8 4 4 0 000-8z" /></svg> },
    { label: "Pending", value: `$${(data?.pendingAmount || 0).toFixed(2)}`, color: "bg-amber-600", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ];

  const getStatusBadge = (status: string) => {
    const isPaid = status === "paid";
    return isPaid
      ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700"
      : "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700";
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">Overview of your invoice business</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
              <span className="text-zinc-400">{stat.icon}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Invoices */}
      <div className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Recent Invoices</h2>
          <Link href="/dashboard/invoices" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="px-6 py-3 font-medium text-zinc-500">Invoice</th>
                <th className="px-6 py-3 font-medium text-zinc-500">Client</th>
                <th className="px-6 py-3 font-medium text-zinc-500">Amount</th>
                <th className="px-6 py-3 font-medium text-zinc-500">Status</th>
                <th className="px-6 py-3 font-medium text-zinc-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-zinc-400">
                    No invoices yet.{" "}
                    <Link href="/dashboard/invoices/create" className="font-medium text-zinc-900 underline dark:text-zinc-100">
                      Create your first invoice
                    </Link>
                  </td>
                </tr>
              ) : (
                data?.recentInvoices.map((inv: any) => (
                  <tr key={inv.id} className="border-b border-zinc-50 hover:bg-zinc-50 dark:border-zinc-800/50 dark:hover:bg-zinc-800/30">
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                      <Link href={`/dashboard/invoices/${inv.id}`} className="hover:underline">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{inv.client_name || "N/A"}</td>
                    <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100">${parseFloat(inv.total).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(inv.status)}`}>
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {inv.issue_date ? new Date(inv.issue_date).toLocaleDateString() : "N/A"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytics Section */}
      {analytics && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Monthly Revenue */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">Monthly Revenue</h3>
            <div className="flex items-end gap-2" style={{ height: "140px" }}>
              {analytics.monthlyRevenue.length === 0 ? (
                <p className="text-sm text-zinc-400">No data yet</p>
              ) : (
                analytics.monthlyRevenue.map((m) => {
                  const maxRevenue = Math.max(...analytics.monthlyRevenue.map((x) => Number(x.revenue)), 1);
                  const heightPct = (Number(m.revenue) / maxRevenue) * 100;
                  const monthLabel = m.month?.slice(-2) || m.month;
                  return (
                    <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-[10px] font-medium text-zinc-500">${Number(m.revenue).toFixed(0)}</span>
                      <div className="w-full rounded-sm bg-zinc-900 dark:bg-zinc-100" style={{ height: `${heightPct}%`, minHeight: "4px" }} />
                      <span className="text-[10px] text-zinc-400">{monthLabel}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">Invoice Status</h3>
            <div className="space-y-3">
              {analytics.statusBreakdown.length === 0 ? (
                <p className="text-sm text-zinc-400">No invoices yet</p>
              ) : (
                analytics.statusBreakdown.map((s) => {
                  const totalCount = analytics.statusBreakdown.reduce((sum, x) => sum + x.count, 0);
                  const pct = totalCount > 0 ? (s.count / totalCount) * 100 : 0;
                  const colors: Record<string, string> = {
                    paid: "bg-green-500", sent: "bg-red-500", draft: "bg-zinc-400", overdue: "bg-orange-500", cancelled: "bg-zinc-300",
                  };
                  return (
                    <div key={s.status}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300 capitalize">{s.status}</span>
                        <span className="text-zinc-500">{s.count} (${Number(s.amount).toFixed(0)})</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div className={`h-full rounded-full transition-all ${colors[s.status] || "bg-zinc-400"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Top Clients */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">Top Clients</h3>
            <div className="space-y-3">
              {analytics.topClients.length === 0 ? (
                <p className="text-sm text-zinc-400">No paid invoices yet</p>
              ) : (
                analytics.topClients.map((c, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-zinc-100 pb-2 last:border-0 dark:border-zinc-800">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{c.name}</p>
                      <p className="text-xs text-zinc-400">{c.invoice_count} invoices</p>
                    </div>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">${Number(c.total_amount).toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Merchant Usage */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">Merchant Usage</h3>
            <div className="space-y-3">
              {analytics.merchantUsage.length === 0 ? (
                <p className="text-sm text-zinc-400">No merchant transactions yet</p>
              ) : (
                analytics.merchantUsage.map((m, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-zinc-100 pb-2 last:border-0 dark:border-zinc-800">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 capitalize">{m.type}</p>
                      <p className="text-xs text-zinc-400">{m.invoice_count} invoices</p>
                    </div>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">${Number(m.total_amount).toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
