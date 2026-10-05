"use client";

import Image from "next/image";
import type { EstimationState, EstimationStatus, Locale } from "@/lib/types";
import { computeEstimationTotals, lineItemFinalEffort, thirdPartyLineItemHours } from "@/lib/calculations";
import { formatCurrency, formatHours, formatPercent } from "@/lib/format";
import {
  ACTIVITY_STYLES,
  classifyActivity,
  classifyComplexity,
  complexityCommentsByBand,
  complexityHoursByBand,
  COMPLEXITY_STYLES,
} from "@/lib/style";
import { t, UI_STRINGS } from "@/lib/i18n";
import { PanelLegend } from "./Legend";
import { LineItemNote } from "./LineItemNote";

interface Meta {
  clientName: string;
  projectName: string;
  ownerName: string;
  status: EstimationStatus;
}

// Fixed column widths so every table of a given shape lines up with every
// other table of that shape, down the whole page - not just internally
// consistent within its own SectionCard.
const WORKSTREAM_COLS = ["13%", "39%", "9%", "22%", "17%"];
const THIRD_PARTY_COLS = ["10%", "24%", "16%", "16%", "20%", "14%"];
const ELIXIRSYNC_COLS = ["75%", "25%"];
const OVERVIEW_COLS = ["40%", "20%", "20%", "20%"];

function ColGroup({ widths }: { widths: string[] }) {
  return (
    <colgroup>
      {widths.map((w, i) => (
        <col key={i} style={{ width: w }} />
      ))}
    </colgroup>
  );
}

function ActivityPill({ activity, locale }: { activity: string; locale: Locale }) {
  const style = ACTIVITY_STYLES[classifyActivity(activity)];
  return (
    <span className={`inline-flex items-center rounded px-1 py-0.5 text-[11px] font-medium ${style.badge}`}>
      {t(style.label, locale)}
    </span>
  );
}

function ComplexityPill({ level }: { level: string }) {
  const style = COMPLEXITY_STYLES[classifyComplexity(level)];
  return (
    <span className={`inline-flex items-center rounded px-1 py-0.5 text-[11px] font-medium ${style.badge}`}>
      {level}
    </span>
  );
}

