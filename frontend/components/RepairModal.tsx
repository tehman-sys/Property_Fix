"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { authFetch } from "../lib/api";
import { btnGhost, btnPrimary, inputCls } from "../lib/ui";

const API = process.env.NEXT_PUBLIC_API_URL;

type Triage = { priority: string; category: string; reason: string; nextStep: string };

export function RepairModal({
  unitOptions, onClose, onSubmit,
}: {
  unitOptions: { value: string; label: string }[];
  onClose: () => void;
  onSubmit: (v: { unitId: string; title: string; priority: string }) => void;
}) {
  const [unitId, setUnitId] = useState(unitOptions[0]?.value ?? "");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [triage, setTriage] = useState<Triage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function suggest() {
    setBusy(true);
    setError("");
    try {
      const res = await authFetch(`${API}/api/ai/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: title }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not get a suggestion");
        return;
      }
      setTriage(body);
      setPriority(body.priority);
    } catch {
      setError("Could not reach the server");
    } finally {
      setBusy(false);
    }
  }

  const noUnits = unitOptions.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ unitId, title, priority });
        }}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl"
      >
        <h2 className="mb-4 text-lg font-semibold">Report repair</h2>
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Unit</span>
            <select className={inputCls} required value={unitId} onChange={(e) => setUnitId(e.target.value)}>
              {unitOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">What is broken?</span>
            <input
              className={inputCls}
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Water leaking from the bathroom ceiling"
            />
          </label>
          <button
            type="button"
            className={`${btnGhost} flex items-center gap-2 disabled:opacity-50`}
            disabled={busy || title.trim().length < 5}
            onClick={suggest}
          >
            <Sparkles size={14} className="text-indigo-600" />
            {busy ? "Thinking..." : "Suggest priority with AI"}
          </button>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          {triage && (
            <div className="rounded-xl bg-indigo-50 p-3 text-sm text-indigo-900">
              <p className="font-medium">{triage.priority} priority · {triage.category}</p>
              <p className="mt-1">{triage.reason}</p>
              <p className="mt-1 text-indigo-700">Next step: {triage.nextStep}</p>
            </div>
          )}
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Priority</span>
            <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
              {["Low", "Medium", "High"].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
        </div>
        {noUnits && <p className="mt-3 text-sm text-rose-600">Add a unit to a property first.</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
          <button type="submit" disabled={noUnits} className={`${btnPrimary} disabled:opacity-50`}>Save</button>
        </div>
      </form>
    </div>
  );
}