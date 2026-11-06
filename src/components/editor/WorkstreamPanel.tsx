"use client";

import { ChevronRight, GripVertical, Link2, X, Plus, iconProps } from "@/components/ui/icons";
import { useState } from "react";
import type { ComplexityTable, LineActivityType, Locale, ProjectPhase, StandardLineItem, StandardWorkstream } from "@/lib/types";
import { lineItemFinalEffort, lineItemPrice, pmBaseHours, resolvePhase, workstreamMonths } from "@/lib/calculations";
import { formatCurrency, formatHours, formatPercent } from "@/lib/format";
import {
  ACTIVITY_LEGEND,
  ACTIVITY_STYLES,
  CUSTOM_ACTIVITY_LEGEND,
  classifyActivity,
  classifyComplexity,
  complexityCommentsByBand,
  complexityHoursByBand,
  COMPLEXITY_STYLES,
} from "@/lib/style";
import { DEFAULT_HOURLY_RATES } from "@/lib/templates";
import { t, UI_STRINGS } from "@/lib/i18n";
import { removeLine, setLineComplexity, setLineEnabled } from "@/lib/lineLinks";
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
 * linked row) get a compact picker to change or remove their session link. The
 * "N linked" badge is dropped once a session already shows that in its own
 * tab row (see LineItemGroup) - no point saying it twice.
 */
function LineLink({
  item,
  workstream,
  locale,
  onChange,
  hideSessionBadge = false,
}: {
  item: StandardLineItem;
  workstream: StandardWorkstream;
  locale: Locale;
  onChange: (linkedTo: string | null) => void;
  hideSessionBadge?: boolean;
}) {
  const s = UI_STRINGS.workstreamPanel;
  if (item.activity === "Session") {
    if (hideSessionBadge) return null;
    const count = workstream.items.filter((it) => it.linkedTo === item.id).length;
    if (count === 0) return null;
    return (
      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-sky-700" title={t(s.linkedSessionTitle, locale)}>
        <Link2 {...iconProps} size={12} /> {count} {t(s.linkedCount, locale)}
      </p>
    );
  }
  if (item.activity !== "Session Prep" && !item.linkedTo) return null;
  const sessions = workstream.items.filter((it) => it.activity === "Session");
  return (
    <label className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500" title={t(s.linkTitle, locale)}>
      <Link2 {...iconProps} size={12} />
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

/**
 * Per-line delivery phase, overriding the workstream's own - so one session
 * can be planned for phase 1 while another in the same workstream waits for
 * phase 2. Left on "Default" it just follows the workstream's phase.
 */
function LinePhaseSelect({
  phase,
  workstreamPhase,
  locale,
  onChange,
}: {
  phase: ProjectPhase | null | undefined;
  workstreamPhase: ProjectPhase | null;
  locale: Locale;
  onChange: (phase: ProjectPhase | null | undefined) => void;
}) {
  const s = UI_STRINGS.workstreamPanel;
  const cp = UI_STRINGS.coverPage;
  const defaultLabel = `${t(s.linePhaseDefault, locale)} (${
    workstreamPhase === null ? t(cp.phaseNotApplicable, locale) : `${t(cp.columnPhase, locale)} ${workstreamPhase}`
  })`;
  const value = phase === undefined ? "default" : phase === null ? "na" : String(phase);
  return (
    <select
      value={value}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === "default" ? undefined : v === "na" ? null : (Number(v) as ProjectPhase));
      }}
      title={t(s.linePhaseTitle, locale)}
      className={`-ml-[7px] mt-0.5 max-w-[180px] truncate rounded border border-transparent bg-transparent py-0 pl-0.5 pr-5 text-[11px] hover:border-slate-200 focus:border-brand-indigo focus:outline-none ${
        phase !== undefined ? "text-brand-indigo" : "text-slate-400"
      }`}
    >
      <option value="default">{defaultLabel}</option>
      <option value="1">{t(cp.columnPhase, locale)} 1</option>
      <option value="2">{t(cp.columnPhase, locale)} 2</option>
      <option value="3">{t(cp.columnPhase, locale)} 3</option>
      <option value="na">{t(cp.phaseNotApplicable, locale)}</option>
    </select>
  );
}

/**
 * A session and the line(s) linked to it (its write-up/prep) as one card,
 * switched between with a small tab row - so a session's content and its
 * prep's content are both one click away instead of two separate cards
 * apart elsewhere in the list. A session with nothing linked to it (or any
 * other standalone line) just renders itself, no tabs.
 */
