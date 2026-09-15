"use client";

import Link from "next/link";
import type { EstimationStatus } from "@/lib/types";
import { formatDate } from "@/lib/format";

interface Meta {
  clientName: string;
  projectName: string;
  ownerName: string;
  status: EstimationStatus;
}

interface TopBarProps {
  meta: Meta;
  onChange: (next: Partial<Meta>) => void;
  dirty: boolean;
  saving: boolean;
  lastSavedAt: string;
  onSave: () => void;
  error: string | null;
}

export function TopBar({ meta, onChange, dirty, saving, lastSavedAt, onSave, error }: TopBarProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-1 flex-wrap gap-3">
          <input
            value={meta.clientName}
            onChange={(e) => onChange({ clientName: e.target.value })}
            placeholder="Client / prospect name"
            className="min-w-[200px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-base font-semibold text-brand-ink focus:border-brand-indigo focus:outline-none focus:ring-1 focus:ring-brand-indigo"
          />
          <input
            value={meta.projectName}
            onChange={(e) => onChange({ projectName: e.target.value })}
            placeholder="Project name"
            className="min-w-[200px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-brand-indigo focus:outline-none focus:ring-1 focus:ring-brand-indigo"
          />
          <input
            value={meta.ownerName}
            onChange={(e) => onChange({ ownerName: e.target.value })}
            placeholder="Your name"
            className="w-40 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-brand-indigo focus:outline-none focus:ring-1 focus:ring-brand-indigo"
          />
          <select
            value={meta.status}
            onChange={(e) => onChange({ status: e.target.value as EstimationStatus })}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-brand-indigo focus:outline-none focus:ring-1 focus:ring-brand-indigo"
          >
            <option value="DRAFT">Draft</option>
            <option value="FINAL">Final</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            {dirty ? "Unsaved changes" : `Saved ${formatDate(lastSavedAt)}`}
          </span>
          <button
            onClick={onSave}
            disabled={saving || !dirty}
            className="rounded-md bg-brand-indigo px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-indigo-hover disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
      <div className="mt-2">
        <Link href="/" className="text-xs text-slate-400 transition-colors hover:text-brand-crimson">
          &larr; Back to dashboard
        </Link>
      </div>
      {error && <p className="mt-2 text-sm text-brand-crimson">{error}</p>}
    </div>
  );
}
