"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewEstimationButton() {
  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim()) {
      setError("Client name is required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/estimations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName, projectName, ownerName }),
      });
      if (!res.ok) throw new Error("Failed to create estimation");
      const created = await res.json();
      router.push(`/estimations/${created.id}`);
    } catch {
      setError("Something went wrong — please try again.");
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-md bg-brand-indigo px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-indigo-hover"
      >
        + New estimation
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/40 px-4">
      <form
        onSubmit={handleCreate}
        className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl"
      >
        <h2 className="text-base font-semibold text-brand-ink">New estimation</h2>
        <p className="mt-1 text-xs text-slate-500">
          Starts from the standard Elixir estimation template. You can adjust or remove anything
          afterwards.
        </p>
        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Client / prospect name *</span>
            <input
              autoFocus
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-indigo focus:outline-none focus:ring-1 focus:ring-brand-indigo"
              placeholder="Acme Corp"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Project name</span>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-indigo focus:outline-none focus:ring-1 focus:ring-brand-indigo"
              placeholder="HubSpot Sales & Marketing rollout"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Your name</span>
            <input
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-indigo focus:outline-none focus:ring-1 focus:ring-brand-indigo"
              placeholder="Optional — no login, so we track this by name"
            />
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-brand-crimson">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-brand-indigo px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-indigo-hover disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
