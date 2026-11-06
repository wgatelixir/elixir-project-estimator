import { iconProps, type LucideIcon } from "@/components/ui/icons";

export interface NavItem {
  id: string;
  label: string;
  /** Small secondary text after the label, e.g. the item's hours. */
  hint?: string;
  icon?: LucideIcon;
  /** Present for a toggleable item (a workstream or integration): renders a checkbox before the label. */
  enabled?: boolean;
  onToggle?: () => void;
}

export interface NavGroup {
  id: string;
  /** Omit for the top, ungrouped section (Cover, Overview, ...). */
  title?: string;
  items: NavItem[];
}

/**
 * Vertical, grouped navigation for the editor (Cover/Overview plus every
 * workstream), replacing the old horizontal TabBar. Every workstream and
 * integration always has a row here, whether it's in scope or not - its
 * checkbox includes/excludes it without leaving the tab you're on, the row
 * itself navigates to it either way.
 */
export function EditorNav({
  groups,
  active,
  onChange,
}: {
  groups: NavGroup[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <nav
      aria-label="Estimation sections"
      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-2 shadow-sm lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto"
    >
      {groups.map((group, i) => (
        <div key={group.id} className={`flex flex-col gap-0.5 ${i > 0 ? "border-t border-slate-100 pt-3" : ""}`}>
          {group.title && (
            <div className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-brand-indigo/70">
              {group.title}
            </div>
          )}
          {group.items.map((item) => {
            const isActive = active === item.id;
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => onChange(item.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onChange(item.id);
                  }
                }}
                aria-current={isActive ? "page" : undefined}
                className={`group flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-brand-indigo/10 font-semibold text-brand-indigo"
                    : "font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-indigo"
                } ${item.enabled === false ? "opacity-60" : ""}`}
              >
                {item.onToggle && (
                  <input
                    type="checkbox"
                    checked={item.enabled ?? false}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => item.onToggle?.()}
                    title="Include in this estimation"
                    className="h-3.5 w-3.5 flex-shrink-0 rounded border-slate-300 accent-brand-indigo"
                  />
                )}
                {Icon && (
                  <Icon
                    {...iconProps}
                    className={`flex-shrink-0 ${isActive ? "text-brand-indigo" : "text-slate-400 group-hover:text-brand-indigo"}`}
                  />
                )}
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.hint && (
                  <span
                    className={`flex-shrink-0 rounded-full px-1.5 py-px text-[11px] font-medium tabular-nums ${
                      isActive ? "bg-brand-indigo/10 text-brand-indigo" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.hint}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
