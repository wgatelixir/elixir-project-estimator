// One flat, import-friendly view of an estimation, shared by the Excel and JSON
// exports so both always carry the same numbers. It only holds what's in scope
// (included workstreams and lines), so it reconciles with the editor totals and
// the Proposal Summary. Names are in the estimation's language; keys, activity
// types and field names are stable, so an import mapping keeps working.

import {
  type WorkstreamTotals,
  computeEstimationTotals,
  totalsByStage,
  elixirSyncStreamHours,
  lineItemFinalEffort,
  lineItemRate,
  thirdPartyLineItemHours,
} from "../calculations";
import type { CustomWorkstreamType, DealStage, EstimationState, LineActivityType, EstimationStatus, LocalizedString, ProjectPhase } from "../types";

export const EXPORT_FORMAT = "elixir-estimation-export";
export const EXPORT_SCHEMA_VERSION = 1;

/** Stable activity values, independent of the estimation's display language. */
export type ExportActivity = LineActivityType | "Integration" | "Project management";

export interface ExportLine {
  workstreamKey: string;
  workstream: string;
  phase: ProjectPhase;
  /** The workstream's sales stage, repeated per line so a flat import can filter on it. */
  stage: DealStage;
  lineId: string;
  activity: ExportActivity;
  topic: string;
  description: string | null;
  durationHours: number | null;
  /** Null where the line has no standard effort of its own (integrations, PM). Per month on retainer lines. */
  standardEffortHours: number | null;
  complexity: string | null;
  /** Per month on retainer lines. */
  complexityAdjustmentHours: number | null;
  /** Total over all months (retainer) - so lines always add up to the workstream total. */
  finalEffortHours: number;
  hourlyRate: number;
  /** Total over all months (retainer). */
  price: number;
  /** 1 for one-off work; the retainer length otherwise. */
  months: number;
  /** Retainer lines only, else null. */
  hoursPerMonth: number | null;
  pricePerMonth: number | null;
}

export interface ExportWorkstream {
  key: string;
  name: string;
  phase: ProjectPhase;
  /** "proposal" counts toward the forecast; "closed_won" is already won. */
  stage: DealStage;
  /** Set for client-specific workstreams created on the Cover page; null for template workstreams and integrations. */
  type: CustomWorkstreamType | null;
  billing: "one_off" | "retainer";
  /** Retainer only, else null. hours/price below are the totals over all months. */
  retainerMonths: number | null;
  hoursPerMonth: number | null;
  pricePerMonth: number | null;
  hours: number;
  hourlyRate: number;
  price: number;
  pmHours: number;
  pmRate: number;
  pmPrice: number;
  /** price + pmPrice: what this onderdeel costs in total. */
  totalPrice: number;
  /** Includes one "Project management" line, so the lines add up to totalPrice. */
  lines: ExportLine[];
}

export interface ExportSubscription {
  key: string;
  name: string;
  quantity: number;
  unitPrice: number;
  price: number;
}

export interface EstimationExport {
  format: typeof EXPORT_FORMAT;
  schemaVersion: typeof EXPORT_SCHEMA_VERSION;
  exportedAt: string;
  currency: "EUR";
  locale: EstimationState["locale"];
  estimation: {
    id: string;
    clientName: string;
    projectName: string | null;
    ownerName: string | null;
    status: EstimationStatus;
  };
  projectManagement: { percent: number; hourlyRate: number };
  workstreams: ExportWorkstream[];
  subscriptions: ExportSubscription[];
  totals: {
    hours: number;
    price: number;
    pmHours: number;
    pmPrice: number;
    totalHours: number;
    totalPrice: number;
    subscriptionsPrice: number;
    grandTotalPrice: number;
    /** grandTotalPrice split by stage (incl. PM; subscriptions follow their integration). */
    closedWonPrice: number;
    proposalPrice: number;
  };
}

export interface ExportMeta {
  id: string;
  clientName: string;
  projectName: string;
  ownerName: string;
  status: EstimationStatus;
}

/** Rounds away float noise (e.g. 94.94999999) without hiding real fractions. */
const round = (n: number) => Math.round(n * 100) / 100;

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

