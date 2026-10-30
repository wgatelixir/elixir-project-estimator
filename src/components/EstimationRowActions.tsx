"use client";

import Link from "next/link";
import { Copy, History, Trash2, iconProps } from "@/components/ui/icons";
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

  // Icon buttons (with a tooltip) keep the row calm; Delete only turns red on hover.
  const iconButton =
    "inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors disabled:opacity-50";
  return (
    <div className="flex items-center justify-end gap-0.5">
      <Link
        href={`/estimations/${id}/history`}
        title="Version history"
        aria-label="Version history"
        className={`${iconButton} hover:bg-brand-indigo/5 hover:text-brand-indigo`}
      >
        <History {...iconProps} />
      </Link>
      <button
        onClick={duplicate}
        disabled={busy !== null}
        title="Duplicate as a new snapshot"
        aria-label="Duplicate"
        className={`${iconButton} hover:bg-brand-indigo/5 hover:text-brand-indigo`}
      >
        <Copy {...iconProps} className={busy === "duplicate" ? "animate-pulse" : ""} />
      </button>
      <button
        onClick={remove}
        disabled={busy !== null}
        title="Delete"
        aria-label="Delete"
        className={`${iconButton} hover:bg-brand-crimson/10 hover:text-brand-crimson`}
      >
        <Trash2 {...iconProps} className={busy === "delete" ? "animate-pulse" : ""} />
      </button>
    </div>
  );
}