function LineItemGroup({
  main,
  childItems,
  workstream,
  isCustom,
  locale,
  dragId,
  dropTarget,
  setDragId,
  setDropTarget,
  moveGroup,
  endDrag,
  onChange,
  updateItem,
  removeItem,
}: {
  main: StandardLineItem;
  childItems: StandardLineItem[];
  workstream: StandardWorkstream;
  isCustom: boolean;
  locale: Locale;
  dragId: string | null;
  dropTarget: { id: string; after: boolean } | null;
  setDragId: (id: string | null) => void;
  setDropTarget: (target: { id: string; after: boolean } | null) => void;
  moveGroup: (fromMainId: string, toMainId: string, after: boolean) => void;
  endDrag: () => void;
  onChange: (next: StandardWorkstream) => void;
  updateItem: (id: string, patch: Partial<StandardLineItem>) => void;
  removeItem: (id: string) => void;
}) {
  const s = UI_STRINGS.workstreamPanel;
  const groupId = main.id;
  const tabs = childItems.length > 0 ? [main, ...childItems] : [main];
  const [activeId, setActiveId] = useState(groupId);
  const active = tabs.find((it) => it.id === activeId) ?? main;
  const activityStyle = ACTIVITY_STYLES[classifyActivity(active.activity)];
  const complexityStyle = COMPLEXITY_STYLES[classifyComplexity(active.complexity)];

  return (
    <div
      data-line-card
      onDragOver={(e) => {
        if (!dragId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        const rect = e.currentTarget.getBoundingClientRect();
        const after = e.clientY > rect.top + rect.height / 2;
        if (dropTarget?.id !== groupId || dropTarget.after !== after) setDropTarget({ id: groupId, after });
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (dragId && dropTarget) moveGroup(dragId, dropTarget.id, dropTarget.after);
        endDrag();
      }}
      className={`rounded-lg border p-3 transition-opacity ${activityStyle.rowBg} ${
        active.enabled ? "border-slate-200" : "border-slate-100 opacity-40"
      } ${dragId === groupId ? "opacity-30" : ""} ${
        dropTarget?.id === groupId && dragId !== groupId
          ? dropTarget.after
            ? "shadow-[inset_0_-2px_0_0_var(--color-brand-indigo)]"
            : "shadow-[inset_0_2px_0_0_var(--color-brand-indigo)]"
          : ""
      }`}
    >
      {tabs.length > 1 && (
        <div className="mb-2 inline-flex gap-0.5 rounded-full bg-slate-100 p-0.5">
          {tabs.map((it) => {
            const tabStyle = ACTIVITY_STYLES[classifyActivity(it.activity)];
            const isActive = it.id === active.id;
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => setActiveId(it.id)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                  isActive ? "bg-white text-brand-indigo shadow-sm" : "text-slate-500 hover:text-brand-indigo"
                }`}
              >
                {t(tabStyle.label, locale)}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-start gap-2">
        {/* Only the handle is draggable, so text in the card's inputs stays selectable. */}
        <span
          draggable
          onDragStart={(e) => {
            setDragId(groupId);
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", groupId);
            const card = e.currentTarget.closest("[data-line-card]");
            if (card) e.dataTransfer.setDragImage(card, 16, 16);
          }}
          onDragEnd={endDrag}
          title={t(s.dragToReorder, locale)}
          className="mt-1 cursor-grab select-none text-slate-300 hover:text-slate-500 active:cursor-grabbing"
        >
          <GripVertical {...iconProps} />
        </span>
        <input
          type="checkbox"
          checked={active.enabled}
          onChange={(e) => onChange(setLineEnabled(workstream, active.id, e.target.checked))}
          className="mt-1.5 h-4 w-4 flex-shrink-0 rounded border-slate-300 accent-brand-indigo"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium ${activityStyle.badge}`}
            >
              {t(activityStyle.label, locale)}
            </span>
            <input
              value={active.topic[locale]}
              onChange={(e) => updateItem(active.id, { topic: { ...active.topic, [locale]: e.target.value } })}
              className="min-w-[160px] flex-1 rounded border border-transparent px-1.5 py-0.5 text-sm font-medium text-brand-ink hover:border-slate-200 focus:border-brand-indigo focus:outline-none"
            />
          </div>
          <LineItemNote comment={active.comment} locale={locale} />
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <LineLink
              item={active}
              workstream={workstream}
              locale={locale}
              onChange={(linkedTo) => updateItem(active.id, { linkedTo })}
              hideSessionBadge={tabs.length > 1}
            />
            <LinePhaseSelect
              phase={active.phase}
              workstreamPhase={resolvePhase(workstream.phase)}
              locale={locale}
              onChange={(phase) => updateItem(active.id, { phase })}
            />
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-sm font-semibold tabular-nums text-brand-ink">
            {formatHours(lineItemFinalEffort(active, workstream), locale)}
          </div>
          {isCustom && (
            <div className="text-xs tabular-nums text-slate-500">
              {formatCurrency(lineItemPrice(active, workstream), locale)}
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-slate-200/70 pt-2 text-xs text-slate-500">
        {isCustom ? (
          <label className="flex items-center gap-1.5" title={t(s.lineRateTitle, locale)}>
            {t(s.columnRate, locale)}
            {/* Empty = the workstream's rate (shown as placeholder); a value overrides it for this line. */}
            <input
              type="number"
              min={0}
              value={active.hourlyRate ?? ""}
              placeholder={String(workstream.hourlyRate)}
              onChange={(e) => updateItem(active.id, { hourlyRate: e.target.value === "" ? null : Number(e.target.value) })}
              className="w-20 rounded border border-slate-200 bg-white px-1.5 py-1 text-right tabular-nums text-slate-700 placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-indigo focus:outline-none"
            />
          </label>
        ) : (
          <label className="flex items-center gap-1.5" title={t(s.durationTitle, locale)}>
            {t(s.columnDuration, locale)}
            <input
              type="number"
              step="0.5"
              min={0}
              value={active.duration ?? ""}
              onChange={(e) => updateItem(active.id, { duration: e.target.value === "" ? null : Number(e.target.value) })}
              className="w-14 rounded border border-transparent bg-white px-1.5 py-1 text-right tabular-nums text-slate-700 hover:border-slate-200 focus:border-brand-indigo focus:outline-none"
            />
          </label>
        )}
        <label className="flex items-center gap-1.5">
          {t(isCustom ? s.columnHours : s.columnStandard, locale)}
          <input
            type="number"
            step="0.5"
            value={active.standardEffort}
            onChange={(e) => updateItem(active.id, { standardEffort: Number(e.target.value) })}
            className="w-16 rounded border border-transparent bg-white px-1.5 py-1 text-right tabular-nums text-slate-700 hover:border-slate-200 focus:border-brand-indigo focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-1.5">
          {t(s.columnComplexity, locale)}
          <select
            value={active.complexity}
            onChange={(e) => onChange(setLineComplexity(workstream, active.id, e.target.value))}
            className={`rounded border px-1.5 py-1 text-xs font-medium ${complexityStyle.select}`}
          >
            {complexityOptionsFor(active, workstream).map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={() => removeItem(active.id)}
          className="ml-auto rounded p-1 text-slate-300 hover:bg-brand-crimson/5 hover:text-brand-crimson"
          title={t(s.removeLine, locale)}
        >
          <X {...iconProps} />
        </button>
      </div>
    </div>
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
  const isCustom = Boolean(workstream.custom);
  const [newActivity, setNewActivity] = useState<LineActivityType>(isCustom ? "Consulting" : "Session");
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

  // A session and its linked line(s) move together as one block, so dragging
  // a session's card can't leave its prep behind (or vice versa).
  function groupMemberIds(mainId: string): string[] {
    return [mainId, ...workstream.items.filter((it) => it.linkedTo === mainId).map((it) => it.id)];
  }

  function moveGroup(fromMainId: string, toMainId: string, after: boolean) {
    if (fromMainId === toMainId) return;
    const movingIds = new Set(groupMemberIds(fromMainId));
    const moving = workstream.items.filter((it) => movingIds.has(it.id));
    const remaining = workstream.items.filter((it) => !movingIds.has(it.id));
    const targetIndex = remaining.findIndex((it) => it.id === toMainId);
    if (targetIndex < 0) return;
    remaining.splice(after ? targetIndex + 1 : targetIndex, 0, ...moving);
    onChange({ ...workstream, items: remaining });
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
      // A project management line starts at the PM rate (still editable per line).
      ...(newActivity === "Project Management" ? { hourlyRate: pmRate } : {}),
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
  // Lines can carry their own rate (client-specific workstreams), so price is summed per line.
  const monthlyPrice = workstream.items.reduce((sum, it) => (it.enabled ? sum + lineItemPrice(it, workstream) : sum), 0);
  const months = workstreamMonths(workstream);
  const isRetainer = Boolean(workstream.custom?.retainerMonths);
  const totalHours = monthlyHours * months;
  const totalPrice = monthlyPrice * months;
  const pmHours = pmBaseHours(workstream) * months * pmPercent;
  const pmPrice = pmHours * pmRate;

  // Groups each session with whatever's linked to it (its prep/write-up), so
  // they render as one card with a tab between them - see LineItemGroup.
  // Everything else (including an orphaned link whose session no longer
  // exists) renders as its own standalone group.
  const mainIds = new Set(workstream.items.map((it) => it.id));
  const childrenByMain = new Map<string, StandardLineItem[]>();
  for (const it of workstream.items) {
    if (it.linkedTo && mainIds.has(it.linkedTo)) {
      childrenByMain.set(it.linkedTo, [...(childrenByMain.get(it.linkedTo) ?? []), it]);
    }
  }
  const lineGroups = workstream.items
    .filter((it) => !(it.linkedTo && mainIds.has(it.linkedTo)))
    .map((main) => ({ main, childItems: childrenByMain.get(main.id) ?? [] }));

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <div className="min-w-0">
          {workstream.custom ? (
            <input
              value={workstream.label[locale]}
              onChange={(e) => onChange({ ...workstream, label: { en: e.target.value, nl: e.target.value } })}
              aria-label={t(s.workstreamName, locale)}
              className="-ml-1.5 w-full rounded border border-transparent px-1.5 py-0.5 text-base font-bold text-brand-indigo hover:border-slate-200 focus:border-brand-indigo focus:outline-none"
            />
          ) : (
            <h2 className="truncate text-base font-bold text-brand-indigo">{t(workstream.label, locale)}</h2>
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
            {formatHours(totalHours, locale)} &middot; {formatCurrency(totalPrice, locale)}
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
        activityBands={isCustom ? CUSTOM_ACTIVITY_LEGEND : ACTIVITY_LEGEND}
        showComplexity={false}
        locale={locale}
      />

      <div className="space-y-2 p-3">
        {lineGroups.map(({ main, childItems }) => (
          <LineItemGroup
            key={main.id}
            main={main}
            childItems={childItems}
            workstream={workstream}
            isCustom={isCustom}
            locale={locale}
            dragId={dragId}
            dropTarget={dropTarget}
            setDragId={setDragId}
            setDropTarget={setDropTarget}
            moveGroup={moveGroup}
            endDrag={endDrag}
            onChange={onChange}
            updateItem={updateItem}
            removeItem={removeItem}
          />
        ))}
      </div>

      <div className="space-y-1 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        {isRetainer && (
          <div className="flex items-center justify-between gap-3 text-violet-700">
            <span>
              {t(s.perMonth, locale)} &middot; {formatHours(monthlyHours, locale)}
            </span>
            <span className="font-semibold tabular-nums">{formatCurrency(monthlyPrice, locale)}</span>
          </div>
        )}
        <div className="flex items-center justify-between gap-3 font-semibold text-brand-ink">
          <span>{isRetainer ? `${t(s.totalOverMonths, locale)} ${months} ${t(s.months, locale)}` : t(s.totalFinalEffort, locale)}</span>
          <span className="tabular-nums">{formatHours(totalHours, locale)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-brand-ink">
          <span>{t(s.budget, locale)}</span>
          <span className="font-semibold tabular-nums">{formatCurrency(totalPrice, locale)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-slate-600">
          <span>
            {t(s.projectManagement, locale)} ({formatPercent(pmPercent)} &middot; {formatHours(pmHours, locale)})
          </span>
          <span className="tabular-nums">{formatCurrency(pmPrice, locale)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-1.5 font-semibold text-brand-ink">
          <span>{t(s.total, locale)}</span>
          <span className="tabular-nums">{formatCurrency(totalPrice + pmPrice, locale)}</span>
        </div>
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
          {isCustom && (
            <>
              <option value="Consulting">{t(s.activityConsulting, locale)}</option>
              <option value="Development">{t(s.activityDevelopment, locale)}</option>
              <option value="Support">{t(s.activitySupport, locale)}</option>
              <option value="Project Management">{t(s.activityProjectManagement, locale)}</option>
            </>
          )}
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
          className="btn btn-primary"
        >
          <Plus {...iconProps} />
          {t(s.addLine, locale)}
        </button>
      </div>

      <div className="border-t border-slate-100 p-3">
        <button
          onClick={() => setShowTables((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-brand-indigo"
        >
          <ChevronRight {...iconProps} size={14} className={`transition-transform ${showTables ? "rotate-90" : ""}`} />
          {t(s.complexityTablesAdvanced, locale)}
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
