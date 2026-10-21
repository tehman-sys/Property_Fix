import { tones,statusTone, inputCls, btnGhost, btnPrimary } from "../lib/ui";
import type { Field } from "../lib/types";

export function Badge({ text }: { text: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[statusTone[text] ?? "gray"]}`}>
      {text}
    </span>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <p className="text-xs uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

export function Header({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-stone-500">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">{children}</tbody>
      </table>
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>);
        }}
        className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 text-stone-900"
      >
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        <div className="space-y-3">
          {fields.map((f) => (
            <label key={f.name} className="block text-sm">
              <span className="mb-1 block text-stone-600">{f.label}</span>
              {f.type === "select" ? (
                <select name={f.name} required className={inputCls}>
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <input name={f.name} type={f.type ?? "text"} required className={inputCls} />
              )}
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnGhost}>Cancel</button>
          <button type="submit" className={btnPrimary}>{submitLabel}</button>
        </div>
      </form>
    </div>
  );
}
