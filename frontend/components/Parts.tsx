import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { tones, statusTone, inputCls, btnGhost, btnPrimary } from "../lib/ui";
import type { Field } from "../lib/types";

export function Badge({ text }: { text: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[statusTone[text] ?? "gray"]}`}>
      {text}
    </span>
  );
}

const tints = {
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
};

export function Stat({
  label, value, hint, icon: Icon, tint = "indigo",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tint?: keyof typeof tints;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        {Icon && (
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tints[tint]}`}>
            <Icon size={18} />
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function Header({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox, title, text, action,
}: {
  icon?: LucideIcon;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        <Icon size={22} />
      </span>
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-200" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-slate-200" />
    </div>
  );
}

export function Modal({
  title, fields, submitLabel, onClose, onSubmit,
}: {
  title: string;
  fields: Field[];
  submitLabel: string;
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => void;
}) {
  const blocked = fields.some((f) => f.type === "select" && !f.options?.length);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>);
        }}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl"
      >
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        <div className="space-y-3">
          {fields.map((f) => (
            <label key={f.name} className="block text-sm">
              <span className="mb-1 block text-slate-600">{f.label}</span>
              {f.type === "select" ? (
                <select name={f.name} required defaultValue={f.defaultValue} className={inputCls}>
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  name={f.name}
                  type={f.type ?? "text"}
                  required
                  defaultValue={f.defaultValue}
                  className={inputCls}
                />
              )}
            </label>
          ))}
        </div>
        {blocked && (
          <p className="mt-3 text-sm text-rose-600">
            Add the missing items first (a property, unit or tenant), then try again.
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnGhost}>Cancel</button>
          <button type="submit" disabled={blocked} className={`${btnPrimary} disabled:opacity-50`}>
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}