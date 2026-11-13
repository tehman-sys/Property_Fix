"use client";
import { useCallback, useEffect, useState } from "react";
import { authFetch } from "./api";
import type { Settings } from "./types";

// ADAPT: if authFetch already prepends the API base URL, use "" here.
const API = process.env.NEXT_PUBLIC_API_URL;

export function useSettings(toast: (message: string) => void) {
  const [settings, setSettings] = useState<Settings>({ ownerName: "", currency: "PKR" });

  useEffect(() => {
    authFetch(`${API}/api/settings`)
      .then((r) => r.json())
      .then((s) => setSettings({ ownerName: s.ownerName ?? "", currency: s.currency ?? "PKR" }))
      .catch(() => toast("Could not load settings"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = useCallback(async (next: Settings) => {
    try {
      const res = await authFetch(`${API}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = await res.json();
      if (!res.ok) return toast(data.error ?? "Could not save settings");
      setSettings({ ownerName: data.ownerName, currency: data.currency });
      toast("Settings saved");
    } catch {
      toast("Could not reach the server");
    }
  }, [toast]);

  const exportData = useCallback(async () => {
    try {
      const res = await authFetch(`${API}/api/settings/export`);
      if (!res.ok) return toast("Could not export data");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `propertyfix-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Export downloaded");
    } catch {
      toast("Could not reach the server");
    }
  }, [toast]);

  return { settings, save, exportData };
}