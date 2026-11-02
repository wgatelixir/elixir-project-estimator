"use client";

import { useRef, useState } from "react";
import type { EstimationSummary, OpportunityPhase } from "@/lib/types";
import { OPPORTUNITY_PHASES } from "@/lib/types";
import { OPPORTUNITY_PHASE_STYLES } from "@/lib/style";
import { formatCurrency, formatDate, formatHours } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { EstimationPreviewPanel } from "@/components/EstimationPreviewPanel";
import { Check, iconProps } from "@/components/ui/icons";

function initial(name: string | null) {
  return name?.trim().charAt(0).toUpperCase() || "?";
}

function PipelineCard({
  e,
  dragging,
  onDragStart,
  onDragEnd,
  onOpen,
}: {
  e: EstimationSummary;
  dragging: boolean;
  onDragStart: (ev: React.DragEvent) => void;
  onDragEnd: () => void;
  onOpen: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(ev) => {
        if (ev.key === "Enter" || ev.key === " ") onOpen();
      }}
      className={`cursor-pointer rounded-lg border bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
        dragging ? "opacity-40" : ""
      } ${e.closedWon ? "border-emerald-200 border-l-4 border-l-emerald-400" : "border-slate-200 hover:border-brand-indigo/30"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-brand-ink">{e.clientName}</div>
          <div className="truncate text-xs text-slate-500">{e.projectName || "—"}</div>
        </div>
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-indigo/10 text-[11px] font-semibold text-brand-indigo"
          title={e.ownerName ? `Owner: ${e.ownerName}` : "No owner set"}
        >
          {initial(e.ownerName)}
        </span>
      </div>

      {e.closedWon && (
        <span className="mt-2 inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
          <Check {...iconProps} size={11} />
          Closed Won{e.closedWonDeadline ? ` · ${formatDate(e.closedWonDeadline)}` : ""}
        </span>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <StatusBadge status={e.status} />
        <span className="text-xs text-slate-400">{formatHours(e.totalHours)}</span>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
        <span className="text-[11px] text-slate-400">{formatDate(e.updatedAt)}</span>
        <span className="text-sm font-bold text-brand-indigo">{formatCurrency(e.totalPrice)}</span>
      </div>
    </div>
  );
}

/**
 * HubSpot-deals-board-style pipeline: one column per opportunity phase (see
 * OPPORTUNITY_PHASES), each headed by its deal count and total price - the
 * same at-a-glance stage math HubSpot's own Deals board shows. Closed Won
 * estimations get a green accent regardless of which phase column they sit
 * in, since that flag is tracked independently of phase (see types.ts).
 *
 * Cards can be dragged to another column to change their opportunity phase
 * (optimistic update, reverted if the save fails) - this only ever touches
 * opportunityPhase, never closedWon, so dropping a card on "Closed won"
 * does not silently flip that separate flag. Clicking (without dragging)
 * opens a HubSpot-style quick-view panel instead of navigating away.
 */
export function PipelineBoard({ estimations }: { estimations: EstimationSummary[] }) {
  const [items, setItems] = useState(estimations);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverPhase, setDragOverPhase] = useState<OpportunityPhase | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  // A real drag-and-drop shouldn't also open the preview panel on drop.
  const suppressClickRef = useRef(false);

  // Resets local (optimistically-mutable) state when the server hands down a
  // new estimations array (e.g. a search, or a refresh after delete) -
  // adjusting state from a prop change during render, per React's own
  // pattern for this, rather than in an effect (avoids an extra render pass).
  const [syncedEstimations, setSyncedEstimations] = useState(estimations);
  if (estimations !== syncedEstimations) {
    setSyncedEstimations(estimations);
    setItems(estimations);
  }

  async function movePhase(id: string, phase: OpportunityPhase) {
    const current = items.find((e) => e.id === id);
    if (!current || current.opportunityPhase === phase) return;
    setItems((prev) => prev.map((e) => (e.id === id ? { ...e, opportunityPhase: phase } : e)));
    try {
      const res = await fetch(`/api/estimations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityPhase: phase }),
      });
      if (!res.ok) throw new Error("Failed to move estimation");
    } catch {
      setItems((prev) => prev.map((e) => (e.id === id ? { ...e, opportunityPhase: current.opportunityPhase } : e)));
      alert("Couldn't move this estimation to that phase - please try again.");
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white/60 px-4 py-16 text-center text-sm text-slate-400">
        No estimations yet — create the first one.
      </div>
    );
  }

  const byPhase = new Map<string, EstimationSummary[]>(OPPORTUNITY_PHASES.map((p) => [p, []]));
  for (const e of items) byPhase.get(e.opportunityPhase)?.push(e);
  const previewEstimation = items.find((e) => e.id === previewId) ?? null;

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {OPPORTUNITY_PHASES.map((phase) => {
          const style = OPPORTUNITY_PHASE_STYLES[phase];
          const columnItems = byPhase.get(phase) ?? [];
          const total = columnItems.reduce((sum, e) => sum + e.totalPrice, 0);
          const isDropTarget = dragOverPhase === phase;
          return (
            <div key={phase} className="flex w-72 shrink-0 flex-col">
              <div className="flex items-center justify-between gap-2 px-0.5 pb-2">
                <span className="flex items-center gap-1.5 truncate text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
                  {style.label.en}
                </span>
                <span className="shrink-0 text-[11px] text-slate-400">{columnItems.length}</span>
              </div>
              <div className="rounded-md border border-slate-200 bg-brand-mist px-2 py-1.5 text-xs font-semibold text-slate-600">
                {formatCurrency(total)}
              </div>
              <div
                onDragOver={(ev) => {
                  if (!dragId) return;
                  ev.preventDefault();
                  ev.dataTransfer.dropEffect = "move";
                  if (dragOverPhase !== phase) setDragOverPhase(phase);
                }}
                onDragLeave={() => setDragOverPhase((prev) => (prev === phase ? null : prev))}
                onDrop={(ev) => {
                  ev.preventDefault();
                  suppressClickRef.current = true;
                  if (dragId) void movePhase(dragId, phase);
                  setDragId(null);
                  setDragOverPhase(null);
                }}
                className={`mt-2 min-h-[90px] flex-1 space-y-2 overflow-y-auto rounded-md pr-0.5 pb-1 transition-colors ${
                  isDropTarget ? "bg-brand-indigo/5 ring-2 ring-inset ring-brand-indigo/40" : ""
                }`}
                style={{ maxHeight: "calc(100vh - 420px)" }}
              >
                {columnItems.length === 0 ? (
                  <div
                    className={`rounded-lg border border-dashed px-3 py-6 text-center text-[11px] ${
                      isDropTarget ? "border-brand-indigo/40 text-brand-indigo" : "border-slate-200 text-slate-300"
                    }`}
                  >
                    {isDropTarget ? "Drop here" : "No estimations"}
                  </div>
                ) : (
                  columnItems.map((e) => (
                    <PipelineCard
                      key={e.id}
                      e={e}
                      dragging={dragId === e.id}
                      onDragStart={(ev) => {
                        setDragId(e.id);
                        ev.dataTransfer.effectAllowed = "move";
                        ev.dataTransfer.setData("text/plain", e.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setDragOverPhase(null);
                      }}
                      onOpen={() => {
                        if (suppressClickRef.current) {
                          suppressClickRef.current = false;
                          return;
                        }
                        setPreviewId(e.id);
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      {previewEstimation && (
        <EstimationPreviewPanel estimation={previewEstimation} onClose={() => setPreviewId(null)} />
      )}
    </>
  );
}
