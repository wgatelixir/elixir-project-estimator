import { iconProps, type LucideIcon } from "@/components/ui/icons";

export interface TabDef {
  id: string;
  label: string;
  /** Small secondary text after the label, e.g. the tab's hours. */
  hint?: string;
  icon?: LucideIcon;
  /** Draws a divider before this tab, e.g. between the fixed tabs and the workstream tabs. */
  separatorBefore?: boolean;
}

/**
 * Flat, underlined tabs on a white strip (HubSpot-style): the active tab gets
 * indigo text and a crimson underline, the rest stay quiet grey until hovered.
 */
export function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white px-2 shadow-sm">
      <div className="flex min-w-max items-stretch" role="tablist">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          const Icon = tab.icon;
          return (
            <div key={tab.id} className="flex items-stretch">
              {tab.separatorBefore && <span aria-hidden className="mx-1.5 my-3 w-px bg-slate-200" />}
              <button
                onClick={() => onChange(tab.id)}
                role="tab"
                aria-selected={isActive}
                aria-current={isActive ? "page" : undefined}
                className={`group flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm transition-colors ${
                  isActive
                    ? "border-brand-crimson font-semibold text-brand-indigo"
                    : "border-transparent font-medium text-slate-600 hover:border-slate-300 hover:text-brand-indigo"
                }`}
              >
                {Icon && (
                  <Icon
                    {...iconProps}
                    className={isActive ? "text-brand-indigo" : "text-slate-400 group-hover:text-brand-indigo"}
                  />
                )}
                {tab.label}
                {tab.hint && (
                  <span
                    className={`rounded-full px-1.5 py-px text-[11px] font-medium tabular-nums ${
                      isActive ? "bg-brand-indigo/10 text-brand-indigo" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {tab.hint}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
