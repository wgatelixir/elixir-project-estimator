"use client";

import { useState } from "react";
import type { ElixirSyncIntegrationState, ElixirSyncLineItem, ElixirSyncStream } from "@/lib/types";
import { elixirSyncStreamHours } from "@/lib/calculations";
import { formatCurrency, formatHours } from "@/lib/format";

function slugId() {
  return `es-${Math.random().toString(36).slice(2, 9)}`;
}

function StreamRow({
  stream,
  onChange,
}: {
  stream: ElixirSyncStream;
  onChange: (next: ElixirSyncStream) => void;
}) {
  const [open, setOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  function updateItem(id: string, patch: Partial<ElixirSyncLineItem>) {
    onChange({ ...stream, items: stream.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) });
  }

  function removeItem(id: string) {
    onChange({ ...stream, items: stream.items.filter((it) => it.id !== id) });
  }

  function addItem() {
    if (!newLabel.trim()) return;
    const item: ElixirSyncLineItem = {
      id: slugId(),
      label: newLabel.trim(),
      optimistic: 0,
      pessimistic: 0,
      realistic: 0,
    };
    onChange({ ...stream, items: [...stream.items, item] });
    setNewLabel("");
  }

  const hours = elixirSyncStreamHours(stream);

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <div className="flex items-center gap-3 px-4 py-3">
        <input
          type="checkbox"
          checked={stream.included}
          onChange={(e) => onChange({ ...stream, included: e.target.checked })}
          className="h-4 w-4 rounded border-slate-300 accent-brand-indigo"
        />
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center justify-between text-left text-sm"
        >
          <span className={stream.included ? "font-medium text-brand-ink" : "text-slate-500"}>
            {stream.label}
          </span>
          <span className="ml-3 flex items-center gap-2 text-slate-400">
            <span className="tabular-nums">{formatHours(hours)}</span>
            <span>{open ? "−" : "+"}</span>
          </span>
        </button>
      </div>

      {open && (
        <div className="bg-slate-50 px-4 py-3">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400">
              <tr>
                <th className="py-1 pr-2 font-medium">Task</th>
                <th className="py-1 px-2 text-right font-medium">Optimistic</th>
                <th className="py-1 px-2 text-right font-medium">Pessimistic</th>
                <th className="py-1 px-2 text-right font-medium">Realistic</th>
                <th className="w-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {stream.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-1 pr-2">
                    <input
                      value={item.label}
                      onChange={(e) => updateItem(item.id, { label: e.target.value })}
                      className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 hover:border-slate-200 focus:border-brand-indigo focus:outline-none"
                    />
                  </td>
                  {(["optimistic", "pessimistic", "realistic"] as const).map((field) => (
                    <td key={field} className="px-2 py-1 text-right">
                      <input
                        type="number"
                        step="0.25"
                        value={item[field]}
                        onChange={(e) => updateItem(item.id, { [field]: Number(e.target.value) })}
                        className="w-16 rounded border border-slate-200 px-1 py-0.5 text-right tabular-nums"
                      />
                    </td>
                  ))}
                  <td className="text-right">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-slate-300 hover:text-brand-crimson"
                    >
                      &times;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 flex gap-2">
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="New task…"
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs"
            />
            <button
              onClick={addItem}
              className="rounded bg-brand-indigo px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-brand-indigo-hover"
            >
              + Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ElixirSyncPanel({
  state,
  onChange,
  hourlyRate,
}: {
  state: ElixirSyncIntegrationState;
  onChange: (next: ElixirSyncIntegrationState) => void;
  hourlyRate: number;
}) {
  const includedHours = state.streams.reduce(
    (sum, s) => (s.included ? sum + elixirSyncStreamHours(s) : sum),
    0
  );

  function updateStream(id: string, next: ElixirSyncStream) {
    onChange({ ...state, streams: state.streams.map((s) => (s.id === id ? next : s)) });
  }

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
          Include ElixirSync integration
        </label>
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <label className="flex items-center gap-1.5">
            Hourly rate &euro;
            <input
              type="number"
              min={0}
              value={state.hourlyRate}
              onChange={(e) => onChange({ ...state, hourlyRate: Number(e.target.value) })}
              className="w-20 rounded border border-slate-300 px-1.5 py-1 text-right tabular-nums"
            />
          </label>
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
            {formatHours(includedHours)} &middot; {formatCurrency(includedHours * hourlyRate)}
          </span>
        </div>
      </div>

      <p className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
        Check the streams this project needs. Each stream&apos;s hours use the &quot;Realistic&quot;
        estimate; click a stream to see or edit its tasks.
      </p>

      <div>
        {state.streams.map((stream) => (
          <StreamRow key={stream.id} stream={stream} onChange={(next) => updateStream(stream.id, next)} />
        ))}
      </div>
    </div>
  );
}
