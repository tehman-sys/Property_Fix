import type { View } from "./types";

/* ---------- Small helpers ---------- */
export const money = (n: number) => `Rs ${n.toLocaleString("en-US")}`;
export const nav: { id: View; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "properties", label: "Properties" },
  { id: "tenants", label: "Tenants" },
  { id: "leases", label: "Leases" },
  { id: "rent", label: "Rent" },
  { id: "repairs", label: "Repairs" },
];
export const tones: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-rose-50 text-rose-700",
  gray: "bg-stone-100 text-stone-600",
};
export const statusTone: Record<string, string> = {
  Active: "green", Paid: "green", Done: "green",
  Draft: "amber", Partial: "amber", Open: "amber", "In progress": "amber",
  Expired: "red", Unpaid: "red", High: "red",
  Low: "gray", Medium: "gray",
};
export const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-900";
export const btnPrimary =
  "rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700";
export const btnGhost =
  "rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100";

