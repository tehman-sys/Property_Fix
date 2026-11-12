"use client";

import { useCallback, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { btnGhost, btnSolidDanger } from "../lib/ui";

type Toast = { id: number; text: string; kind: "error" | "success" };
type Asking = { text: string; resolve: (v: boolean) => void } | null;

export function useFeedback() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [asking, setAsking] = useState<Asking>(null);
  const nextId = useRef(1);

  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  const notify = useCallback((text?: string, kind: "error" | "success" = "error") => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, text: text || "Something went wrong", kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const ask = useCallback(
    (text: string) => new Promise<boolean>((resolve) => setAsking({ text, resolve })),
    []
  );

  const answer = (v: boolean) => {
    asking?.resolve(v);
    setAsking(null);
  };

  const ui = (
    <>
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
          >
            {t.kind === "error" ? (
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-600" />
            ) : (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
            )}
            <p className="flex-1 text-sm text-slate-800">{t.text}</p>
            <button onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      {asking && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => answer(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-slate-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-semibold">Are you sure?</p>
            <p className="mt-1 text-sm text-slate-500">{asking.text}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button className={btnGhost} onClick={() => answer(false)}>Cancel</button>
              <button className={btnSolidDanger} onClick={() => answer(true)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return { notify, ask, ui };
}