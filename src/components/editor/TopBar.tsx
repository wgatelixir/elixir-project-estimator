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
            className="min-w-[200px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-base font-semibold text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
          <input
            value={meta.projectName}
            onChange={(e) => onChange({ projectName: e.target.value })}
            placeholder="Project name"
            className="min-w-[200px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
          <input
            value={meta.ownerName}
            onChange={(e) => onChange({ ownerName: e.target.value })}
            placeholder="Your name"
            className="w-40 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
          <select
            value={meta.status}
            onChange={(e) => onChange({ status: e.target.value as EstimationStatus })}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
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
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
      <div className="mt-2">
        <Link href="/" className="text-xs text-slate-400 hover:text-slate-600">
          &larr; Back to dashboard
        </Link>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
