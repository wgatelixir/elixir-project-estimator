"use client";

import { useState } from "react";
import type { ComplexityTable, LineActivityType, Locale, StandardLineItem, StandardWorkstream } from "@/lib/types";
import { lineItemFinalEffort, workstreamMonths } from "@/lib/calculations";
import { formatCurrency, formatHours, formatPercent } from "@/lib/format";
import {
  ACTIVITY_STYLES,
  classifyActivity,
  classifyComplexity,
  complexityCommentsByBand,
  complexityHoursByBand,
  COMPLEXITY_STYLES,
} from "@/lib/style";
import { DEFAULT_HOURLY_RATES } from "@/lib/templates";
import { t, UI_STRINGS } from "@/lib/i18n";
import { removeLine, setLineEnabled } from "@/lib/lineLinks";
import { CUSTOM_WORKSTREAM_TYPES, CUSTOM_WORKSTREAM_TYPE_LABELS, DEFAULT_RETAINER_MONTHS } from "@/lib/customWorkstreams";
import type { CustomWorkstreamType } from "@/lib/types";
import { PanelLegend } from "./Legend";
import { LineItemNote } from "./LineItemNote";
import { RateHint } from "./RateHint";

function slugId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function complexityOptionsFor(item: StandardLineItem, ws: StandardWorkstream): string[] {
  const table = item.complexityTable === "session" ? ws.sessionComplexity : ws.setupComplexity;
  return Object.keys(table);
}

/**
 * Session rows show how many lines follow them on/off; prep rows (and any other
 * linked row) get a compact picker to change or remove their session link.
 */
