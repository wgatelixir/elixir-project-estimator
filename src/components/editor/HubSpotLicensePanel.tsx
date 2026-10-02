"use client";

import type { HubSpotLicenseApplicability, HubSpotLicenseState } from "@/lib/types";
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

interface ApplicabilityQuestionDef {
  key: keyof HubSpotLicenseApplicability;
  label: string;
  /** Which answer keeps this deal on the new pricing model. */
  wantedAnswer: boolean;
}

const APPLICABILITY_QUESTIONS: ApplicabilityQuestionDef[] = [
  {
    key: "newEmeaCustomerSinceOct2026",
    label: "Nieuwe HubSpot-klant in EMEA, sinds 1 oktober 2026?",
    wantedAnswer: true,
  },
  {
    key: "existingHubSpotCustomer",
    label: "Al bestaande HubSpot-klant (ook EMEA)?",
    wantedAnswer: false,
  },
  {
    key: "beneluxOrNordicsPilot",
    label: "Benelux- of Nordics-pilotklant (Core Seat / Front Office Seat voorwaarden)?",
    wantedAnswer: false,
  },
  {
    key: "newPortalUnderExistingMultiPortal",
    label: "Nieuw portal onder een bestaand multi-portal bedrijf?",
    wantedAnswer: false,
  },
];

