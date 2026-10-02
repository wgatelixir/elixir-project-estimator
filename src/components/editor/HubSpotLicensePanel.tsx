"use client";

import type { HubSpotLicenseApplicability, HubSpotLicenseState, Locale, LocalizedString } from "@/lib/types";
import {
  AGENT_PACKS,
  computeHubSpotLicenseCost,
  EDITION_LABELS,
  HUBSPOT_EDITIONS,
  INCLUDED_CREDITS,
  isApplicabilityConfirmed,
  PRICING_SOURCE,
  RECORD_LIMITS,
  SEAT_PRICES,
  WORKFLOW_ACTION_PACKS,
} from "@/lib/hubspotPricing";
import { formatCurrency } from "@/lib/format";
import { t, UI_STRINGS } from "@/lib/i18n";

interface ApplicabilityQuestionDef {
  key: keyof HubSpotLicenseApplicability;
  label: LocalizedString;
  /** Which answer keeps this deal on the new pricing model. */
  wantedAnswer: boolean;
}

const APPLICABILITY_QUESTIONS: ApplicabilityQuestionDef[] = [
  {
    key: "newEmeaCustomerSinceOct2026",
    label: {
      en: "New HubSpot customer in EMEA, since 1 October 2026?",
      nl: "Nieuwe HubSpot-klant in EMEA, sinds 1 oktober 2026?",
    },
    wantedAnswer: true,
  },
  {
    key: "existingHubSpotCustomer",
    label: { en: "Already an existing HubSpot customer (also EMEA)?", nl: "Al bestaande HubSpot-klant (ook EMEA)?" },
    wantedAnswer: false,
  },
  {
    key: "beneluxOrNordicsPilot",
    label: {
      en: "Benelux or Nordics pilot customer (Core Seat / Front Office Seat terms)?",
      nl: "Benelux- of Nordics-pilotklant (Core Seat / Front Office Seat voorwaarden)?",
    },
    wantedAnswer: false,
  },
  {
    key: "newPortalUnderExistingMultiPortal",
    label: {
      en: "New portal under an existing multi-portal company?",
      nl: "Nieuw portal onder een bestaand multi-portal bedrijf?",
    },
    wantedAnswer: false,
  },
];

