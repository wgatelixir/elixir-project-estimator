"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function EstimationRowActions({ id, clientName }: { id: string; clientName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"duplicate" | "delete" | null>(null);

  async function duplicate() {
    setBusy("duplicate");
    try {
      const res = await fetch(`/api/estimations/${id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error();
      const created = await res.json();
      router.push(`/estimations/${created.id}`);
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm(`Delete the estimation for "${clientName}"? This can't be undone.`)) return;
    setBusy("delete");
    try {
      const res = await fetch(`/api/estimations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1 text-xs">
      <button
        onClick={duplicate}
        disabled={busy !== null}
        className="rounded px-2 py-1 font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
        title="Duplicate as a new snapshot"
      >
        {busy === "duplicate" ? "…" : "Duplicate"}
      </button>
      <button
        onClick={remove}
        disabled={busy !== null}
        className="rounded px-2 py-1 font-medium text-brand-crimson hover:bg-brand-crimson/10 disabled:opacity-50"
      >
        {busy === "delete" ? "…" : "Delete"}
      </button>
    </div>
  );
}
