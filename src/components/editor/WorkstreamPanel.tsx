"use client";

import { useState } from "react";
import type { ComplexityTable, LineActivityType, StandardLineItem, StandardWorkstream } from "@/lib/types";
import { lineItemFinalEffort } from "@/lib/calculations";
import { formatCurrency, formatHours } from "@/lib/format";

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
}: {
  workstream: StandardWorkstream;
  onChange: (next: StandardWorkstream) => void;
}) {
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
    const item: StandardLineItem = {
      id: slugId(workstream.key),
      activity: newActivity,
      topic: newTopic.trim(),
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

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-900">
          <input
            type="checkbox"
            checked={workstream.enabled}
            onChange={(e) => onChange({ ...workstream, enabled: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300"
          />
          Include this workstream
        </label>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <label className="flex items-center gap-1.5">
            Hourly rate &euro;
            <input
              type="number"
              min={0}
              value={workstream.hourlyRate}
              onChange={(e) => onChange({ ...workstream, hourlyRate: Number(e.target.value) })}
              className="w-20 rounded border border-slate-300 px-1.5 py-1 text-right tabular-nums"
            />
          </label>
          <span className="font-medium text-slate-900">
            {formatHours(totalHours)} &middot; {formatCurrency(totalHours * workstream.hourlyRate)}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="w-8 px-3 py-2" />
              <th className="px-3 py-2 font-medium">Activity</th>
              <th className="px-3 py-2 font-medium">Topic</th>
              <th className="px-3 py-2 text-right font-medium">Standard</th>
              <th className="px-3 py-2 font-medium">Complexity</th>
              <th className="px-3 py-2 text-right font-medium">Final effort</th>
              <th className="w-8 px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {workstream.items.map((item) => (
              <tr key={item.id} className={item.enabled ? "" : "opacity-40"}>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(e) => updateItem(item.id, { enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                </td>
                <td className="px-3 py-2 text-slate-500">{item.activity}</td>
                <td className="px-3 py-2">
                  <input
                    value={item.topic}
                    onChange={(e) => updateItem(item.id, { topic: e.target.value })}
                    className="w-full rounded border border-transparent px-1.5 py-1 hover:border-slate-200 focus:border-slate-400 focus:outline-none"
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    step="0.5"
                    value={item.standardEffort}
                    onChange={(e) => updateItem(item.id, { standardEffort: Number(e.target.value) })}
                    className="w-16 rounded border border-transparent px-1.5 py-1 text-right tabular-nums hover:border-slate-200 focus:border-slate-400 focus:outline-none"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={item.complexity}
                    onChange={(e) => updateItem(item.id, { complexity: e.target.value })}
                    className="rounded border border-slate-200 px-1.5 py-1 text-sm"
                  >
                    {complexityOptionsFor(item, workstream).map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-right tabular-nums font-medium text-slate-900">
                  {formatHours(lineItemFinalEffort(item, workstream))}
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-slate-300 hover:text-red-600"
                    title="Remove line"
                  >
                    &times;
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
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
          <option value="Session">Session</option>
          <option value="Setup">Setup</option>
          <option value="Desk work">Desk work</option>
        </select>
        <input
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          placeholder="New line topic…"
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
          title="Which complexity table this line uses"
        >
          <option value="session">Session complexity</option>
          <option value="setup">Setup complexity</option>
        </select>
        <button
          onClick={addItem}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          + Add line
        </button>
      </div>

      <div className="border-t border-slate-100 p-3">
        <button
          onClick={() => setShowTables((v) => !v)}
          className="text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          {showTables ? "−" : "+"} Complexity tables (advanced)
        </button>
        {showTables && (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(["sessionComplexity", "setupComplexity"] as const).map((which) => (
              <div key={which}>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {which === "sessionComplexity" ? "Session complexity" : "Setup complexity"}
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