function TriStateButton({
  value,
  wantedAnswer,
  onChange,
}: {
  value: boolean | null;
  wantedAnswer: boolean;
  onChange: (next: boolean | null) => void;
}) {
  const options: { label: string; next: boolean | null }[] = [
    { label: "Ja", next: true },
    { label: "Nee", next: false },
    { label: "Onbekend", next: null },
  ];
  return (
    <div className="flex items-center gap-1">
      {options.map((opt) => {
        const active = value === opt.next;
        // "Onbekend" (null) is never a confirmed good/bad answer, so it never
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
}: {
  state: HubSpotLicenseState;
  onChange: (next: HubSpotLicenseState) => void;
}) {
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
          Include HubSpot license estimate in this estimation
        </label>
      </div>

      <div className="border-b border-amber-100 bg-amber-50/60 px-4 py-3 text-xs text-amber-800">
        <p>
          <strong>Dit is HubSpot&apos;s eigen software-abonnement</strong> (Seats-and-Credits), niet Elixir&apos;s
          implementatietarief hierboven. Deze twee totalen worden nooit samengevoegd.
        </p>
        <p className="mt-1">{PRICING_SOURCE.note}</p>
      </div>

      <div className="border-b border-slate-100 p-4">
        <h3 className="text-sm font-semibold text-brand-ink">Toepasselijkheid</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Controleer dit eerst - de bron noemt dit de meest voorkomende fout. Legacy-klanten, pilotklanten en
          nieuwe portals onder een bestaand bedrijf vallen niet onder dit model.
        </p>
        <div className="mt-3 space-y-2">
          {APPLICABILITY_QUESTIONS.map((q) => (
            <div key={q.key} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-700">{q.label}</span>
              <TriStateButton
                value={state.applicability[q.key]}
                wantedAnswer={q.wantedAnswer}
                onChange={(next) =>
                  onChange({ ...state, applicability: { ...state.applicability, [q.key]: next } })
                }
              />
            </div>
          ))}
        </div>
        {anyAnswered && !confirmed && (
          <p className="mt-3 rounded border border-brand-crimson/30 bg-brand-crimson/10 px-3 py-2 text-xs text-brand-crimson">
            Niet alle antwoorden wijzen op dit prijsmodel. De berekening hieronder is dan indicatief/hypothetisch -
            controleer bij PDM welk model echt van toepassing is voordat je dit in een offerte gebruikt.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-500">Editie</span>
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
            Recordlimiet: {RECORD_LIMITS[state.edition].toLocaleString("nl-NL")} · {INCLUDED_CREDITS[state.edition].toLocaleString("nl-NL")} credits/mnd inbegrepen
          </span>
        </label>

        <NumberField
          label={`GTM Seats (€${seatPrices.gtm}/mnd elk)`}
          value={state.gtmSeats}
          onChange={(v) => onChange({ ...state, gtmSeats: v })}
        />
        <NumberField
          label={`Ops Seats (€${seatPrices.ops}/mnd elk)`}
          value={state.opsSeats}
          onChange={(v) => onChange({ ...state, opsSeats: v })}
        />
        <NumberField
          label="View-only Seats (prijs onbekend)"
          value={state.viewOnlySeats}
          onChange={(v) => onChange({ ...state, viewOnlySeats: v })}
        />
        <NumberField
          label="Verwachte objectrecords"
          value={state.expectedRecords}
          onChange={(v) => onChange({ ...state, expectedRecords: v })}
          step={100}
        />
        <NumberField
          label="Verwachte e-mails/maand"
          value={state.expectedEmailsPerMonth}
          onChange={(v) => onChange({ ...state, expectedEmailsPerMonth: v })}
          step={100}
        />
        <NumberField
          label="Verwachte credits/maand"
          value={state.expectedCreditsPerMonth}
          onChange={(v) => onChange({ ...state, expectedCreditsPerMonth: v })}
          step={100}
          suffix="workflow-acties, AI, quotes, e-mails tellen mee"
        />
      </div>

      <div className="border-b border-slate-100 p-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-500">Notities / PDM-bevestiging</span>
          <textarea
            value={state.notes}
            onChange={(e) => onChange({ ...state, notes: e.target.value })}
            rows={2}
            placeholder="Bijv. bevestigd met PDM op [datum], committed-kortingstrap nog navragen..."
            className="rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-indigo focus:outline-none focus:ring-1 focus:ring-brand-indigo"
          />
        </label>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-semibold text-brand-ink">Indicatieve maandkosten</h3>
        <dl className="mt-2 space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">
              Seats ({state.gtmSeats} GTM &times; &euro;{seatPrices.gtm} + {state.opsSeats} Ops &times; &euro;
              {seatPrices.ops})
            </dt>
            <dd className="tabular-nums font-medium text-brand-ink">{formatCurrency(result.seatCost)}</dd>
          </div>
          {result.emailPackChoices.length > 0 && (
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">
                E-mailpacks (
                {result.emailPackChoices
                  .map((c) => `${c.count}× ${c.pack.sends.toLocaleString("nl-NL")}`)
                  .join(" + ")}
                )
              </dt>
              <dd className="tabular-nums font-medium text-brand-ink">{formatCurrency(result.emailPacksCost)}</dd>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-slate-100 pt-1.5">
            <dt className="font-medium text-brand-ink">Maandtotaal (seats + e-mailpacks)</dt>
            <dd className="tabular-nums text-base font-semibold text-brand-ink">
              {formatCurrency(result.monthlyTotal)}
            </dd>
          </div>
          {result.creditOverage > 0 && (
            <div className="flex items-center justify-between text-xs">
              <dt className="text-slate-400">
                + credit-overschot: {result.creditOverage.toLocaleString("nl-NL")} credits &times; &euro;0,01 (PAYG,
                apart van bovenstaand totaal)
              </dt>
              <dd className="tabular-nums text-slate-500">{formatCurrency(result.creditOverageCost)}</dd>
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
                {w.message}
              </li>
            ))}
          </ul>
        )}

        <details className="mt-4 text-xs text-slate-500">
          <summary className="cursor-pointer font-medium text-slate-600">
            Capacity packs &amp; Agents-packs (referentie)
          </summary>
          <div className="mt-2 space-y-1">
            <p>
              Agents-pack ({EDITION_LABELS[state.edition]}): {AGENT_PACKS[state.edition].credits.toLocaleString("nl-NL")}{" "}
              credits voor {formatCurrency(AGENT_PACKS[state.edition].price)}/mnd (zelfde prijs per credit als PAYG -
              committed-kortingstrap staat niet in de bron).
            </p>
            {WORKFLOW_ACTION_PACKS.filter((p) => p.edition === state.edition || state.edition === "enterprise").map(
              (p) => (
                <p key={p.label}>
                  Workflow-actionspack {p.label}: {p.actions.toLocaleString("nl-NL")} acties voor{" "}
                  {formatCurrency(p.price)}/mnd. (PAYG-equivalent niet getoond - bron markeert dit cijfer als
                  onbetrouwbaar.)
                </p>
              )
            )}
          </div>
        </details>
      </div>
    </div>
  );
}
