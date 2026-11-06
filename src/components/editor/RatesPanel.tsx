"use client";

import type {
  ElixirSyncIntegrationState,
  EstimationState,
  Locale,
  StandardWorkstream,
  ThirdPartyIntegrationState,
} from "@/lib/types";
import { DEFAULT_HOURLY_RATES } from "@/lib/templates";
import { t, UI_STRINGS } from "@/lib/i18n";
import { FOUNDATION_KEYS, HUB_KEYS } from "@/lib/workstreamGroups";
import { isCustomWorkstream } from "@/lib/customWorkstreams";
import { GroupCard } from "./GroupCard";
import { RatesCard } from "./RatesCard";
import { RateHint } from "./RateHint";

function RateRow({
  label,
  rate,
  defaultRate,
  locale,
  onChange,
}: {
  label: string;
  rate: number;
  defaultRate: number;
  locale: Locale;
  onChange: (rate: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md px-3 py-2.5 hover:bg-slate-50">
      <span className="truncate text-sm font-medium text-brand-ink" title={label}>
        {label}
      </span>
      <span className="flex flex-shrink-0 items-center gap-2 text-xs">
        <span className="flex items-center gap-1">
          &euro;
          <input
            type="number"
            min={0}
            value={rate}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-20 rounded border border-slate-300 bg-white px-1.5 py-1 text-right tabular-nums focus:border-brand-indigo focus:outline-none"
          />
          /h
        </span>
        <RateHint rate={rate} defaultRate={defaultRate} locale={locale} />
      </span>
    </div>
  );
}

/**
 * Every hourly rate in this estimation, in one place: PM and the bulk
 * service rate (via RatesCard), then each workstream's and integration's
 * own rate - the same numbers Cover and each workstream tab already edit,
 * just without the scope/phase/stage columns that belong to those.
 */
export function RatesPanel({
  data,
  onChangeWorkstream,
  onChangeThirdParty,
  onChangeElixirSync,
  onChangePm,
  onApplyServiceRate,
  locale,
}: {
  data: EstimationState;
  onChangeWorkstream: (key: string, next: StandardWorkstream) => void;
  onChangeThirdParty: (next: ThirdPartyIntegrationState) => void;
  onChangeElixirSync: (next: ElixirSyncIntegrationState) => void;
  onChangePm: (next: Partial<Pick<EstimationState, "pmRate" | "pmPercent">>) => void;
  onApplyServiceRate: (rate: number) => void;
  locale: Locale;
}) {
  const s = UI_STRINGS.coverPage;
  const byKey = (key: string) => data.standardWorkstreams.find((ws) => ws.key === key);
  const foundation = FOUNDATION_KEYS.map(byKey).filter((ws): ws is StandardWorkstream => !!ws);
  const hubs = HUB_KEYS.map(byKey).filter((ws): ws is StandardWorkstream => !!ws);
  const customs = data.standardWorkstreams.filter(isCustomWorkstream);

  return (
    <div className="space-y-4">
      <RatesCard
        pmRate={data.pmRate}
        pmPercent={data.pmPercent}
        serviceRate={data.serviceRate}
        locale={locale}
        onChangePmRate={(pmRate) => onChangePm({ pmRate })}
        onChangePmPercent={(pmPercent) => onChangePm({ pmPercent })}
        onChangeServiceRate={onApplyServiceRate}
      />

      <GroupCard title={t(s.foundationTitle, locale)}>
        <div className="divide-y divide-slate-100 p-1.5">
          {foundation.map((ws) => (
            <RateRow
              key={ws.key}
              label={t(ws.label, locale)}
              rate={ws.hourlyRate}
              defaultRate={DEFAULT_HOURLY_RATES[ws.key] ?? ws.hourlyRate}
              locale={locale}
              onChange={(hourlyRate) => onChangeWorkstream(ws.key, { ...ws, hourlyRate })}
            />
          ))}
        </div>
      </GroupCard>

      <GroupCard title={t(s.hubsTitle, locale)}>
        <div className="divide-y divide-slate-100 p-1.5">
          {hubs.map((ws) => (
            <RateRow
              key={ws.key}
              label={t(ws.label, locale)}
              rate={ws.hourlyRate}
              defaultRate={DEFAULT_HOURLY_RATES[ws.key] ?? ws.hourlyRate}
              locale={locale}
              onChange={(hourlyRate) => onChangeWorkstream(ws.key, { ...ws, hourlyRate })}
            />
          ))}
        </div>
      </GroupCard>

      {customs.length > 0 && (
        <GroupCard title={t(s.customTitle, locale)}>
          <div className="divide-y divide-slate-100 p-1.5">
            {customs.map((ws) => (
              <RateRow
                key={ws.key}
                label={t(ws.label, locale)}
                rate={ws.hourlyRate}
                defaultRate={DEFAULT_HOURLY_RATES[ws.key] ?? ws.hourlyRate}
                locale={locale}
                onChange={(hourlyRate) => onChangeWorkstream(ws.key, { ...ws, hourlyRate })}
              />
            ))}
          </div>
        </GroupCard>
      )}

      <GroupCard title={t(s.integrationsTitle, locale)}>
        <div className="divide-y divide-slate-100 p-1.5">
          <RateRow
            label={t(UI_STRINGS.editor.tabElixirSync, locale)}
            rate={data.elixirSyncIntegration.hourlyRate}
            defaultRate={DEFAULT_HOURLY_RATES.elixirsync_integration}
            locale={locale}
            onChange={(hourlyRate) => onChangeElixirSync({ ...data.elixirSyncIntegration, hourlyRate })}
          />
          <RateRow
            label={t(UI_STRINGS.editor.tabThirdParty, locale)}
            rate={data.thirdPartyIntegration.hourlyRate}
            defaultRate={DEFAULT_HOURLY_RATES.third_party_integration}
            locale={locale}
            onChange={(hourlyRate) => onChangeThirdParty({ ...data.thirdPartyIntegration, hourlyRate })}
          />
        </div>
      </GroupCard>
    </div>
  );
}
