"use client";

import Link from "next/link";
import type { EstimationStatus, Locale } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { t, UI_STRINGS } from "@/lib/i18n";

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
  locale: Locale;
  onChangeLocale: (next: Locale) => void;
}

export function TopBar({ meta, onChange, dirty, saving, lastSavedAt, onSave, error, locale, onChangeLocale }: TopBarProps) {
  const s = UI_STRINGS.topBar;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm print:hidden">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-1 flex-wrap gap-3">
          <input
            value={meta.clientName}
            onChange={(e) => onChange({ clientName: e.target.value })}
            placeholder={t(s.clientPlaceholder, locale)}
            className="min-w-[200px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-base font-semibold text-brand-ink focus:border-brand-indigo focus:outline-none focus:ring-1 focus:ring-brand-indigo"
          />
          <input
            value={meta.projectName}
            onChange={(e) => onChange({ projectName: e.target.value })}
            placeholder={t(s.projectPlaceholder, locale)}
            className="min-w-[200px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-brand-indigo focus:outline-none focus:ring-1 focus:ring-brand-indigo"
          />
          <input
            value={meta.ownerName}
            onChange={(e) => onChange({ ownerName: e.target.value })}
            placeholder={t(s.ownerPlaceholder, locale)}
            className="w-40 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-brand-indigo focus:outline-none focus:ring-1 focus:ring-brand-indigo"
          />
          <select
            value={meta.status}
            onChange={(e) => onChange({ status: e.target.value as EstimationStatus })}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-brand-indigo focus:outline-none focus:ring-1 focus:ring-brand-indigo"
          >
            <option value="DRAFT">{t(s.statusDraft, locale)}</option>
            <option value="FINAL">{t(s.statusFinal, locale)}</option>
          </select>
          <div className="flex items-center overflow-hidden rounded-md border border-slate-300">
            {(["en", "nl"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onChangeLocale(l)}
                title={t(s.language, locale)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  locale === l ? "bg-brand-indigo text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            {dirty ? t(s.unsavedChanges, locale) : `${t(s.saved, locale)} ${formatDate(lastSavedAt, locale)}`}
          </span>
          <button
            onClick={onSave}
            disabled={saving || !dirty}
            className="rounded-md bg-brand-indigo px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-indigo-hover disabled:opacity-50"
          >
            {saving ? t(s.saving, locale) : t(s.save, locale)}
          </button>
        </div>
      </div>
      <div className="mt-2">
        <Link href="/" className="text-xs text-slate-400 transition-colors hover:text-brand-crimson">
          {t(s.backToDashboard, locale)}
        </Link>
      </div>
      {error && <p className="mt-2 text-sm text-brand-crimson">{error}</p>}
    </div>
  );
}
