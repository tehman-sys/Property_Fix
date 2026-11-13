"use client";
import { useEffect, useState } from "react";
import { Header } from "../components/Parts";
import { btnGhost, btnPrimary, inputCls } from "../lib/ui";
import type { Settings } from "../lib/types";

const CURRENCIES = ["PKR", "USD", "EUR", "GBP", "AED", "SAR", "INR"];

type Props = {
  settings: Settings;
  onSave: (s: Settings) => Promise<void>;
  onExport: () => Promise<void>;
};

export function SettingsView({ settings, onSave, onExport }: Props) {
  const [form, setForm] = useState<Settings>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(settings), [settings]);

  const dirty = form.ownerName !== settings.ownerName || form.currency !== settings.currency;

  return (
    <>
      <Header title="Settings" subtitle="Your profile and display preferences." />
      <div className="space-y-6">
        <form
          className="max-w-md space-y-4 rounded-xl border border-stone-200 bg-white p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            await onSave(form);
            setSaving(false);
          }}
        >
          <label className="block text-sm">
            <span className="mb-1 block text-stone-600">Owner / organization name</span>
            <input
              className={inputCls}
              value={form.ownerName}
              maxLength={80}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-stone-600">Display currency</span>
            <select
              className={inputCls}
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <span className="mt-1 block text-xs text-stone-500">Display only. Amounts are not converted.</span>
          </label>
          <button type="submit" className={btnPrimary} disabled={!dirty || saving}>
            {saving ? "Saving..." : "Save settings"}
          </button>
        </form>

        <div className="max-w-md rounded-xl border border-stone-200 bg-white p-6">
          <p className="text-sm font-medium">Export data</p>
          <p className="mt-1 text-sm text-stone-500">Download all your properties, tenants, leases, repairs and payments as JSON.</p>
          <button className={`${btnGhost} mt-4`} onClick={onExport}>Download JSON</button>
        </div>
      </div>
    </>
  );
}