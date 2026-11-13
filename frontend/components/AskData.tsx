"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { authFetch } from "../lib/api";
import { btnPrimary, inputCls } from "../lib/ui";

const API = process.env.NEXT_PUBLIC_API_URL;

type Item = { q: string; a: string; found: boolean };

const examples = ["Who hasn't paid this month?", "Which unit has the most repairs?", "Which leases end soon?"];

export function AskData() {
  const [question, setQuestion] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function ask(q: string) {
    if (q.trim().length < 3 || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await authFetch(`${API}/api/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not get an answer");
        return;
      }
      setItems((all) => [{ q, a: body.answer, found: body.found }, ...all].slice(0, 5));
      setQuestion("");
    } catch {
      setError("Could not reach the server");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="mb-3 flex items-center gap-2 font-medium">
        <MessageSquare size={18} className="text-indigo-600" /> Ask your data
      </p>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
      >
        <input
          className={inputCls}
          placeholder="e.g. Who hasn't paid this month?"
          value={question}
          maxLength={500}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button type="submit" className={`${btnPrimary} disabled:opacity-50`} disabled={busy}>
          {busy ? "..." : "Ask"}
        </button>
      </form>
      <div className="mt-2 flex flex-wrap gap-2">
        {examples.map((ex) => (
          <button
            key={ex}
            type="button"
            disabled={busy}
            onClick={() => ask(ex)}
            className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
          >
            {ex}
          </button>
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      <div className="mt-4 space-y-3">
        {items.map((it, i) => (
          <div key={i} className="rounded-xl bg-slate-50 p-3 text-sm">
            <p className="font-medium">{it.q}</p>
            <p className={`mt-1 ${it.found ? "text-slate-700" : "text-amber-700"}`}>{it.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}