export function buildEstimationExport(meta: ExportMeta, data: EstimationState, now = new Date()): EstimationExport {
  const locale = data.locale;
  const name = (l: LocalizedString) => l[locale] || l.en;
  const totals = computeEstimationTotals(data);
  const byStage = totalsByStage(totals);

  // Lines are built without the stage; workstream() stamps its stage onto each of them.
  type LineDraft = Omit<ExportLine, "stage">;
  const pmLine = (key: string, workstream: string, phase: ProjectPhase, pmHours: number, months: number): LineDraft => ({
    workstreamKey: key,
    workstream,
    phase,
    lineId: `${key}-pm`,
    activity: "Project management",
    topic: locale === "nl" ? "Projectmanagement" : "Project management",
    description: null,
    durationHours: null,
    standardEffortHours: null,
    complexity: null,
    complexityAdjustmentHours: null,
    finalEffortHours: round(pmHours),
    hourlyRate: data.pmRate,
    price: round(pmHours * data.pmRate),
    months,
    hoursPerMonth: months > 1 ? round(pmHours / months) : null,
    pricePerMonth: months > 1 ? round((pmHours / months) * data.pmRate) : null,
  });

  const workstream = (
    w: WorkstreamTotals,
    lines: LineDraft[],
    type: CustomWorkstreamType | null = null
  ): ExportWorkstream => ({
    key: w.key,
    name: name(w.label),
    phase: w.phase,
    stage: w.stage,
    type,
    billing: w.retainer ? "retainer" : "one_off",
    retainerMonths: w.retainer?.months ?? null,
    hoursPerMonth: w.retainer ? round(w.retainer.monthlyHours) : null,
    pricePerMonth: w.retainer ? round(w.retainer.monthlyPrice) : null,
    hours: round(w.hours),
    hourlyRate: round(w.hourlyRate),
    price: round(w.price),
    pmHours: round(w.pmHours),
    pmRate: data.pmRate,
    pmPrice: round(w.pmPrice),
    totalPrice: round(w.price + w.pmPrice),
    lines: [...lines, pmLine(w.key, name(w.label), w.phase, w.pmHours, w.retainer?.months ?? 1)].map((line) => ({
      ...line,
      stage: w.stage,
    })),
  });

  const workstreams: ExportWorkstream[] = [];

  for (const ws of data.standardWorkstreams) {
    if (!ws.enabled) continue;
    const w = totals.workstreams.find((t) => t.key === ws.key)!;
    const months = w.retainer?.months ?? 1;
    const lines = ws.items
      .filter((item) => item.enabled)
      .map((item): LineDraft => {
        const finalEffort = lineItemFinalEffort(item, ws);
        const rate = lineItemRate(item, ws);
        return {
          workstreamKey: ws.key,
          workstream: name(ws.label),
          phase: w.phase,
          lineId: item.id,
          activity: item.activity,
          topic: name(item.topic),
          description: item.comment ? name(item.comment) : null,
          durationHours: item.duration ?? null,
          standardEffortHours: item.standardEffort,
          complexity: item.complexity,
          complexityAdjustmentHours: round(finalEffort - item.standardEffort),
          finalEffortHours: round(finalEffort * months),
          hourlyRate: rate,
          price: round(finalEffort * months * rate),
          months,
          hoursPerMonth: w.retainer ? round(finalEffort) : null,
          pricePerMonth: w.retainer ? round(finalEffort * rate) : null,
        };
      });
    workstreams.push(workstream(w, lines, ws.custom?.type ?? null));
  }

  const tp = data.thirdPartyIntegration;
  if (tp.enabled) {
    const lines = tp.items
      .filter((item) => item.enabled && thirdPartyLineItemHours(item, tp) > 0)
      .map((item): LineDraft => {
        const hours = thirdPartyLineItemHours(item, tp);
        const direction = item.from && item.to ? ` (${item.from} → ${item.to})` : "";
        return {
          workstreamKey: totals.thirdParty.key,
          workstream: name(totals.thirdParty.label),
          phase: totals.thirdParty.phase,
          lineId: item.id,
          activity: item.activity,
          topic: `${name(item.topic)}${direction}`,
          description: null,
          durationHours: null,
          standardEffortHours: null,
          complexity: item.complexity,
          complexityAdjustmentHours: null,
          finalEffortHours: round(hours),
          hourlyRate: tp.hourlyRate,
          price: round(hours * tp.hourlyRate),
          months: 1,
          hoursPerMonth: null,
          pricePerMonth: null,
        };
      });
    workstreams.push(workstream(totals.thirdParty, lines));
  }

  const es = data.elixirSyncIntegration;
  if (es.enabled) {
    const lines = es.streams
      .filter((stream) => stream.included)
      .map((stream): LineDraft => {
        const hours = elixirSyncStreamHours(stream);
        return {
          workstreamKey: totals.elixirSync.key,
          workstream: name(totals.elixirSync.label),
          phase: totals.elixirSync.phase,
          lineId: stream.id,
          activity: "Integration",
          topic: stream.label,
          description: null,
          durationHours: null,
          standardEffortHours: null,
          complexity: null,
          complexityAdjustmentHours: null,
          finalEffortHours: round(hours),
          hourlyRate: es.hourlyRate,
          price: round(hours * es.hourlyRate),
          months: 1,
          hoursPerMonth: null,
          pricePerMonth: null,
        };
      });
    workstreams.push(workstream(totals.elixirSync, lines));
  }

  return {
    format: EXPORT_FORMAT,
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    currency: "EUR",
    locale,
    estimation: {
      id: meta.id,
      clientName: meta.clientName,
      projectName: meta.projectName || null,
      ownerName: meta.ownerName || null,
      status: meta.status,
    },
    projectManagement: { percent: data.pmPercent, hourlyRate: data.pmRate },
    workstreams,
    subscriptions: totals.subscriptions
      .filter((sub) => sub.qty > 0)
      .map((sub) => ({
        key: slug(sub.label.en),
        name: name(sub.label),
        quantity: sub.qty,
        unitPrice: sub.unitPrice,
        price: round(sub.price),
      })),
    totals: {
      hours: round(totals.billableHours),
      price: round(totals.billablePrice),
      pmHours: round(totals.pmHours),
      pmPrice: round(totals.pmPrice),
      totalHours: round(totals.totalEffortHours),
      totalPrice: round(totals.totalEffortPrice),
      subscriptionsPrice: round(totals.subscriptionsPrice),
      grandTotalPrice: round(totals.grandTotalPrice),
      closedWonPrice: round(byStage.closed_won.price),
      proposalPrice: round(byStage.proposal.price),
    },
  };
}

/** File name without extension, e.g. "acme-crm-rollout-estimation-2026-10-16". */
export function exportFileBaseName(meta: ExportMeta, now = new Date()): string {
  const parts = [meta.clientName, meta.projectName].map((p) => slug(p ?? "").replace(/_/g, "-")).filter(Boolean);
  return [...parts, "estimation", now.toISOString().slice(0, 10)].join("-");
}
