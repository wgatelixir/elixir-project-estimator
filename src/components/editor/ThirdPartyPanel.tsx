"use client";

import { useState } from "react";
import type { ThirdPartyActivityType, ThirdPartyIntegrationState, ThirdPartyLineItem } from "@/lib/types";
import { thirdPartyLineItemHours } from "@/lib/calculations";
import { formatCurrency, formatHours } from "@/lib/format";
import { ACTIVITY_STYLES, classifyActivity, classifyComplexity, COMPLEXITY_STYLES } from "@/lib/style";
import { DEFAULT_HOURLY_RATES } from "@/lib/templates";
import { PanelLegend } from "./Legend";
import { RateHint } from "./RateHint";

function slugId() {
  return `tp-${Math.random().toString(36).slice(2, 9)}`;
}

export function ThirdPartyPanel({
  state,
  onChange,
}: {
  state: ThirdPartyIntegrationState;
  onChange: (next: ThirdPartyIntegrationState) => void;
}) {
  const [newActivity, setNewActivity] = useState<ThirdPartyActivityType>("Setup");
  const [newTopic, setNewTopic] = useState("");
  const [newFrom, setNewFrom] = useState("");
  const [newTo, setNewTo] = useState("");

  function updateItem(id: string, patch: Partial<ThirdPartyLineItem>) {
    onChange({ ...state, items: state.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) });
  }

  function removeItem(id: string) {
    onChange({ ...state, items: state.items.filter((it) => it.id !== id) });
  }

  function addItem() {
    if (!newTopic.trim()) return;
    const table = newActivity === "Session" ? state.sessionComplexity : state.setupComplexity;
    const item: ThirdPartyLineItem = {
      id: slugId(),
      activity: newActivity,
      topic: newTopic.trim(),
      from: newFrom || null,
      to: newTo || null,
      complexity: Object.keys(table)[0] ?? "N/A",
      enabled: true,
    };
    onChange({ ...state, items: [...state.items, item] });
    setNewTopic("");
    setNewFrom("");
    setNewTo("");
  }

  const totalHours = state.items.reduce(
    (sum, it) => (it.enabled ? sum + thirdPartyLineItemHours(it, state) : sum),
    0
  );

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
          Include third party integration
        </label>
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <label className="flex items-center gap-1.5">
            Hourly rate &euro;
            <input
              type="number"
              min={0}
              value={state.hourlyRate}
              onChange={(e) => onChange({ ...state, hourlyRate: Number(e.target.value) })}
              className="w-20 rounded border border-slate-300 px-1.5 py-1 text-right tabular-nums focus:border-brand-indigo focus:outline-none focus:ring-1 focus:ring-brand-indigo"
            />
          </label>
          <RateHint rate={state.hourlyRate} defaultRate={DEFAULT_HOURLY_RATES.third_party_integration} />
          <label className="flex items-center gap-1.5">
            Subscription qty
            <input
              type="number"
              min={0}
              value={state.subscriptionQty}
              onChange={(e) => onChange({ ...state, subscriptionQty: Number(e.target.value) })}
              className="w-16 rounded border border-slate-300 px-1.5 py-1 text-right tabular-nums"
            />
          </label>
          <label className="flex items-center gap-1.5">
            Unit price &euro;
            <input
              type="number"
              min={0}
              value={state.subscriptionUnitPrice}
              onChange={(e) => onChange({ ...state, subscriptionUnitPrice: Number(e.target.value) })}
              className="w-20 rounded border border-slate-300 px-1.5 py-1 text-right tabular-nums"
            />
          </label>
          <span className="font-medium text-brand-ink">
            {formatHours(totalHours)} &middot; {formatCurrency(totalHours * state.hourlyRate)}
          </span>
        </div>
      </div>

      <PanelLegend />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="w-8 px-3 py-2" />
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Activity</th>
              <th className="px-3 py-2 font-medium">From</th>
              <th className="px-3 py-2 font-medium">To</th>
              <th className="px-3 py-2 font-medium">Complexity</th>
              <th className="px-3 py-2 text-right font-medium">Hours</th>
              <th className="w-8 px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {state.items.map((item) => {
              const table = item.activity === "Session" ? state.sessionComplexity : state.setupComplexity;
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
                      {item.activity}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={item.topic}
                      onChange={(e) => updateItem(item.id, { topic: e.target.value })}
                      className="w-full rounded border border-transparent px-1.5 py-1 hover:border-slate-200 focus:border-brand-indigo focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={item.from ?? ""}
                      onChange={(e) => updateItem(item.id, { from: e.target.value })}
                      className="w-24 rounded border border-transparent px-1.5 py-1 hover:border-slate-200 focus:border-brand-indigo focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={item.to ?? ""}
                      onChange={(e) => updateItem(item.id, { to: e.target.value })}
                      className="w-24 rounded border border-transparent px-1.5 py-1 hover:border-slate-200 focus:border-brand-indigo focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={item.complexity}
                      onChange={(e) => updateItem(item.id, { complexity: e.target.value })}
                      className={`rounded border px-1.5 py-1 text-sm font-medium ${complexityStyle.select}`}
                    >
                      {Object.keys(table).map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium text-brand-ink">
                    {formatHours(thirdPartyLineItemHours(item, state))}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-slate-300 hover:text-brand-crimson"
                    >
                      &times;
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-end gap-2 border-t border-slate-100 p-3">
        <select
          value={newActivity}
          onChange={(e) => setNewActivity(e.target.value as ThirdPartyActivityType)}
          className="rounded border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="Setup">Setup</option>
          <option value="Session">Session</option>
        </select>
        <input
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          placeholder="Topic (e.g. Custom Object)"
          className="min-w-[160px] flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
        <input
          value={newFrom}
          onChange={(e) => setNewFrom(e.target.value)}
          placeholder="From"
          className="w-24 rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
        <input
          value={newTo}
          onChange={(e) => setNewTo(e.target.value)}
          placeholder="To"
          className="w-24 rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
        <button
          onClick={addItem}
          className="rounded-md bg-brand-indigo px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-indigo-hover"
        >
          + Add line
        </button>
      </div>
    </div>
  );
}
