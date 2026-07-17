"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function SettingsPage() {
  const [form, setForm] = useState({
    name: "", company_name: "", company_address: "",
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [previewProfile, setPreviewProfile] = useState("");
  const [previewLogo, setPreviewLogo] = useState("");
  const [currentProfile, setCurrentProfile] = useState("");
  const [currentLogo, setCurrentLogo] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setForm({ name: data.user.name || "", company_name: data.user.company_name || "", company_address: data.user.company_address || "" });
          setCurrentProfile(data.user.profile_image || "");
          setCurrentLogo(data.user.company_logo || "");
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("company_name", form.company_name);
      formData.append("company_address", form.company_address);
      if (profileImage) formData.append("profile_image", profileImage);
      if (companyLogo) formData.append("company_logo", companyLogo);

      const res = await fetch("/api/auth/me", {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage("Settings saved successfully!");
      setCurrentProfile(data.user.profile_image || currentProfile);
      setCurrentLogo(data.user.company_logo || currentLogo);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">Manage your profile and company information</p>
      </div>

      {message && (
        <div className={`mb-4 rounded-md border px-4 py-3 text-sm ${
          message.startsWith("Error") ? "border-red-200 bg-red-50 text-red-600" : "border-green-200 bg-green-50 text-green-600"
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Section */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">Profile</h2>

          <div className="mb-4 flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              {previewProfile ? (
                <Image src={previewProfile} alt="" fill className="object-cover" />
              ) : currentProfile ? (
                <Image src={currentProfile} alt="" fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-lg font-bold text-zinc-400">
                  {form.name.charAt(0).toUpperCase() || "?"}
                </div>
              )}
            </div>
            <div>
              <label className="cursor-pointer rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                Change Photo
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) { setProfileImage(file); setPreviewProfile(URL.createObjectURL(file)); }
                }} />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Full Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
          </div>
        </div>

        {/* Company Section */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">Company Information</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Company Logo</label>
            <div className="mt-1 flex items-center gap-4">
              <div className="relative h-16 w-32 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                {previewLogo ? (
                  <Image src={previewLogo} alt="" fill className="object-contain p-2" />
                ) : currentLogo ? (
                  <Image src={currentLogo} alt="" fill className="object-contain p-2" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-zinc-400">Logo</div>
                )}
              </div>
              <label className="cursor-pointer rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                Upload Logo
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) { setCompanyLogo(file); setPreviewLogo(URL.createObjectURL(file)); }
                }} />
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Company Name</label>
              <input type="text" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Company Address</label>
              <textarea rows={3} value={form.company_address} onChange={(e) => setForm({ ...form, company_address: e.target.value })}
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                placeholder="Street, City, State, ZIP, Country" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="rounded-md bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
          {loading ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
