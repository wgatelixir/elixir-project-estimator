// HubSpot's own Flexible Seats-and-Credits pricing for EMEA (new customers
// since 1 October 2026). Deliberately kept separate from calculations.ts:
// that file prices Elixir's implementation services (hours x rate), this
// file prices the HubSpot subscription itself. HubSpot maintains these
// numbers on its own schedule - never merge the two totals, and never carry
// a number from here that isn't backed by the source material.
//
// Source: HubSpot partner course "Flexible Seats-and-Credits Pricing for
// EMEA" (read 2 Oct 2026, EUR/month excl. VAT unless noted). The course
// itself says figures, packs and eligibility can change before full
// rollout - every price shown in the UI must carry PRICING_SOURCE.note.

import type { HubSpotEdition, HubSpotLicenseApplicability, HubSpotLicenseState, LocalizedString } from "./types";

export const HUBSPOT_EDITIONS: HubSpotEdition[] = ["starter", "professional", "enterprise"];

export const EDITION_LABELS: Record<HubSpotEdition, string> = {
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

export const SEAT_PRICES: Record<HubSpotEdition, { gtm: number; ops: number }> = {
  starter: { gtm: 20, ops: 15 },
  professional: { gtm: 100, ops: 50 },
  enterprise: { gtm: 175, ops: 50 },
};

export const INCLUDED_CREDITS: Record<HubSpotEdition, number> = {
  starter: 5000,
  professional: 10000,
  enterprise: 15000,
};

export const RECORD_LIMITS: Record<HubSpotEdition, number> = {
  starter: 25_000,
  professional: 250_000,
  enterprise: 15_000_000,
};

/** Derived from the Agents-packs, which the source lists as "Same" price per credit as PAYG. */
export const PAYG_CREDIT_PRICE = 0.01;

export interface EmailPack {
  sends: number;
  price: number;
  paygEquivalent: number;
}

export const EMAIL_PACKS: EmailPack[] = [
  { sends: 2_000, price: 200, paygEquivalent: 300 },
  { sends: 10_000, price: 1_000, paygEquivalent: 1_500 },
  { sends: 100_000, price: 3_000, paygEquivalent: 4_650 },
  { sends: 1_000_000, price: 6_000, paygEquivalent: 9_150 },
];

export interface WorkflowActionPack {
  edition: Extract<HubSpotEdition, "professional" | "enterprise">;
  label: string;
  actions: number;
  price: number;
}

// The source material's PAYG-equivalents for these two packs are flagged as
// suspicious (12x and 557x the pack price, vs roughly 1.5x for email packs)
// and explicitly says not to quote them without verification - so they are
// simply not included as a field here, rather than carried with a caveat.
export const WORKFLOW_ACTION_PACKS: WorkflowActionPack[] = [
  { edition: "professional", label: "Growth", actions: 500_000, price: 150 },
  { edition: "enterprise", label: "Scaled", actions: 500_000_000, price: 900 },
];

export const AGENT_PACKS: Record<HubSpotEdition, { credits: number; price: number }> = {
  starter: { credits: 2_500, price: 25 },
  professional: { credits: 40_000, price: 400 },
  enterprise: { credits: 150_000, price: 1_500 },
};

/** External, not in the HubSpot course itself - surfaced as a caveat, not a fact. */
export const STARTER_MAX_PAID_SEATS_UNVERIFIED = 10;

export const PRICING_SOURCE = {
  asOf: "1 oktober 2026",
  readOn: "2 oktober 2026",
  note: {
    en:
      'Source: HubSpot partner course "Flexible Seats-and-Credits Pricing for EMEA". Indicative - figures, ' +
      "packs and eligibility can change before full rollout. Always confirm with PDM or HubSpot Sales " +
      "before quoting.",
    nl:
      'Bron: HubSpot partnercursus "Flexible Seats-and-Credits Pricing for EMEA". Indicatief - cijfers, ' +
      "packs en eligibility kunnen wijzigen vóór volledige uitrol. Bevestig altijd bij PDM of HubSpot Sales " +
      "vóór een offerte.",
  } satisfies LocalizedString,
};

export function createDefaultHubSpotLicenseApplicability(): HubSpotLicenseApplicability {
  return {
    newEmeaCustomerSinceOct2026: null,
    existingHubSpotCustomer: null,
    beneluxOrNordicsPilot: null,
    newPortalUnderExistingMultiPortal: null,
  };
}

export function createDefaultHubSpotLicenseState(): HubSpotLicenseState {
  return {
    enabled: false,
    applicability: createDefaultHubSpotLicenseApplicability(),
    edition: "professional",
    gtmSeats: 1,
    opsSeats: 0,
    viewOnlySeats: 0,
    expectedRecords: 0,
    expectedEmailsPerMonth: 0,
    expectedCreditsPerMonth: 0,
    notes: "",
  };
}

/**
 * true only once every applicability question has been answered and all
 * answers point at this pricing model. Anything else (an unanswered
 * question, or a "no") means don't treat the numbers below as the deal's
 * actual pricing model without checking further - this mirrors the
 * source material's "most common mistake" warning.
 */
export function isApplicabilityConfirmed(a: HubSpotLicenseApplicability): boolean {
  return (
    a.newEmeaCustomerSinceOct2026 === true &&
    a.existingHubSpotCustomer === false &&
    a.beneluxOrNordicsPilot === false &&
    a.newPortalUnderExistingMultiPortal === false
  );
}

export interface EmailPackChoice {
  pack: EmailPack;
  count: number;
}

export interface HubSpotLicenseWarning {
  level: "info" | "warning";
  message: LocalizedString;
}

export interface HubSpotLicenseResult {
  seatCost: number;
  creditOverage: number;
  creditOverageCost: number;
  emailPacksCost: number;
  emailPackChoices: EmailPackChoice[];
  /** Seats + email packs only. Credit overage is shown separately since it's PAYG/variable, not a committed monthly cost. */
  monthlyTotal: number;
  warnings: HubSpotLicenseWarning[];
}

/** Cheapest combination of the four fixed email packs that covers the expected volume (packs may be mixed, per quote.py). */
function chooseEmailPacks(emailsPerMonth: number): { cost: number; choices: EmailPackChoice[] } {
  if (emailsPerMonth <= 0) return { cost: 0, choices: [] };

  const step = 2_000;
  const need = Math.ceil(emailsPerMonth / step);
  const best: { cost: number; combo: number[] }[] = [{ cost: 0, combo: [] }];

  for (let n = 1; n <= need; n++) {
    let bestCost = Infinity;
    let bestCombo: number[] = [];
    for (const pack of EMAIL_PACKS) {
      const packUnits = Math.floor(pack.sends / step);
      const prev = best[Math.max(0, n - packUnits)];
      const cost = prev.cost + pack.price;
      if (cost < bestCost) {
        bestCost = cost;
        bestCombo = [...prev.combo, pack.sends];
      }
    }
    best.push({ cost: bestCost, combo: bestCombo });
  }

  const result = best[need];
  const counts = new Map<number, number>();
  for (const sends of result.combo) counts.set(sends, (counts.get(sends) ?? 0) + 1);
  const choices = EMAIL_PACKS.filter((p) => counts.has(p.sends)).map((pack) => ({
    pack,
    count: counts.get(pack.sends)!,
  }));

  return { cost: result.cost, choices };
}

export function computeHubSpotLicenseCost(state: HubSpotLicenseState): HubSpotLicenseResult {
  const seatPrices = SEAT_PRICES[state.edition];
  const seatCost = state.gtmSeats * seatPrices.gtm + state.opsSeats * seatPrices.ops;

  const included = INCLUDED_CREDITS[state.edition];
  const creditOverage = Math.max(0, state.expectedCreditsPerMonth - included);
  const creditOverageCost = creditOverage * PAYG_CREDIT_PRICE;

  const { cost: emailPacksCost, choices: emailPackChoices } = chooseEmailPacks(state.expectedEmailsPerMonth);

  const warnings: HubSpotLicenseWarning[] = [];

  if (state.gtmSeats < 1) {
    warnings.push({
      level: "warning",
      message: {
        en: "At least 1 GTM Seat is required per portal - standalone Ops Seats are not supported.",
        nl: "Minimaal 1 GTM Seat per portal nodig - standalone Ops Seats worden niet ondersteund.",
      },
    });
  }
  if (state.edition === "starter" && state.gtmSeats + state.opsSeats > STARTER_MAX_PAID_SEATS_UNVERIFIED) {
    warnings.push({
      level: "warning",
      message: {
        en: `Starter may have a maximum of ${STARTER_MAX_PAID_SEATS_UNVERIFIED} paid seats (source: external, not confirmed in the HubSpot course itself - check with PDM).`,
        nl: `Starter heeft mogelijk een maximum van ${STARTER_MAX_PAID_SEATS_UNVERIFIED} betaalde seats (bron: extern, niet bevestigd in de HubSpot-cursus zelf - check bij PDM).`,
      },
    });
  }
  if (state.expectedRecords > RECORD_LIMITS[state.edition]) {
    warnings.push({
      level: "warning",
      message: {
        en: `Expected ${state.expectedRecords.toLocaleString("en-US")} records exceeds the ${EDITION_LABELS[state.edition]} limit of ${RECORD_LIMITS[state.edition].toLocaleString("en-US")}. A higher edition is needed.`,
        nl: `Verwachte ${state.expectedRecords.toLocaleString("nl-NL")} records overschrijdt de ${EDITION_LABELS[state.edition]}-limiet van ${RECORD_LIMITS[state.edition].toLocaleString("nl-NL")}. Een hogere editie is nodig.`,
      },
    });
  }
  if (state.viewOnlySeats > 0) {
    warnings.push({
      level: "info",
      message: {
        en: "View-only Seat price is not in the source material and is not included in this total.",
        nl: "View-only Seat-prijs staat niet in de bron en is niet in dit totaal meegerekend.",
      },
    });
  }
  if (creditOverage > 0) {
    warnings.push({
      level: "info",
      message: {
        en: "Overage above included credits is priced here at PAYG list price. Committed credits get a discount, but the discount rate isn't in the source material - ask PDM.",
        nl: "Overschot boven inbegrepen credits is hier tegen PAYG list price gerekend. Committed credits geven korting, maar het kortingspercentage staat niet in de bron - vraag PDM.",
      },
    });
  }
  warnings.push({
    level: "info",
    message: {
      en: "Credits reset every month and don't roll over to the next month.",
      nl: "Credits resetten elke maand en rollen niet door naar de volgende maand.",
    },
  });

  return {
    seatCost,
    creditOverage,
    creditOverageCost,
    emailPacksCost,
    emailPackChoices,
    monthlyTotal: seatCost + emailPacksCost,
    warnings,
  };
}
