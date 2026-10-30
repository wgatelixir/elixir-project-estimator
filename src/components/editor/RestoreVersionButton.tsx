"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RestoreVersionButton({
  estimationId,
  versionId,
  versionNumber,
  savedAt,
}: {
  estimationId: string;
  versionId: string;
  versionNumber: number;
  savedAt: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function restore() {
    if (!confirm(`Restore v${versionNumber} (saved ${savedAt}) as the current version of this estimation?`)) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/estimations/${estimationId}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      });
      if (!res.ok) throw new Error("Restore failed");
      router.push(`/estimations/${estimationId}`);
      router.refresh();
    } catch {
      alert("Restoring this version failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <button
      onClick={restore}
      disabled={busy}
      className="btn btn-primary print:hidden"
    >
      {busy ? "Restoring…" : "Restore this version"}
    </button>
  );
}
