"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { merchantLogos, merchantLabels } from "@/lib/merchant-logos";

export default function CreateInvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [form, setForm] = useState({
    client_id: "", issue_date: new Date().toISOString().split("T")[0],
    due_date: "", tax_rate: "0", discount: "0", merchant_id: "",
  });
  const [items, setItems] = useState([{ description: "", quantity: 1, unit_price: 0 }]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/clients").then(r => r.json()).then(d => setClients(d.clients || []));
    fetch("/api/merchants").then(r => r.json()).then(d => setMerchants(d.merchants || []));
  }, []);

  const addItem = () => setItems([...items, { description: "", quantity: 1, unit_price: 0 }]);
  const removeItem = (i: number) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)); };

  const updateItem = (i: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[i] as any)[field] = value;
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const tax = subtotal * (parseFloat(form.tax_rate || "0") / 100);
  const discount = parseFloat(form.discount || "0");
  const total = subtotal + tax - discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        client_id: parseInt(form.client_id),
        issue_date: form.issue_date,
        due_date: form.due_date,
        items: items.map((item) => ({
          description: item.description,
          quantity: parseFloat(item.quantity as any),
          unit_price: parseFloat(item.unit_price as any),
        })),
        tax_rate: parseFloat(form.tax_rate || "0"),
        discount: parseFloat(form.discount || "0"),
        status: "sent",
        merchant_id: form.merchant_id ? parseInt(form.merchant_id) : null,
      };

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/dashboard/invoices/${data.invoice.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Create Invoice</h1>
        <p className="mt-1 text-sm text-zinc-500">Fill in the details to create a new invoice</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">{error}</div>}

        {/* Client & Dates */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">Invoice Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Client *</label>
              <select required value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                <option value="">Select a client</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Select Merchant (optional)</label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <button type="button" onClick={() => setForm({ ...form, merchant_id: "" })}
                  className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-xs font-medium transition-all ${
                    form.merchant_id === ""
                      ? "border-zinc-900 bg-zinc-50 text-zinc-900 dark:border-zinc-100 dark:bg-zinc-800 dark:text-zinc-100"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400"
                  }`}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  No merchant
                </button>
                {merchants.filter(m => m.is_active).map((m) => (
                  <button type="button" key={m.id} onClick={() => setForm({ ...form, merchant_id: String(m.id) })}
                    className={`flex items-center gap-2 rounded-lg border-2 p-3 text-xs font-medium transition-all ${
                      form.merchant_id === String(m.id)
                        ? "border-zinc-900 bg-zinc-50 text-zinc-900 dark:border-zinc-100 dark:bg-zinc-800 dark:text-zinc-100"
                        : "border-zinc-200 text-zinc-500 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400"
                    }`}>
                    {merchantLogos[m.type] ? (
                      <img src={merchantLogos[m.type]} alt={m.name} className="h-6 w-6 rounded object-contain bg-white" />
                    ) : (
                      <div className="h-6 w-6 rounded bg-zinc-200 dark:bg-zinc-700" />
                    )}
                    <span className="truncate">{m.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Issue Date *</label>
              <input type="date" required value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Due Date *</label>
              <input type="date" required value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Invoice Items</h2>
            <button type="button" onClick={addItem}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
              + Add Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex flex-wrap items-end gap-3 rounded-md bg-zinc-50 p-3 dark:bg-zinc-800/50">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Description</label>
                  <input type="text" required placeholder="Item description" value={item.description}
                    onChange={(e) => updateItem(i, "description", e.target.value)}
                    className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                </div>
                <div className="w-20">
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Qty</label>
                  <input type="number" required min="1" step="1" value={item.quantity}
                    onChange={(e) => updateItem(i, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                    className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                </div>
                <div className="w-30">
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Unit Price</label>
                  <input type="number" required min="0" step="0.01" value={item.unit_price}
                    onChange={(e) => updateItem(i, "unit_price", parseFloat(e.target.value) || 0)}
                    className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                </div>
                <div className="w-24 text-right">
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Total</label>
                  <p className="py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">${(item.quantity * item.unit_price).toFixed(2)}</p>
                </div>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)}
                    className="mb-1 rounded-md p-2 text-zinc-400 hover:text-red-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Tax Rate (%)</label>
                <input type="number" min="0" step="0.1" value={form.tax_rate}
                  onChange={(e) => setForm({ ...form, tax_rate: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Discount ($)</label>
                <input type="number" min="0" step="0.01" value={form.discount}
                  onChange={(e) => setForm({ ...form, discount: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
              </div>
              <div className="flex flex-col justify-end">
                <div className="space-y-1 text-right">
                  <p className="text-sm text-zinc-500">Subtotal: <span className="text-zinc-900 dark:text-zinc-100">${subtotal.toFixed(2)}</span></p>
                  {tax > 0 && <p className="text-sm text-zinc-500">Tax: <span className="text-zinc-900 dark:text-zinc-100">${tax.toFixed(2)}</span></p>}
                  {discount > 0 && <p className="text-sm text-zinc-500">Discount: <span className="text-red-600">-${discount.toFixed(2)}</span></p>}
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Total: ${total.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Thank You */}
          <div className="mt-6 border-t border-zinc-200 pt-4 text-center text-sm text-zinc-400 dark:border-zinc-800">
            Thank you for your business!
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="rounded-md bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
            {loading ? "Creating..." : "Create Invoice"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="rounded-md border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
