import { Building2, FileText, LayoutDashboard, Users, Wallet, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { View } from "./types";

export const money = (n: number) => `Rs ${n.toLocaleString("en-US")}`;

export const nav: { id: View; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "properties", label: "Properties", icon: Building2 },
  { id: "tenants", label: "Tenants", icon: Users },
  { id: "leases", label: "Leases", icon: FileText },
  { id: "rent", label: "Rent", icon: Wallet },
  { id: "repairs", label: "Repairs", icon: Wrench },
];

export const tones: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-rose-50 text-rose-700",
  gray: "bg-slate-100 text-slate-600",
};
export const statusTone: Record<string, string> = {
  Active: "green", Paid: "green", Done: "green",
  Draft: "amber", Partial: "amber", Open: "amber", "In progress": "amber",
  Expired: "red", Unpaid: "red", High: "red",
  Low: "gray", Medium: "gray",
};

export const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
export const btnPrimary =
  "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700";
export const btnGhost =
  "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50";
export const btnDanger =
  "rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50";
export const btnSolidDanger =
  "rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700";