function LineLink({
  item,
  workstream,
  locale,
  onChange,
}: {
  item: StandardLineItem;
  workstream: StandardWorkstream;
  locale: Locale;
  onChange: (linkedTo: string | null) => void;
}) {
  const s = UI_STRINGS.workstreamPanel;
  if (item.activity === "Session") {
    const count = workstream.items.filter((it) => it.linkedTo === item.id).length;
    if (count === 0) return null;
    return (
      <p className="mt-0.5 text-[11px] text-sky-700" title={t(s.linkedSessionTitle, locale)}>
        &#128279; {count} {t(s.linkedCount, locale)}
      </p>
    );
  }
  if (item.activity !== "Session Prep" && !item.linkedTo) return null;
  const sessions = workstream.items.filter((it) => it.activity === "Session");
  return (
    <label className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500" title={t(s.linkTitle, locale)}>
      <span aria-hidden>&#128279;</span>
      <select
        value={item.linkedTo ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className={`max-w-[340px] truncate rounded border border-transparent bg-transparent py-0 pl-0.5 pr-5 text-[11px] hover:border-slate-200 focus:border-brand-indigo focus:outline-none ${item.linkedTo ? "text-sky-700" : "text-slate-400"}`}
      >
        <option value="">{t(s.notLinked, locale)}</option>
        {sessions.map((session) => (
          <option key={session.id} value={session.id}>
            {t(s.linkedTo, locale)} {session.topic[locale]}
          </option>
        ))}
      </select>
    </label>
  );
}

export function WorkstreamPanel({
  workstream,
  onChange,
  pmPercent,
  pmRate,
  locale = "en",
}: {
  workstream: StandardWorkstream;
  onChange: (next: StandardWorkstream) => void;
  pmPercent: number;
  pmRate: number;
  locale?: Locale;
}) {
  const s = UI_STRINGS.workstreamPanel;
  const [showTables, setShowTables] = useState(false);
  const [newActivity, setNewActivity] = useState<LineActivityType>("Session");
  const [newTopic, setNewTopic] = useState("");
  const [newEffort, setNewEffort] = useState(4);
  const [newTable, setNewTable] = useState<"session" | "setup">("session");
  // Drag-to-reorder: the row being dragged, and where it would land (above or below which row).
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; after: boolean } | null>(null);

  function updateItem(id: string, patch: Partial<StandardLineItem>) {
    onChange({
      ...workstream,
      items: workstream.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    });
  }

  function removeItem(id: string) {
    onChange(removeLine(workstream, id));
  }

  function moveItem(fromId: string, toId: string, after: boolean) {
    if (fromId === toId) return;
    const items = [...workstream.items];
    const [moved] = items.splice(items.findIndex((it) => it.id === fromId), 1);
    const target = items.findIndex((it) => it.id === toId);
    if (!moved || target < 0) return;
    items.splice(after ? target + 1 : target, 0, moved);
    onChange({ ...workstream, items });
  }

  function endDrag() {
    setDragId(null);
    setDropTarget(null);
  }

  function addItem() {
    if (!newTopic.trim()) return;
    const topicText = newTopic.trim();
    // A new prep line links itself to the session with the same topic, if there is one.
    const sameTopicSession =
      newActivity === "Session Prep"
        ? workstream.items.find(
            (it) => it.activity === "Session" && it.topic[locale].trim().toLowerCase() === topicText.toLowerCase()
          )
        : undefined;
    const item: StandardLineItem = {
      id: slugId(workstream.key),
      activity: newActivity,
      topic: { en: topicText, nl: topicText },
      duration: null,
      standardEffort: newEffort,
      complexityTable: newTable,
      complexity: "Standard" in workstream.sessionComplexity ? "Standard" : Object.keys(workstream.sessionComplexity)[0],
      linkedTo: sameTopicSession?.id ?? null,
      comment: null,
      enabled: true,
    };
    // Land the new line at the end of its own activity group (e.g. after the last
    // Session Prep line) rather than at the bottom of the table.
    const items = [...workstream.items];
    const lastOfGroup = items.map((it) => it.activity).lastIndexOf(newActivity);
    items.splice(lastOfGroup >= 0 ? lastOfGroup + 1 : items.length, 0, item);
    onChange({ ...workstream, items });
    setNewTopic("");
    setNewEffort(4);
  }

  function updateComplexityTable(which: "sessionComplexity" | "setupComplexity", level: string, hours: number) {
    const table: ComplexityTable = { ...workstream[which] };
    table[level] = { ...table[level], hours };
    onChange({ ...workstream, [which]: table });
  }

  // For a retainer the lines are hours per month; totals cover all months.
  const monthlyHours = workstream.items.reduce(
    (sum, it) => (it.enabled ? sum + lineItemFinalEffort(it, workstream) : sum),
    0
  );
  const months = workstreamMonths(workstream);
  const isRetainer = Boolean(workstream.custom?.retainerMonths);
  const totalHours = monthlyHours * months;
  const pmHours = totalHours * pmPercent;
  const pmPrice = pmHours * pmRate;

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <div className="min-w-0">
          {workstream.custom ? (
            <input
              value={workstream.label[locale]}
              onChange={(e) => onChange({ ...workstream, label: { en: e.target.value, nl: e.target.value } })}
              aria-label={t(s.workstreamName, locale)}
              className="-ml-1.5 w-full rounded border border-transparent px-1.5 py-0.5 text-base font-semibold text-brand-ink hover:border-slate-200 focus:border-brand-indigo focus:outline-none"
            />
          ) : (
            <h2 className="truncate text-base font-semibold text-brand-ink">{t(workstream.label, locale)}</h2>
          )}
          <label className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={workstream.enabled}
              onChange={(e) => onChange({ ...workstream, enabled: e.target.checked })}
              className="h-3.5 w-3.5 rounded border-slate-300 accent-brand-indigo"
            />
            {t(s.includeWorkstream, locale)}
          </label>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <label className="flex items-center gap-1.5">
            {t(s.hourlyRate, locale)}
            <input
              type="number"
              min={0}
              value={workstream.hourlyRate}
              onChange={(e) => onChange({ ...workstream, hourlyRate: Number(e.target.value) })}
              className="w-20 rounded border border-slate-300 px-1.5 py-1 text-right tabular-nums focus:border-brand-indigo focus:outline-none focus:ring-1 focus:ring-brand-indigo"
            />
          </label>
          <RateHint
            rate={workstream.hourlyRate}
            defaultRate={DEFAULT_HOURLY_RATES[workstream.key] ?? workstream.hourlyRate}
            locale={locale}
          />
          <span className="font-medium text-brand-ink">
            {formatHours(totalHours, locale)} &middot; {formatCurrency(totalHours * workstream.hourlyRate, locale)}
          </span>
        </div>
      </div>

      {workstream.custom && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-slate-200 bg-violet-50/60 px-4 py-2.5 text-sm text-slate-600">
          <label className="flex items-center gap-2">
            {t(s.workstreamType, locale)}
            <select
              value={workstream.custom.type}
              onChange={(e) =>
                onChange({ ...workstream, custom: { ...workstream.custom!, type: e.target.value as CustomWorkstreamType } })
              }
              className="rounded border border-slate-300 bg-white px-2 py-1 text-sm focus:border-brand-indigo focus:outline-none"
            >
              {CUSTOM_WORKSTREAM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(CUSTOM_WORKSTREAM_TYPE_LABELS[type], locale)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            {t(s.billing, locale)}
            <select
              value={isRetainer ? "retainer" : "one_off"}
              onChange={(e) =>
                onChange({
                  ...workstream,
                  custom: {
                    ...workstream.custom!,
                    retainerMonths: e.target.value === "retainer" ? DEFAULT_RETAINER_MONTHS : null,
                  },
                })
              }
              className="rounded border border-slate-300 bg-white px-2 py-1 text-sm focus:border-brand-indigo focus:outline-none"
            >
              <option value="one_off">{t(s.billingOneOff, locale)}</option>
              <option value="retainer">{t(s.billingRetainer, locale)}</option>
            </select>
          </label>
          {isRetainer && (
            <label className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={120}
                step={1}
                value={workstream.custom.retainerMonths ?? ""}
                onChange={(e) => {
                  const value = Math.round(Number(e.target.value));
                  if (value >= 1 && value <= 120) onChange({ ...workstream, custom: { ...workstream.custom!, retainerMonths: value } });
                }}
                className="w-16 rounded border border-slate-300 bg-white px-1.5 py-1 text-right tabular-nums focus:border-brand-indigo focus:outline-none"
              />
              {t(s.months, locale)}
              <span className="text-xs text-slate-500">{t(s.retainerHint, locale)}</span>
            </label>
          )}
        </div>
      )}

      <PanelLegend
        sessionHours={complexityHoursByBand(workstream.sessionComplexity)}
        setupHours={complexityHoursByBand(workstream.setupComplexity)}
        comments={complexityCommentsByBand(workstream.sessionComplexity)}
        locale={locale}
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="w-14 px-3 py-2" />
              <th className="px-3 py-2 font-medium">{t(s.columnActivity, locale)}</th>
              <th className="px-3 py-2 font-medium">{t(s.columnTopic, locale)}</th>
              <th className="px-3 py-2 text-right font-medium" title={t(s.durationTitle, locale)}>
                {t(s.columnDuration, locale)}
              </th>
              <th className="px-3 py-2 text-right font-medium">{t(s.columnStandard, locale)}</th>
              <th className="px-3 py-2 font-medium">{t(s.columnComplexity, locale)}</th>
              <th className="px-3 py-2 text-right font-medium">
                {t(s.columnFinalEffort, locale)}
                {isRetainer && <span className="block normal-case text-violet-600">{t(s.finalEffortPerMonth, locale)}</span>}
              </th>
              <th className="w-8 px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {workstream.items.map((item) => {
              const activityStyle = ACTIVITY_STYLES[classifyActivity(item.activity)];
              const complexityStyle = COMPLEXITY_STYLES[classifyComplexity(item.complexity)];
              return (
                <tr
                  key={item.id}
                  className={`${activityStyle.rowBg} ${item.enabled ? "" : "opacity-40"} ${dragId === item.id ? "opacity-30" : ""} ${
                    dropTarget?.id === item.id && dragId !== item.id
                      ? dropTarget.after
                        ? "shadow-[inset_0_-2px_0_0_var(--color-brand-indigo)]"
                        : "shadow-[inset_0_2px_0_0_var(--color-brand-indigo)]"
                      : ""
                  }`}
                  onDragOver={(e) => {
                    if (!dragId) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    const rect = e.currentTarget.getBoundingClientRect();
                    const after = e.clientY > rect.top + rect.height / 2;
                    if (dropTarget?.id !== item.id || dropTarget.after !== after) setDropTarget({ id: item.id, after });
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragId && dropTarget) moveItem(dragId, dropTarget.id, dropTarget.after);
                    endDrag();
                  }}
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      {/* Only the handle is draggable, so text in the row's inputs stays selectable. */}
                      <span
                        draggable
                        onDragStart={(e) => {
                          setDragId(item.id);
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", item.id);
                          const row = e.currentTarget.closest("tr");
                          if (row) e.dataTransfer.setDragImage(row, 16, 16);
                        }}
                        onDragEnd={endDrag}
                        title={t(s.dragToReorder, locale)}
                        className="cursor-grab select-none px-0.5 text-base leading-none text-slate-300 hover:text-slate-500 active:cursor-grabbing"
                      >
                        &#x2807;
                      </span>
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={(e) => onChange(setLineEnabled(workstream, item.id, e.target.checked))}
                        className="h-4 w-4 rounded border-slate-300 accent-brand-indigo"
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium ${activityStyle.badge}`}
                    >
                      {t(activityStyle.label, locale)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={item.topic[locale]}
                      onChange={(e) => updateItem(item.id, { topic: { ...item.topic, [locale]: e.target.value } })}
                      className="w-full rounded border border-transparent px-1.5 py-1 hover:border-slate-200 focus:border-brand-indigo focus:outline-none"
                    />
                    <LineItemNote comment={item.comment} locale={locale} />
                    <LineLink item={item} workstream={workstream} locale={locale} onChange={(linkedTo) => updateItem(item.id, { linkedTo })} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      value={item.duration ?? ""}
                      onChange={(e) =>
                        updateItem(item.id, { duration: e.target.value === "" ? null : Number(e.target.value) })
                      }
                      title={t(s.durationTitle, locale)}
                      className="w-14 rounded border border-transparent px-1.5 py-1 text-right tabular-nums text-slate-500 hover:border-slate-200 focus:border-brand-indigo focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      step="0.5"
                      value={item.standardEffort}
                      onChange={(e) => updateItem(item.id, { standardEffort: Number(e.target.value) })}
                      className="w-16 rounded border border-transparent px-1.5 py-1 text-right tabular-nums hover:border-slate-200 focus:border-brand-indigo focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={item.complexity}
                      onChange={(e) => updateItem(item.id, { complexity: e.target.value })}
                      className={`rounded border px-1.5 py-1 text-sm font-medium ${complexityStyle.select}`}
                    >
                      {complexityOptionsFor(item, workstream).map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium text-brand-ink">
                    {formatHours(lineItemFinalEffort(item, workstream), locale)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-slate-300 hover:text-brand-crimson"
                      title={t(s.removeLine, locale)}
                    >
                      &times;
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            {isRetainer && (
              <tr className="border-t border-slate-200 bg-violet-50/60 text-brand-ink">
                <td className="px-3 py-2" colSpan={6}>
                  {t(s.perMonth, locale)} &middot; {formatHours(monthlyHours, locale)}
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">
                  {formatCurrency(monthlyHours * workstream.hourlyRate, locale)}
                </td>
                <td className="px-3 py-2" />
              </tr>
            )}
            <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-brand-ink">
              <td className="px-3 py-2" colSpan={6}>
                {isRetainer ? `${t(s.totalOverMonths, locale)} ${months} ${t(s.months, locale)}` : t(s.totalFinalEffort, locale)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{formatHours(totalHours, locale)}</td>
              <td className="px-3 py-2" />
            </tr>
            <tr className="bg-slate-50 text-brand-ink">
              <td className="px-3 py-2" colSpan={6}>
                {t(s.budget, locale)}
              </td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums">
                {formatCurrency(totalHours * workstream.hourlyRate, locale)}
              </td>
              <td className="px-3 py-2" />
            </tr>
            <tr className="bg-slate-50 text-slate-600">
              <td className="px-3 py-2" colSpan={6}>
                {t(s.projectManagement, locale)} ({formatPercent(pmPercent)})
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(pmPrice, locale)}</td>
              <td className="px-3 py-2" />
            </tr>
            <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-brand-ink">
              <td className="px-3 py-2" colSpan={6}>
                {t(s.total, locale)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {formatCurrency(totalHours * workstream.hourlyRate + pmPrice, locale)}
              </td>
              <td className="px-3 py-2" />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex flex-wrap items-end gap-2 border-t border-slate-100 p-3">
        <select
          value={newActivity}
          onChange={(e) => {
            const v = e.target.value as LineActivityType;
            setNewActivity(v);
            setNewTable(v === "Session" ? "session" : "setup");
          }}
          className="rounded border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="Session">{t(s.activitySession, locale)}</option>
          <option value="Session Prep">{t(s.activitySessionPrep, locale)}</option>
          <option value="Setup">{t(s.activitySetup, locale)}</option>
          <option value="Risk Buffer">{t(s.activityRiskBuffer, locale)}</option>
        </select>
        <input
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          placeholder={t(s.newLineTopicPlaceholder, locale)}
          className="min-w-[200px] flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
        <input
          type="number"
          step="0.5"
          value={newEffort}
          onChange={(e) => setNewEffort(Number(e.target.value))}
          className="w-20 rounded border border-slate-300 px-2 py-1.5 text-right text-sm tabular-nums"
        />
        <select
          value={newTable}
          onChange={(e) => setNewTable(e.target.value as "session" | "setup")}
          className="rounded border border-slate-300 px-2 py-1.5 text-sm"
          title={t(s.whichComplexityTable, locale)}
        >
          <option value="session">{t(s.sessionComplexityOption, locale)}</option>
          <option value="setup">{t(s.setupComplexityOption, locale)}</option>
        </select>
        <button
          onClick={addItem}
          className="rounded-md bg-brand-indigo px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-indigo-hover"
        >
          {t(s.addLine, locale)}
        </button>
      </div>

      <div className="border-t border-slate-100 p-3">
        <button
          onClick={() => setShowTables((v) => !v)}
          className="text-xs font-medium text-slate-500 hover:text-brand-indigo"
        >
          {showTables ? "−" : "+"} {t(s.complexityTablesAdvanced, locale)}
        </button>
        {showTables && (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(["sessionComplexity", "setupComplexity"] as const).map((which) => (
              <div key={which}>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {which === "sessionComplexity" ? t(s.sessionComplexityOption, locale) : t(s.setupComplexityOption, locale)}
                </div>
                <div className="mt-1 space-y-1">
                  {Object.entries(workstream[which]).map(([level, entry]) => (
                    <div key={level} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-slate-600">{level}</span>
                      <input
                        type="number"
                        step="0.5"
                        value={entry.hours}
                        onChange={(e) => updateComplexityTable(which, level, Number(e.target.value))}
                        className="w-20 rounded border border-slate-300 px-1.5 py-0.5 text-right tabular-nums"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