/** A single onderdeel's own PM contribution, nested under its row in the Overview table. */
function OverviewPmRow({
  label,
  pmPercent,
  pmHours,
  pmRate,
  pmPrice,
  locale,
}: {
  label: string;
  pmPercent: number;
  pmHours: number;
  pmRate: number;
  pmPrice: number;
  locale: Locale;
}) {
  return (
    <tr className="print:break-inside-avoid">
      <td className="truncate py-1 pl-6 pr-3 text-slate-400">
        {label} ({formatPercent(pmPercent)})
      </td>
      <td className="px-3 py-1 text-right tabular-nums text-slate-400">{formatHours(pmHours, locale)}</td>
      <td className="px-3 py-1 text-right tabular-nums text-slate-400">{formatCurrency(pmRate, locale)}</td>
      <td className="px-3 py-1 text-right tabular-nums text-slate-500">{formatCurrency(pmPrice, locale)}</td>
    </tr>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="flex items-baseline justify-between gap-3 bg-brand-indigo px-3 py-1.5 text-white">
        <h3 className="text-xs font-semibold">{title}</h3>
        {subtitle && <span className="text-[11px] text-white/80">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function ProposalHeader({
  meta,
  locale,
  generatedOn,
  statusLabel,
}: {
  meta: Meta;
  locale: Locale;
  generatedOn: string;
  statusLabel: string;
}) {
  const s = UI_STRINGS.proposalSummary;
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-3 shadow-sm">
        <div>
          <Image src="/elixir-logo.png" alt="Elixir" width={72} height={24} className="mb-1.5" />
          <h2 className="text-base font-semibold text-brand-ink">{meta.clientName || t(s.untitledClient, locale)}</h2>
          {meta.projectName && <p className="text-[11px] text-slate-500">{meta.projectName}</p>}
        </div>
        <div className="text-right text-[11px] text-slate-400">
          <div>
            {t(s.generated, locale)} {generatedOn}
          </div>
          {meta.ownerName && (
            <div>
              {t(s.preparedBy, locale)} {meta.ownerName}
            </div>
          )}
          <div className="mt-0.5 font-medium uppercase tracking-wide text-brand-indigo">{statusLabel}</div>
        </div>
      </div>
      {meta.status !== "FINAL" && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-medium text-amber-800">
          {t(s.draftDisclaimer, locale)}
        </p>
      )}
    </div>
  );
}

/**
 * One printed page per onderdeel: the client header repeats at the top of
 * every page (so a single printed sheet still identifies itself), and every
 * page but the first forces a page break before it so each section starts
 * clean rather than splitting mid-table across a page boundary.
 */
function Page({ children, first }: { children: React.ReactNode; first: boolean }) {
  return <div className={`space-y-2.5 ${first ? "" : "print:break-before-page"}`}>{children}</div>;
}

export function ProposalSummary({ meta, data }: { meta: Meta; data: EstimationState }) {
  const locale = data.locale;
  const s = UI_STRINGS.proposalSummary;
  const totals = computeEstimationTotals(data);
  const generatedOn = new Date().toLocaleDateString(locale === "nl" ? "nl-NL" : "en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const enabledWorkstreams = data.standardWorkstreams.filter((ws) => ws.enabled);
  const thirdParty = data.thirdPartyIntegration;
  const elixirSync = data.elixirSyncIntegration;
  const includedStreams = elixirSync.streams.filter((stream) => stream.included);
  const statusLabel = meta.status === "FINAL" ? t(s.statusFinal, locale) : t(s.statusDraft, locale);

  const pages: { key: string; content: React.ReactNode }[] = [];

  enabledWorkstreams.forEach((ws) => {
    const items = ws.items.filter((item) => item.enabled);
    const hours = items.reduce((sum, item) => sum + lineItemFinalEffort(item, ws), 0);
    const wTotals = totals.workstreams.find((w) => w.key === ws.key)!;
    pages.push({
      key: ws.key,
      content: (
        <SectionCard
          title={t(ws.label, locale)}
          subtitle={`${formatHours(hours, locale)} · ${formatCurrency(hours * ws.hourlyRate, locale)}`}
        >
          <table className="w-full table-fixed text-left">
            <ColGroup widths={WORKSTREAM_COLS} />
            <thead className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="truncate px-3 py-1 font-medium">{t(s.columnActivity, locale)}</th>
                <th className="truncate px-3 py-1 font-medium">{t(s.columnTopic, locale)}</th>
                <th className="truncate px-3 py-1 text-right font-medium">{t(s.columnStd, locale)}</th>
                <th className="truncate px-3 py-1 font-medium">{t(s.columnComplexity, locale)}</th>
                <th className="truncate px-3 py-1 text-right font-medium">{t(s.columnFinal, locale)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item) => {
                const activityStyle = ACTIVITY_STYLES[classifyActivity(item.activity)];
                return (
                  <tr key={item.id} className={`${activityStyle.rowBg} print:break-inside-avoid`}>
                    <td className="px-3 py-1">
                      <ActivityPill activity={item.activity} locale={locale} />
                    </td>
                    <td className="px-3 py-1 text-brand-ink">
                      <div className="truncate">{t(item.topic, locale)}</div>
                      <LineItemNote comment={item.comment} locale={locale} />
                    </td>
                    <td className="px-3 py-1 text-right tabular-nums text-slate-600">{item.standardEffort}</td>
                    <td className="px-3 py-1">
                      <ComplexityPill level={item.complexity} />
                    </td>
                    <td className="px-3 py-1 text-right tabular-nums font-medium text-brand-ink">
                      {formatHours(lineItemFinalEffort(item, ws), locale)}
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-2 text-center text-slate-400">
                    {t(s.noLineItems, locale)}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-brand-ink">
                <td className="px-3 py-1" colSpan={4}>
                  {t(s.total, locale)}
                </td>
                <td className="px-3 py-1 text-right tabular-nums">{formatHours(hours, locale)}</td>
              </tr>
              <tr className="bg-slate-50 text-brand-ink">
                <td className="px-3 py-1" colSpan={4}>
                  {t(UI_STRINGS.workstreamPanel.budget, locale)}
                </td>
                <td className="px-3 py-1 text-right tabular-nums">{formatCurrency(wTotals.price, locale)}</td>
              </tr>
              <tr className="bg-slate-50 text-slate-600">
                <td className="px-3 py-1" colSpan={4}>
                  {t(UI_STRINGS.workstreamPanel.projectManagement, locale)} ({formatPercent(totals.pmPercent)})
                </td>
                <td className="px-3 py-1 text-right tabular-nums">{formatCurrency(wTotals.pmPrice, locale)}</td>
              </tr>
              <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-brand-ink">
                <td className="px-3 py-1" colSpan={4}>
                  {t(UI_STRINGS.workstreamPanel.total, locale)}
                </td>
                <td className="px-3 py-1 text-right tabular-nums">
                  {formatCurrency(wTotals.price + wTotals.pmPrice, locale)}
                </td>
              </tr>
            </tfoot>
          </table>
          <PanelLegend
            variant="standard"
            position="bottom"
            sessionHours={complexityHoursByBand(ws.sessionComplexity)}
            setupHours={complexityHoursByBand(ws.setupComplexity)}
            comments={complexityCommentsByBand(ws.sessionComplexity)}
            locale={locale}
          />
        </SectionCard>
      ),
    });
  });

  if (thirdParty.enabled) {
    pages.push({
      key: "third_party_integration",
      content: (
        <SectionCard
          title={t(s.thirdPartyIntegration, locale)}
          subtitle={`${formatHours(totals.thirdParty.hours, locale)} · ${formatCurrency(totals.thirdParty.price, locale)}`}
        >
          <table className="w-full table-fixed text-left">
            <ColGroup widths={THIRD_PARTY_COLS} />
            <thead className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="truncate px-3 py-1 font-medium">{t(s.columnActivity, locale)}</th>
                <th className="truncate px-3 py-1 font-medium">{t(s.columnTopic, locale)}</th>
                <th className="truncate px-3 py-1 font-medium">{t(s.columnFrom, locale)}</th>
                <th className="truncate px-3 py-1 font-medium">{t(s.columnTo, locale)}</th>
                <th className="truncate px-3 py-1 font-medium">{t(s.columnComplexity, locale)}</th>
                <th className="truncate px-3 py-1 text-right font-medium">{t(s.columnHours, locale)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {thirdParty.items
                .filter((item) => item.enabled)
                .map((item) => {
                  const activityStyle = ACTIVITY_STYLES[classifyActivity(item.activity)];
                  return (
                    <tr key={item.id} className={`${activityStyle.rowBg} print:break-inside-avoid`}>
                      <td className="px-3 py-1">
                        <ActivityPill activity={item.activity} locale={locale} />
                      </td>
                      <td className="truncate px-3 py-1 text-brand-ink">{t(item.topic, locale)}</td>
                      <td className="truncate px-3 py-1 text-slate-600">{item.from || "—"}</td>
                      <td className="truncate px-3 py-1 text-slate-600">{item.to || "—"}</td>
                      <td className="px-3 py-1">
                        <ComplexityPill level={item.complexity} />
                      </td>
                      <td className="px-3 py-1 text-right tabular-nums font-medium text-brand-ink">
                        {formatHours(thirdPartyLineItemHours(item, thirdParty), locale)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-brand-ink">
                <td className="px-3 py-1" colSpan={5}>
                  {t(s.total, locale)}
                </td>
                <td className="px-3 py-1 text-right tabular-nums">{formatHours(totals.thirdParty.hours, locale)}</td>
              </tr>
              <tr className="bg-slate-50 text-brand-ink">
                <td className="px-3 py-1" colSpan={5}>
                  {t(UI_STRINGS.workstreamPanel.budget, locale)}
                </td>
                <td className="px-3 py-1 text-right tabular-nums">{formatCurrency(totals.thirdParty.price, locale)}</td>
              </tr>
              <tr className="bg-slate-50 text-slate-600">
                <td className="px-3 py-1" colSpan={5}>
                  {t(UI_STRINGS.workstreamPanel.projectManagement, locale)} ({formatPercent(totals.pmPercent)})
                </td>
                <td className="px-3 py-1 text-right tabular-nums">{formatCurrency(totals.thirdParty.pmPrice, locale)}</td>
              </tr>
              <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-brand-ink">
                <td className="px-3 py-1" colSpan={5}>
                  {t(UI_STRINGS.workstreamPanel.total, locale)}
                </td>
                <td className="px-3 py-1 text-right tabular-nums">
                  {formatCurrency(totals.thirdParty.price + totals.thirdParty.pmPrice, locale)}
                </td>
              </tr>
            </tfoot>
          </table>
          <PanelLegend
            variant="thirdParty"
            showActivity={false}
            position="bottom"
            sessionHours={complexityHoursByBand(thirdParty.sessionComplexity)}
            setupHours={complexityHoursByBand(thirdParty.setupComplexity)}
            comments={complexityCommentsByBand(thirdParty.sessionComplexity)}
            locale={locale}
          />
        </SectionCard>
      ),
    });
  }

  if (elixirSync.enabled) {
    pages.push({
      key: "elixirsync_integration",
      content: (
        <SectionCard
          title={t(s.elixirSyncIntegration, locale)}
          subtitle={`${formatHours(totals.elixirSync.hours, locale)} · ${formatCurrency(totals.elixirSync.price, locale)}`}
        >
          <table className="w-full table-fixed text-left">
            <ColGroup widths={ELIXIRSYNC_COLS} />
            <thead className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="truncate px-3 py-1 font-medium">{t(s.columnStream, locale)}</th>
                <th className="truncate px-3 py-1 text-right font-medium">{t(s.columnRealisticEffort, locale)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {includedStreams.map((stream) => {
                const hours = stream.items.reduce((sum, item) => sum + item.realistic, 0);
                return (
                  <tr key={stream.id} className="print:break-inside-avoid">
                    <td className="truncate px-3 py-1 text-brand-ink">{stream.label}</td>
                    <td className="px-3 py-1 text-right tabular-nums font-medium text-brand-ink">
                      {formatHours(hours, locale)}
                    </td>
                  </tr>
                );
              })}
              {includedStreams.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-3 py-2 text-center text-slate-400">
                    {t(s.noStreamsSelected, locale)}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-brand-ink">
                <td className="px-3 py-1">{t(s.total, locale)}</td>
                <td className="px-3 py-1 text-right tabular-nums">{formatHours(totals.elixirSync.hours, locale)}</td>
              </tr>
              <tr className="bg-slate-50 text-brand-ink">
                <td className="px-3 py-1">{t(UI_STRINGS.workstreamPanel.budget, locale)}</td>
                <td className="px-3 py-1 text-right tabular-nums">{formatCurrency(totals.elixirSync.price, locale)}</td>
              </tr>
              <tr className="bg-slate-50 text-slate-600">
                <td className="px-3 py-1">
                  {t(UI_STRINGS.workstreamPanel.projectManagement, locale)} ({formatPercent(totals.pmPercent)})
                </td>
                <td className="px-3 py-1 text-right tabular-nums">{formatCurrency(totals.elixirSync.pmPrice, locale)}</td>
              </tr>
              <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-brand-ink">
                <td className="px-3 py-1">{t(UI_STRINGS.workstreamPanel.total, locale)}</td>
                <td className="px-3 py-1 text-right tabular-nums">
                  {formatCurrency(totals.elixirSync.price + totals.elixirSync.pmPrice, locale)}
                </td>
              </tr>
            </tfoot>
          </table>
          <p className="border-t border-slate-100 px-3 py-1 text-[10px] text-slate-400">
            {t(s.technicalBreakdownNote, locale)}
          </p>
        </SectionCard>
      ),
    });
  }

  pages.push({
    key: "overview",
    content: (
      <SectionCard title={t(s.overview, locale)}>
        <table className="w-full table-fixed text-left">
          <ColGroup widths={OVERVIEW_COLS} />
          <thead className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="truncate px-3 py-1 font-medium">{t(s.columnWorkstream, locale)}</th>
              <th className="truncate px-3 py-1 text-right font-medium">{t(s.columnHours, locale)}</th>
              <th className="truncate px-3 py-1 text-right font-medium">{t(s.columnRate, locale)}</th>
              <th className="truncate px-3 py-1 text-right font-medium">{t(s.columnPrice, locale)}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {totals.workstreams
              .filter((w) => w.enabled)
              .flatMap((w) => [
                <tr key={w.key} className="print:break-inside-avoid">
                  <td className="truncate px-3 py-1 text-brand-ink">{t(w.label, locale)}</td>
                  <td className="px-3 py-1 text-right tabular-nums text-slate-600">{formatHours(w.hours, locale)}</td>
                  <td className="px-3 py-1 text-right tabular-nums text-slate-600">
                    {formatCurrency(w.hourlyRate, locale)}
                  </td>
                  <td className="px-3 py-1 text-right tabular-nums font-medium text-brand-ink">
                    {formatCurrency(w.price, locale)}
                  </td>
                </tr>,
                <OverviewPmRow
                  key={`${w.key}-pm`}
                  label={t(s.projectManagement, locale)}
                  pmPercent={totals.pmPercent}
                  pmHours={w.pmHours}
                  pmRate={totals.pmRate}
                  pmPrice={w.pmPrice}
                  locale={locale}
                />,
              ])}
            {totals.thirdParty.enabled && (
              <>
                <tr>
                  <td className="truncate px-3 py-1 text-brand-ink">{t(totals.thirdParty.label, locale)}</td>
                  <td className="px-3 py-1 text-right tabular-nums text-slate-600">
                    {formatHours(totals.thirdParty.hours, locale)}
                  </td>
                  <td className="px-3 py-1 text-right tabular-nums text-slate-600">
                    {formatCurrency(totals.thirdParty.hourlyRate, locale)}
                  </td>
                  <td className="px-3 py-1 text-right tabular-nums font-medium text-brand-ink">
                    {formatCurrency(totals.thirdParty.price, locale)}
                  </td>
                </tr>
                <OverviewPmRow
                  label={t(s.projectManagement, locale)}
                  pmPercent={totals.pmPercent}
                  pmHours={totals.thirdParty.pmHours}
                  pmRate={totals.pmRate}
                  pmPrice={totals.thirdParty.pmPrice}
                  locale={locale}
                />
              </>
            )}
            {totals.elixirSync.enabled && (
              <>
                <tr>
                  <td className="truncate px-3 py-1 text-brand-ink">{t(totals.elixirSync.label, locale)}</td>
                  <td className="px-3 py-1 text-right tabular-nums text-slate-600">
                    {formatHours(totals.elixirSync.hours, locale)}
                  </td>
                  <td className="px-3 py-1 text-right tabular-nums text-slate-600">
                    {formatCurrency(totals.elixirSync.hourlyRate, locale)}
                  </td>
                  <td className="px-3 py-1 text-right tabular-nums font-medium text-brand-ink">
                    {formatCurrency(totals.elixirSync.price, locale)}
                  </td>
                </tr>
                <OverviewPmRow
                  label={t(s.projectManagement, locale)}
                  pmPercent={totals.pmPercent}
                  pmHours={totals.elixirSync.pmHours}
                  pmRate={totals.pmRate}
                  pmPrice={totals.elixirSync.pmPrice}
                  locale={locale}
                />
              </>
            )}
            {totals.subscriptions
              .filter((sub) => sub.qty > 0)
              .map((sub) => (
                <tr key={sub.label.en} className="print:break-inside-avoid">
                  <td className="truncate px-3 py-1 text-brand-ink" colSpan={3}>
                    {t(sub.label, locale)} ({sub.qty}&times;)
                  </td>
                  <td className="px-3 py-1 text-right tabular-nums font-medium text-brand-ink">
                    {formatCurrency(sub.price, locale)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between bg-brand-indigo px-3 py-2 text-white">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-white/80">{t(s.grandTotal, locale)}</div>
            <div className="text-[10px] text-white/70">
              {formatHours(totals.totalEffortHours, locale)} {t(s.totalEffort, locale)}
            </div>
          </div>
          <div className="text-lg font-semibold tabular-nums">{formatCurrency(totals.grandTotalPrice, locale)}</div>
        </div>
      </SectionCard>
    ),
  });

  // Grand total leads instead of trailing - both on screen and as the PDF's first page.
  const overviewIndex = pages.findIndex((page) => page.key === "overview");
  if (overviewIndex > 0) {
    const [overviewPage] = pages.splice(overviewIndex, 1);
    pages.unshift(overviewPage);
  }

  return (
    <div className="mx-auto max-w-[960px] space-y-6 text-xs print:space-y-0">
      {pages.map((page, i) => (
        <Page key={page.key} first={i === 0}>
          <ProposalHeader meta={meta} locale={locale} generatedOn={generatedOn} statusLabel={statusLabel} />
          {page.content}
        </Page>
      ))}
    </div>
  );
}
