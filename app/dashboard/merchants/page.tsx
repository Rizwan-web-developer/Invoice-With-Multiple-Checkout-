"use client";

import { useState, useEffect } from "react";
import { merchantLogos } from "@/lib/merchant-logos";

const merchantTypes = [
  {
    value: "stripe", label: "Stripe",
    logo: <img src={merchantLogos.stripe} alt="Stripe" className="h-8 w-8 rounded object-contain bg-white" />,
    hasKeys: true, keyLabel: "Publishable Key", secretLabel: "Secret Key",
  },
  {
    value: "paypal", label: "PayPal",
    logo: <img src={merchantLogos.paypal} alt="PayPal" className="h-8 w-8 rounded object-contain bg-white" />,
    hasKeys: true, keyLabel: "Client ID", secretLabel: "Secret",
  },
  {
    value: "payoneer", label: "Payoneer",
    logo: <img src={merchantLogos.payoneer} alt="Payoneer" className="h-8 w-8 rounded object-contain bg-white" />,
    hasKeys: false,
  },
  {
    value: "razorpay", label: "Razorpay",
    logo: <img src={merchantLogos.razorpay} alt="Razorpay" className="h-8 w-8 rounded object-contain bg-white" />,
    hasKeys: true, keyLabel: "Key ID", secretLabel: "Key Secret",
  },
  {
    value: "square", label: "Square",
    logo: <img src={merchantLogos.square} alt="Square" className="h-8 w-8 rounded object-contain bg-white" />,
    hasKeys: true, keyLabel: "Application ID", secretLabel: "Access Token",
  },
  {
    value: "bank_transfer", label: "Bank Transfer",
    logo: <img src={merchantLogos.bank_transfer} alt="Bank Transfer" className="h-8 w-8 rounded object-contain bg-white" />,
    hasKeys: false,
  },
  {
    value: "other", label: "Other",
    logo: <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#666"/><path d="M12 6v12M6 12h12" stroke="#fff" strokeWidth="2"/></svg>,
    hasKeys: false,
  },
];

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const defaultForm = {
    type: "stripe" as string, api_key: "", api_secret: "", webhook_secret: "",
    account_email: "", account_holder: "", account_number: "", bank_name: "", is_active: 1,
  };
  const [form, setForm] = useState(defaultForm);

  useEffect(() => { loadMerchants(); }, []);

  const loadMerchants = async () => {
    try {
      const res = await fetch("/api/merchants");
      const data = await res.json();
      setMerchants(data.merchants || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const selectedType = merchantTypes.find((t) => t.value === form.type);
  const needsApiKey = selectedType?.hasKeys;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const payload = { ...form, name: selectedType?.label || form.type };
    try {
      const url = editingId ? `/api/merchants/${editingId}` : "/api/merchants";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowForm(false);
      setForm(defaultForm);
      setEditingId(null);
      loadMerchants();
    } catch (err: any) { setError(err.message); }
  };

  const handleEdit = (m: any) => {
    setForm({
      type: m.type, api_key: m.api_key || "", api_secret: m.api_secret || "",
      webhook_secret: m.webhook_secret || "", account_email: m.account_email || "",
      account_holder: m.account_holder || "", account_number: m.account_number || "",
      bank_name: m.bank_name || "", is_active: m.is_active,
    });
    setEditingId(m.id);
    setShowForm(true);
  };

  const handleToggleActive = async (merchant: any) => {
    await fetch(`/api/merchants/${merchant.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: merchant.is_active ? 0 : 1 }),
    });
    loadMerchants();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this merchant?")) return;
    await fetch(`/api/merchants/${id}`, { method: "DELETE" });
    loadMerchants();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" /></div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Merchants</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage payment gateway accounts</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm(defaultForm); }}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
          + Add Merchant
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-sm text-red-600">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Payment Type *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {merchantTypes.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...defaultForm, type: t.value })}
                    className={`flex items-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all ${
                      form.type === t.value
                        ? "border-zinc-900 bg-zinc-50 text-zinc-900 dark:border-zinc-100 dark:bg-zinc-800 dark:text-zinc-100"
                        : "border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500"
                    }`}
                  >
                    {t.logo}
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {needsApiKey ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{selectedType?.keyLabel || "API Key"} *</label>
                  <input type="text" required value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{selectedType?.secretLabel || "Secret Key"} *</label>
                  <input type="text" required value={form.api_secret} onChange={(e) => setForm({ ...form, api_secret: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Webhook Secret (optional)</label>
                  <input type="text" value={form.webhook_secret} onChange={(e) => setForm({ ...form, webhook_secret: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Account Email</label>
                  <input type="email" value={form.account_email} onChange={(e) => setForm({ ...form, account_email: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Account Holder Name</label>
                  <input type="text" value={form.account_holder} onChange={(e) => setForm({ ...form, account_holder: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Account Number / IBAN</label>
                  <input type="text" value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Bank Name</label>
                  <input type="text" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_active" checked={form.is_active === 1}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })}
                className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900" />
              <label htmlFor="is_active" className="text-sm text-zinc-700 dark:text-zinc-300">Active</label>
            </div>

            <div className="flex gap-3">
              <button type="submit"
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
                {editingId ? "Update" : "Save"} Merchant
              </button>
              <button type="button" onClick={() => { setShowForm(false); setForm(defaultForm); setEditingId(null); }}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {merchants.length === 0 ? (
          <div className="col-span-full rounded-lg border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
            No merchants yet. Add your first payment gateway.
          </div>
        ) : (
          merchants.map((merchant) => {
            const typeInfo = merchantTypes.find((t) => t.value === merchant.type);
            return (
              <div key={merchant.id} className={`rounded-lg border bg-white p-5 shadow-sm dark:bg-zinc-900 ${merchant.is_active ? 'border-zinc-200 dark:border-zinc-700' : 'border-zinc-100 opacity-60 dark:border-zinc-800'}`}>
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {typeInfo?.logo || <div className="h-6 w-6 rounded bg-zinc-200" />}
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{typeInfo?.label || merchant.type}</h3>
                      <span className="text-xs text-zinc-400">{merchant.type}</span>
                    </div>
                  </div>
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${merchant.is_active ? 'bg-green-500' : 'bg-zinc-300'}`} />
                </div>
                <div className="space-y-1 text-xs text-zinc-500">
                  {merchant.api_key && <p>{typeInfo?.keyLabel || "Key"}: {merchant.api_key.substring(0, 8)}...</p>}
                  {merchant.account_email && <p>Email: {merchant.account_email}</p>}
                  {merchant.account_holder && <p>Holder: {merchant.account_holder}</p>}
                </div>
                <div className="mt-4 flex gap-3">
                  <button onClick={() => handleEdit(merchant)} className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">Edit</button>
                  <button onClick={() => handleToggleActive(merchant)} className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                    {merchant.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => handleDelete(merchant.id)} className="text-xs font-medium text-red-600 hover:text-red-800">Delete</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
