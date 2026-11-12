"use client";

import { useState } from "react";
import { btnPrimary, inputCls } from "../lib/ui";
import { setToken } from "../lib/api";
import type { User } from "../lib/types";

const API = process.env.NEXT_PUBLIC_API_URL;

export function AuthScreen({ onAuthed }: { onAuthed: (u: User) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget).entries());
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      setToken(data.token);
      onAuthed(data.user);
    } catch {
      setError("Could not reach the server");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-slate-900">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-lg font-semibold tracking-tight">PropertyFix</p>
        <p className="mb-5 mt-1 text-sm text-slate-500">
          {mode === "login" ? "Log in to your account." : "Create your account."}
        </p>
        <div className="space-y-3">
          {mode === "signup" && (
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Full name</span>
              <input name="name" required className={inputCls} />
            </label>
          )}
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Email</span>
            <input name="email" type="email" required className={inputCls} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Password</span>
            <input name="password" type="password" required minLength={6} className={inputCls} />
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        <button type="submit" disabled={busy} className={`${btnPrimary} mt-5 w-full disabled:opacity-50`}>
          {busy ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}
        </button>
        <button
          type="button"
          className="mt-3 w-full text-center text-sm text-slate-500 hover:underline"
          onClick={() => { setError(""); setMode(mode === "login" ? "signup" : "login"); }}
        >
          {mode === "login" ? "No account? Sign up" : "Already have an account? Log in"}
        </button>
      </form>
    </div>
  );
}