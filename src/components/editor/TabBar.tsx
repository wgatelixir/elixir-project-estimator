export interface TabDef {
  id: string;
  label: string;
  /** Small secondary text after the label, e.g. the tab's hours. */
  hint?: string;
}

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
    <div className="overflow-x-auto border-b border-slate-300">
      <div className="flex min-w-max gap-1">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? "page" : undefined}
              className={`-mb-px flex items-baseline gap-1.5 whitespace-nowrap rounded-t-md border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-brand-crimson bg-white text-brand-indigo shadow-sm"
                  : "border-transparent text-slate-600 hover:bg-white/60 hover:text-brand-indigo"
              }`}
            >
              {tab.label}
              {tab.hint && (
                <span className={`text-[11px] font-normal tabular-nums ${isActive ? "text-slate-500" : "text-slate-400"}`}>
                  {tab.hint}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