function TriStateButton({
  value,
  wantedAnswer,
  onChange,
  locale,
}: {
  value: boolean | null;
  wantedAnswer: boolean;
  onChange: (next: boolean | null) => void;
  locale: Locale;
}) {
  const s = UI_STRINGS.hubspotLicense;
  const options: { label: string; next: boolean | null }[] = [
    { label: t(s.yes, locale), next: true },
    { label: t(s.no, locale), next: false },
    { label: t(s.unknown, locale), next: null },
  ];
  return (
    <div className="flex items-center gap-1">
      {options.map((opt) => {
        const active = value === opt.next;
        // "Unknown" (null) is never a confirmed good/bad answer, so it never
        // gets the green/red treatment - only a neutral "this is selected" look.
        let activeClass = "border border-slate-300 bg-slate-100 text-slate-600";
        if (active && opt.next !== null) {
          activeClass =
            opt.next === wantedAnswer
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-brand-crimson/10 text-brand-crimson border border-brand-crimson/30";
        }
        return (
          <button
            key={opt.label}
            onClick={() => onChange(opt.next)}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              active ? activeClass : "border border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="flex items-center gap-1.5">
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-28 rounded border border-slate-300 px-2 py-1.5 text-right tabular-nums focus:border-brand-indigo focus:outline-none focus:ring-1 focus:ring-brand-indigo"
        />
        {suffix && <span className="text-xs text-slate-400">{suffix}</span>}
      </span>
    </label>
  );
}

export function HubSpotLicensePanel({
  state,
  onChange,
  locale = "en",
}: {
  state: HubSpotLicenseState;
  onChange: (next: HubSpotLicenseState) => void;
  locale?: Locale;
}) {
  const s = UI_STRINGS.hubspotLicense;
  const numberLocale = locale === "nl" ? "nl-NL" : "en-US";
  const result = computeHubSpotLicenseCost(state);
  const confirmed = isApplicabilityConfirmed(state.applicability);
  const anyAnswered = Object.values(state.applicability).some((v) => v !== null);
  const seatPrices = SEAT_PRICES[state.edition];

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <label className="flex items-center gap-2 text-sm font-medium text-brand-ink">
          <input
            type="checkbox"
            checked={state.enabled}
            onChange={(e) => onChange({ ...state, enabled: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 accent-brand-indigo"
          />
          {t(s.includeLicense, locale)}
        </label>
      </div>

      <div className="border-b border-amber-100 bg-amber-50/60 px-4 py-3 text-xs text-amber-800">
        <p>
          <strong>{t(s.infoBoldPrefix, locale)}</strong> {t(s.infoRest, locale)}
        </p>
        <p className="mt-1">{t(PRICING_SOURCE.note, locale)}</p>
      </div>

      <div className="border-b border-slate-100 p-4">
        <h3 className="text-sm font-semibold text-brand-ink">{t(s.applicabilityTitle, locale)}</h3>
        <p className="mt-0.5 text-xs text-slate-500">{t(s.applicabilityIntro, locale)}</p>
        <div className="mt-3 space-y-2">
          {APPLICABILITY_QUESTIONS.map((q) => (
            <div key={q.key} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-700">{t(q.label, locale)}</span>
              <TriStateButton
                value={state.applicability[q.key]}
                wantedAnswer={q.wantedAnswer}
                locale={locale}
                onChange={(next) =>
                  onChange({ ...state, applicability: { ...state.applicability, [q.key]: next } })
                }
              />
            </div>
          ))}
        </div>
        {anyAnswered && !confirmed && (
          <p className="mt-3 rounded border border-brand-crimson/30 bg-brand-crimson/10 px-3 py-2 text-xs text-brand-crimson">
            {t(s.notConfirmedWarning, locale)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-500">{t(s.editionLabel, locale)}</span>
          <select
            value={state.edition}
            onChange={(e) => onChange({ ...state, edition: e.target.value as HubSpotLicenseState["edition"] })}
            className="rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-indigo focus:outline-none focus:ring-1 focus:ring-brand-indigo"
          >
            {HUBSPOT_EDITIONS.map((ed) => (
              <option key={ed} value={ed}>
                {EDITION_LABELS[ed]}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-slate-400">
            {locale === "nl"
              ? `Recordlimiet: ${RECORD_LIMITS[state.edition].toLocaleString(numberLocale)} · ${INCLUDED_CREDITS[state.edition].toLocaleString(numberLocale)} credits/mnd inbegrepen`
              : `Record limit: ${RECORD_LIMITS[state.edition].toLocaleString(numberLocale)} · ${INCLUDED_CREDITS[state.edition].toLocaleString(numberLocale)} credits/mo included`}
          </span>
        </label>

        <NumberField
          label={locale === "nl" ? `GTM Seats (€${seatPrices.gtm}/mnd elk)` : `GTM Seats (€${seatPrices.gtm}/mo each)`}
          value={state.gtmSeats}
          onChange={(v) => onChange({ ...state, gtmSeats: v })}
        />
        <NumberField
          label={locale === "nl" ? `Ops Seats (€${seatPrices.ops}/mnd elk)` : `Ops Seats (€${seatPrices.ops}/mo each)`}
          value={state.opsSeats}
          onChange={(v) => onChange({ ...state, opsSeats: v })}
        />
        <NumberField
          label={t(s.viewOnlySeatsLabel, locale)}
          value={state.viewOnlySeats}
          onChange={(v) => onChange({ ...state, viewOnlySeats: v })}
        />
        <NumberField
          label={t(s.expectedRecordsLabel, locale)}
          value={state.expectedRecords}
          onChange={(v) => onChange({ ...state, expectedRecords: v })}
          step={100}
        />
        <NumberField
          label={t(s.expectedEmailsLabel, locale)}
          value={state.expectedEmailsPerMonth}
          onChange={(v) => onChange({ ...state, expectedEmailsPerMonth: v })}
          step={100}
        />
        <NumberField
          label={t(s.expectedCreditsLabel, locale)}
          value={state.expectedCreditsPerMonth}
          onChange={(v) => onChange({ ...state, expectedCreditsPerMonth: v })}
          step={100}
          suffix={t(s.creditsSuffix, locale)}
        />
      </div>

      <div className="border-b border-slate-100 p-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-500">{t(s.notesLabel, locale)}</span>
          <textarea
            value={state.notes}
            onChange={(e) => onChange({ ...state, notes: e.target.value })}
            rows={2}
            placeholder={t(s.notesPlaceholder, locale)}
            className="rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-indigo focus:outline-none focus:ring-1 focus:ring-brand-indigo"
          />
        </label>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-semibold text-brand-ink">{t(s.monthlyCostsTitle, locale)}</h3>
        <dl className="mt-2 space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">
              Seats ({state.gtmSeats} GTM &times; &euro;{seatPrices.gtm} + {state.opsSeats} Ops &times; &euro;
              {seatPrices.ops})
            </dt>
            <dd className="tabular-nums font-medium text-brand-ink">{formatCurrency(result.seatCost, locale)}</dd>
          </div>
          {result.emailPackChoices.length > 0 && (
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">
                {locale === "nl" ? "E-mailpacks" : "Email packs"} (
                {result.emailPackChoices
                  .map((c) => `${c.count}× ${c.pack.sends.toLocaleString(numberLocale)}`)
                  .join(" + ")}
                )
              </dt>
              <dd className="tabular-nums font-medium text-brand-ink">{formatCurrency(result.emailPacksCost, locale)}</dd>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-slate-100 pt-1.5">
            <dt className="font-medium text-brand-ink">{t(s.monthlyTotalLabel, locale)}</dt>
            <dd className="tabular-nums text-base font-semibold text-brand-ink">
              {formatCurrency(result.monthlyTotal, locale)}
            </dd>
          </div>
          {result.creditOverage > 0 && (
            <div className="flex items-center justify-between text-xs">
              <dt className="text-slate-400">
                {locale === "nl"
                  ? `+ credit-overschot: ${result.creditOverage.toLocaleString(numberLocale)} credits × €0,01 (PAYG, apart van bovenstaand totaal)`
                  : `+ credit overage: ${result.creditOverage.toLocaleString(numberLocale)} credits × €0.01 (PAYG, separate from the total above)`}
              </dt>
              <dd className="tabular-nums text-slate-500">{formatCurrency(result.creditOverageCost, locale)}</dd>
            </div>
          )}
        </dl>

        {result.warnings.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {result.warnings.map((w, i) => (
              <li
                key={i}
                className={`rounded px-2.5 py-1.5 text-xs ${
                  w.level === "warning"
                    ? "border border-brand-crimson/30 bg-brand-crimson/10 text-brand-crimson"
                    : "border border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                {t(w.message, locale)}
              </li>
            ))}
          </ul>
        )}

        <details className="mt-4 text-xs text-slate-500">
          <summary className="cursor-pointer font-medium text-slate-600">{t(s.capacityPacksSummary, locale)}</summary>
          <div className="mt-2 space-y-1">
            <p>
              {locale === "nl"
                ? `Agents-pack (${EDITION_LABELS[state.edition]}): ${AGENT_PACKS[state.edition].credits.toLocaleString(numberLocale)} credits voor ${formatCurrency(AGENT_PACKS[state.edition].price, locale)}/mnd (zelfde prijs per credit als PAYG - committed-kortingstrap staat niet in de bron).`
                : `Agents pack (${EDITION_LABELS[state.edition]}): ${AGENT_PACKS[state.edition].credits.toLocaleString(numberLocale)} credits for ${formatCurrency(AGENT_PACKS[state.edition].price, locale)}/mo (same price per credit as PAYG - committed discount tier not in the source material).`}
            </p>
            {WORKFLOW_ACTION_PACKS.filter((p) => p.edition === state.edition || state.edition === "enterprise").map(
              (p) => (
                <p key={p.label}>
                  {locale === "nl"
                    ? `Workflow-actionspack ${p.label}: ${p.actions.toLocaleString(numberLocale)} acties voor ${formatCurrency(p.price, locale)}/mnd. (PAYG-equivalent niet getoond - bron markeert dit cijfer als onbetrouwbaar.)`
                    : `Workflow action pack ${p.label}: ${p.actions.toLocaleString(numberLocale)} actions for ${formatCurrency(p.price, locale)}/mo. (PAYG equivalent not shown - source flags this figure as unreliable.)`}
                </p>
              )
            )}
          </div>
        </details>
      </div>
    </div>
  );
}
