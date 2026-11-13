"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { authFetch } from "../lib/api";
import { btnPrimary } from "../lib/ui";

const API = process.env.NEXT_PUBLIC_API_URL;

type Summary = { headline: string; summary: string; highlights: string[]; risks: string[] };

export function AiSummary() {
  const [data, setData] = useState<Summary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const res = await authFetch(`${API}/api/ai/summary`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not generate the summary");
        return;
      }
      setData(body);
    } catch {
      setError("Could not reach the server");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-medium">
          <Sparkles size={18} className="text-indigo-600" /> AI monthly summary
        </p>
        <button className={`${btnPrimary} disabled:opacity-50`} onClick={generate} disabled={busy}>
          {busy ? "Generating..." : data ? "Regenerate" : "Generate summary"}
        </button>
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {!data && !error && (
        <p className="text-sm text-slate-500">Get a plain-English report of this month from your own data.</p>
      )}
      {data && (
        <div className="space-y-3 text-sm">
          <p className="text-base font-semibold">{data.headline}</p>
          <p className="text-slate-700">{data.summary}</p>
          {data.highlights.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-emerald-700">
              {data.highlights.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
          )}
          {data.risks.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-rose-700">
              {data.risks.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          )}
          <p className="text-xs text-slate-400">AI-generated from your data. Double-check important numbers.</p>
        </div>
      )}
    </div>
  );
}