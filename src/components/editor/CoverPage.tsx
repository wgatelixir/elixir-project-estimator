"use client";

import type {
  ElixirSyncIntegrationState,
  EstimationState,
  HubSpotLicenseState,
  Locale,
  LocalizedString,
  StandardWorkstream,
  ThirdPartyIntegrationState,
} from "@/lib/types";
import { computeEstimationTotals } from "@/lib/calculations";
import { formatCurrency, formatHours } from "@/lib/format";
import { DEFAULT_HOURLY_RATES } from "@/lib/templates";
import { t, UI_STRINGS } from "@/lib/i18n";
import { RateHint } from "./RateHint";
import { Rulebook } from "./Rulebook";

// "deployment_golive" is no longer in the template (V3 moved trainings and go-live into
// each hub tab) but older estimations still have it, so keep listing it when present.
const FOUNDATION_KEYS = ["business_assessment", "technical_assessment", "data_migration", "deployment_golive"];
const HUB_KEYS = [
  "sales_implementation",
  "service_implementation",
  "marketing_implementation",
  "cms_implementation",
  "dealhub_implementation",
];

// One fixed column template shared by the header and every row, so Rate/Hours/Budget
// never drift out of alignment regardless of label length or whether a row has a result yet.
const ROW_GRID = "grid grid-cols-[minmax(0,1fr)_190px_90px_120px] items-center gap-3";

function ColumnHeader({ locale }: { locale: Locale }) {
  const s = UI_STRINGS.coverPage;
  return (
    <div className={`${ROW_GRID} px-3 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400`}>
      <span>{t(s.columnWorkstream, locale)}</span>
      <span className="text-right">{t(s.columnRate, locale)}</span>
      <span className="text-right">{t(s.columnHours, locale)}</span>
      <span className="text-right">{t(s.columnBudget, locale)}</span>
    </div>
  );
}

/** Blank while a row is unchecked, so an all-zero result doesn't clutter the list. */
function HoursCell({ enabled, hours, locale }: { enabled: boolean; hours: number; locale: Locale }) {
  return (
    <span className="text-right text-xs font-medium tabular-nums text-brand-ink">
      {enabled ? formatHours(hours, locale) : ""}
    </span>
  );
}

function BudgetCell({ enabled, price, locale }: { enabled: boolean; price: number; locale: Locale }) {
  return (
    <span className="text-right text-xs font-medium tabular-nums text-brand-ink">
      {enabled ? formatCurrency(price, locale) : ""}
    </span>
  );
}

function WorkstreamRow({
  workstream,
  hours,
  price,
  locale,
  onChange,
}: {
  workstream: StandardWorkstream;
  hours: number;
  price: number;
  locale: Locale;
  onChange: (next: StandardWorkstream) => void;
}) {
  return (
    <label className={`${ROW_GRID} cursor-pointer rounded-md px-3 py-2.5 hover:bg-slate-50`}>
      <span className="flex min-w-0 items-center gap-3">
        <input
          type="checkbox"
          checked={workstream.enabled}
          onChange={(e) => onChange({ ...workstream, enabled: e.target.checked })}
          className="h-4 w-4 flex-shrink-0 rounded border-slate-300 accent-brand-indigo"
        />
        <span className={`truncate text-sm font-medium ${workstream.enabled ? "text-brand-ink" : "text-slate-400"}`}>
          {t(workstream.label, locale)}
        </span>
      </span>
      <span className="flex items-center justify-end gap-2 text-xs">
        <span className="font-medium text-slate-600">&euro;{workstream.hourlyRate}/h</span>
        <RateHint
          rate={workstream.hourlyRate}
          defaultRate={DEFAULT_HOURLY_RATES[workstream.key] ?? workstream.hourlyRate}
          locale={locale}
        />
      </span>
      <HoursCell enabled={workstream.enabled} hours={hours} locale={locale} />
      <BudgetCell enabled={workstream.enabled} price={price} locale={locale} />
    </label>
  );
}

function ToggleRow({
  label,
  rate,
  defaultRate,
  enabled,
  hours,
  price,
  locale,
  onChange,
}: {
  label: LocalizedString;
  rate: number;
  defaultRate: number;
  enabled: boolean;
  hours: number;
  price: number;
  locale: Locale;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <label className={`${ROW_GRID} cursor-pointer rounded-md px-3 py-2.5 hover:bg-slate-50`}>
      <span className="flex min-w-0 items-center gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 flex-shrink-0 rounded border-slate-300 accent-brand-indigo"
        />
        <span className={`truncate text-sm font-medium ${enabled ? "text-brand-ink" : "text-slate-400"}`}>
          {t(label, locale)}
        </span>
      </span>
      <span className="flex items-center justify-end gap-2 text-xs">
        <span className="font-medium text-slate-600">&euro;{rate}/h</span>
        <RateHint rate={rate} defaultRate={defaultRate} locale={locale} />
      </span>
      <HoursCell enabled={enabled} hours={hours} locale={locale} />
      <BudgetCell enabled={enabled} price={price} locale={locale} />
    </label>
  );
}

/**
 * A checkbox-only row for toggles that have no rate/hours/budget of their
 * own (the HubSpot license subscription isn't priced in hours x rate, so
 * ROW_GRID's Rate/Hours/Budget columns don't apply to it).
 */
function SimpleToggleRow({
  label,
  enabled,
  onChange,
}: {
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 hover:bg-slate-50">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 flex-shrink-0 rounded border-slate-300 accent-brand-indigo"
      />
      <span className={`truncate text-sm font-medium ${enabled ? "text-brand-ink" : "text-slate-400"}`}>{label}</span>
    </label>
  );
}

function GroupCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-brand-ink">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      {children}
    </div>
  );
}

interface CoverPageProps {
  data: EstimationState;
  onChangeWorkstream: (key: string, next: StandardWorkstream) => void;
  onChangeThirdParty: (next: ThirdPartyIntegrationState) => void;
  onChangeElixirSync: (next: ElixirSyncIntegrationState) => void;
  onChangeHubSpotLicense: (next: HubSpotLicenseState) => void;
  locale: Locale;
}

export function CoverPage({
  data,
  onChangeWorkstream,
  onChangeThirdParty,
  onChangeElixirSync,
  onChangeHubSpotLicense,
  locale,
}: CoverPageProps) {
  const s = UI_STRINGS.coverPage;
  const byKey = (key: string) => data.standardWorkstreams.find((ws) => ws.key === key);
  const foundation = FOUNDATION_KEYS.map(byKey).filter((ws): ws is StandardWorkstream => !!ws);
  const hubs = HUB_KEYS.map(byKey).filter((ws): ws is StandardWorkstream => !!ws);

  const totals = computeEstimationTotals(data);
  const resultFor = (key: string) => totals.workstreams.find((w) => w.key === key);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-brand-ink">{t(s.heading, locale)}</h2>
        <p className="mt-1 text-sm text-slate-500">{t(s.intro, locale)}</p>
      </div>

      <Rulebook locale={locale} />

      <GroupCard title={t(s.foundationTitle, locale)} description={t(s.foundationDescription, locale)}>
        <ColumnHeader locale={locale} />
        <div className="divide-y divide-slate-100 p-1.5 pt-0">
          {foundation.map((ws) => (
            <WorkstreamRow
              key={ws.key}
              workstream={ws}
              hours={resultFor(ws.key)?.hours ?? 0}
              price={resultFor(ws.key)?.price ?? 0}
              locale={locale}
              onChange={(next) => onChangeWorkstream(ws.key, next)}
            />
          ))}
        </div>
      </GroupCard>

      <GroupCard title={t(s.hubsTitle, locale)} description={t(s.hubsDescription, locale)}>
        <ColumnHeader locale={locale} />
        <div className="divide-y divide-slate-100 p-1.5 pt-0">
          {hubs.map((ws) => (
            <WorkstreamRow
              key={ws.key}
              workstream={ws}
              hours={resultFor(ws.key)?.hours ?? 0}
              price={resultFor(ws.key)?.price ?? 0}
              locale={locale}
              onChange={(next) => onChangeWorkstream(ws.key, next)}
            />
          ))}
        </div>
      </GroupCard>

      <GroupCard title={t(s.integrationsTitle, locale)} description={t(s.integrationsDescription, locale)}>
        <ColumnHeader locale={locale} />
        <div className="divide-y divide-slate-100 p-1.5 pt-0">
          <ToggleRow
            label={UI_STRINGS.editor.tabElixirSync}
            rate={data.elixirSyncIntegration.hourlyRate}
            defaultRate={DEFAULT_HOURLY_RATES.elixirsync_integration}
            enabled={data.elixirSyncIntegration.enabled}
            hours={totals.elixirSync.hours}
            price={totals.elixirSync.price}
            locale={locale}
            onChange={(enabled) => onChangeElixirSync({ ...data.elixirSyncIntegration, enabled })}
          />
          <ToggleRow
            label={UI_STRINGS.editor.tabThirdParty}
            rate={data.thirdPartyIntegration.hourlyRate}
            defaultRate={DEFAULT_HOURLY_RATES.third_party_integration}
            enabled={data.thirdPartyIntegration.enabled}
            hours={totals.thirdParty.hours}
            price={totals.thirdParty.price}
            locale={locale}
            onChange={(enabled) => onChangeThirdParty({ ...data.thirdPartyIntegration, enabled })}
          />
        </div>
      </GroupCard>

      <GroupCard title={t(s.hubspotLicenseTitle, locale)} description={t(s.hubspotLicenseDescription, locale)}>
        <div className="p-1.5">
          <SimpleToggleRow
            label={t(UI_STRINGS.editor.tabHubspotLicense, locale)}
            enabled={data.hubspotLicense.enabled}
            onChange={(enabled) => onChangeHubSpotLicense({ ...data.hubspotLicense, enabled })}
          />
        </div>
      </GroupCard>

      <div className={`${ROW_GRID} rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm`}>
        <span className="text-slate-500">{t(s.pmRateLabel, locale)}</span>
        <span className="flex items-center justify-end gap-2 text-xs">
          <span className="font-medium text-brand-ink">{formatCurrency(data.pmRate, locale)}/h</span>
          <RateHint rate={data.pmRate} defaultRate={DEFAULT_HOURLY_RATES.pm} locale={locale} />
        </span>
        <HoursCell enabled hours={totals.pmHours} locale={locale} />
        <BudgetCell enabled price={totals.pmPrice} locale={locale} />
      </div>

      <div className="flex items-center justify-between rounded-lg bg-brand-indigo px-4 py-3 text-white shadow-sm">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-white/80">{t(s.projectTotal, locale)}</div>
          <div className="text-xs text-white/70">
            {formatHours(totals.totalEffortHours, locale)} {t(s.totalEffort, locale)}
          </div>
        </div>
        <div className="text-lg font-semibold tabular-nums">{formatCurrency(totals.grandTotalPrice, locale)}</div>
      </div>
    </div>
  );
}
