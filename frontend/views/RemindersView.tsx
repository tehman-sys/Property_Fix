"use client";

import { useEffect, useState } from "react";
import { Bell, Bot, CalendarClock, Check, Copy, X } from "lucide-react";
import { Badge, EmptyState, Header } from "../components/Parts";
import { authFetch } from "../lib/api";
import { btnGhost, btnPrimary } from "../lib/ui";

const API = process.env.NEXT_PUBLIC_API_URL;

type Status = "Draft" | "Approved" | "Dismissed" | "NeedsReview";
type Reminder = {
  id: string; tenantName: string; unitLabel: string; amount: number;
  message: string; status: Status; note: string; type?: string; endDate?: string;
};
type RunResult = {
  drafts: number; needsReview: number; steps: number; remaining: number;
  stopped: string; trace: string[];
};

const order: Record<Status, number> = { NeedsReview: 0, Draft: 1, Approved: 2, Dismissed: 3 };

export function RemindersView() {
  const [items, setItems] = useState<Reminder[]>([]);
  const [result, setResult] = useState<RunResult | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  async function load() {
    try {
      const res = await authFetch(`${API}/api/reminders`);
      const data = await res.json();
      setItems(data.reminders ?? []);
    } catch {
      setError("Could not reach the server");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function run(kind: "rent" | "renewals") {
    setBusy(kind);
    setError("");
    setResult(null);
    try {
      const path = kind === "rent" ? "run" : "run-renewals";
      const res = await authFetch(`${API}/api/reminders/${path}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "The agent could not finish");
        return;
      }
      setResult(data);
      await load();
    } catch {
      setError("Could not reach the server");
    } finally {
      setBusy("");
    }
  }

  async function setStatus(id: string, status: Status) {
    const res = await authFetch(`${API}/api/reminders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not update");
      return;
    }
    setItems((all) => all.map((r) => (r.id === id ? data : r)));
  }

  async function copy(r: Reminder) {
    try {
      await navigator.clipboard.writeText(r.message);
      setCopied(r.id);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      setError("Could not copy");
    }
  }

  const sorted = [...items].sort((a, b) => order[a.status] - order[b.status]);

  return (
    <>
      <Header
        title="Reminders"
        subtitle="Drafts written by the agents. Nothing is sent until you do it."
        action={
          <div className="flex flex-wrap gap-2">
            <button className={`${btnPrimary} flex items-center gap-2 disabled:opacity-50`} onClick={() => run("rent")} disabled={!!busy}>
              <Bot size={16} /> {busy === "rent" ? "Agent is working..." : "Run reminder agent"}
            </button>
            <button className={`${btnGhost} flex items-center gap-2 disabled:opacity-50`} onClick={() => run("renewals")} disabled={!!busy}>
              <CalendarClock size={16} /> {busy === "renewals" ? "Checking..." : "Check expiring leases"}
            </button>
          </div>
        }
      />

      {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}

      {result && (
        <div className="mb-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900">
          {result.stopped === "nothing_to_do" ? (
            <p>Nothing to do right now.</p>
          ) : (
            <>
              <p className="font-medium">
                {result.drafts} draft(s) saved, {result.needsReview} sent to human review, in {result.steps} step(s).
                {result.remaining > 0 && ` ${result.remaining} item(s) still pending (${result.stopped}). Run it again.`}
              </p>
              <ul className="mt-2 space-y-1 font-mono text-xs text-indigo-800">
                {result.trace.map((t, i) => <li key={i}>{i + 1}. {t}</li>)}
              </ul>
            </>
          )}
        </div>
      )}

      {sorted.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No reminders yet"
          text="Run the reminder agent for unpaid rent, or check expiring leases for renewal messages."
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{r.tenantName}</p>
                  <p className="text-sm text-slate-500">
                    {r.unitLabel} · {r.type === "Renewal" ? `lease ends ${r.endDate}` : `balance ${r.amount.toLocaleString("en-US")}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {r.type === "Renewal" && (
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">Renewal</span>
                  )}
                  <Badge text={r.status} />
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{r.message}</p>
              {r.status === "NeedsReview" && (
                <p className="mt-2 text-xs text-rose-600">Needs a human: {r.note}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button className={`${btnGhost} flex items-center gap-2`} onClick={() => copy(r)}>
                  <Copy size={14} /> {copied === r.id ? "Copied" : "Copy"}
                </button>
                {r.status !== "Approved" && (
                  <button className={`${btnGhost} flex items-center gap-2`} onClick={() => setStatus(r.id, "Approved")}>
                    <Check size={14} /> Approve
                  </button>
                )}
                {r.status !== "Dismissed" && (
                  <button className={`${btnGhost} flex items-center gap-2`} onClick={() => setStatus(r.id, "Dismissed")}>
                    <X size={14} /> Dismiss
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}