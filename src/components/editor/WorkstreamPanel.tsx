"use client";

import { useState } from "react";
import type { ComplexityTable, LineActivityType, Locale, StandardLineItem, StandardWorkstream } from "@/lib/types";
import { lineItemFinalEffort } from "@/lib/calculations";
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

  function updateItem(id: string, patch: Partial<StandardLineItem>) {
    onChange({
      ...workstream,
      items: workstream.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    });
  }

  function removeItem(id: string) {
    onChange({ ...workstream, items: workstream.items.filter((it) => it.id !== id) });
  }

  function addItem() {
    if (!newTopic.trim()) return;
    const topicText = newTopic.trim();
    const item: StandardLineItem = {
      id: slugId(workstream.key),
      activity: newActivity,
      topic: { en: topicText, nl: topicText },
      standardEffort: newEffort,
      complexityTable: newTable,
      complexity: "Standard" in workstream.sessionComplexity ? "Standard" : Object.keys(workstream.sessionComplexity)[0],
      comment: null,
      enabled: true,
    };
    onChange({ ...workstream, items: [...workstream.items, item] });
    setNewTopic("");
    setNewEffort(4);
  }

  function updateComplexityTable(which: "sessionComplexity" | "setupComplexity", level: string, hours: number) {
    const table: ComplexityTable = { ...workstream[which] };
    table[level] = { ...table[level], hours };
    onChange({ ...workstream, [which]: table });
  }

  const totalHours = workstream.items.reduce(
    (sum, it) => (it.enabled ? sum + lineItemFinalEffort(it, workstream) : sum),
    0
  );
  const pmHours = totalHours * pmPercent;
  const pmPrice = pmHours * pmRate;

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <label className="flex items-center gap-2 text-sm font-medium text-brand-ink">
          <input
            type="checkbox"
            checked={workstream.enabled}
            onChange={(e) => onChange({ ...workstream, enabled: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 accent-brand-indigo"
          />
          {t(s.includeWorkstream, locale)}
        </label>
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

      <PanelLegend
        sessionHours={complexityHoursByBand(workstream.sessionComplexity)}
        setupHours={complexityHoursByBand(workstream.setupComplexity)}
        comments={complexityCommentsByBand(workstream.sessionComplexity)}
        locale={locale}
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="w-8 px-3 py-2" />
              <th className="px-3 py-2 font-medium">{t(s.columnActivity, locale)}</th>
              <th className="px-3 py-2 font-medium">{t(s.columnTopic, locale)}</th>
              <th className="px-3 py-2 text-right font-medium">{t(s.columnStandard, locale)}</th>
              <th className="px-3 py-2 font-medium">{t(s.columnComplexity, locale)}</th>
              <th className="px-3 py-2 text-right font-medium">{t(s.columnFinalEffort, locale)}</th>
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
                  className={`${activityStyle.rowBg} ${item.enabled ? "" : "opacity-40"}`}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(e) => updateItem(item.id, { enabled: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 accent-brand-indigo"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${activityStyle.badge}`}
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
            <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-brand-ink">
              <td className="px-3 py-2" colSpan={5}>
                {t(s.totalFinalEffort, locale)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{formatHours(totalHours, locale)}</td>
              <td className="px-3 py-2" />
            </tr>
            <tr className="bg-slate-50 text-brand-ink">
              <td className="px-3 py-2" colSpan={5}>
                {t(s.budget, locale)}
              </td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums">
                {formatCurrency(totalHours * workstream.hourlyRate, locale)}
              </td>
              <td className="px-3 py-2" />
            </tr>
            <tr className="bg-slate-50 text-slate-600">
              <td className="px-3 py-2" colSpan={5}>
                {t(s.projectManagement, locale)} ({formatPercent(pmPercent)})
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(pmPrice, locale)}</td>
              <td className="px-3 py-2" />
            </tr>
            <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-brand-ink">
              <td className="px-3 py-2" colSpan={5}>
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
            setNewTable(v === "Setup" ? "setup" : "session");
          }}
          className="rounded border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="Session">{t(s.activitySession, locale)}</option>
          <option value="Setup">{t(s.activitySetup, locale)}</option>
          <option value="Desk work">{t(s.activityDeskWork, locale)}</option>
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
