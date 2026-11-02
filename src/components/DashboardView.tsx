"use client";

import { useState } from "react";
import type { EstimationSummary } from "@/lib/types";
import { DashboardTable } from "@/components/DashboardTable";
import { PipelineBoard } from "@/components/PipelineBoard";
import { LayoutGrid, List, iconProps } from "@/components/ui/icons";

type ViewMode = "board" | "list";

/**
 * Switches the dashboard between the HubSpot-deals-style pipeline Board
 * (default - the stage-by-stage view of the whole portfolio) and the dense
 * List/table (for row actions, scanning owners, or exporting).
 */
export function DashboardView({ estimations, q }: { estimations: EstimationSummary[]; q?: string }) {
  const [view, setView] = useState<ViewMode>("board");

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 shadow-sm">
          <button
            onClick={() => setView("board")}
            className={`btn btn-sm ${view === "board" ? "btn-primary" : "btn-ghost"}`}
          >
            <LayoutGrid {...iconProps} />
            Board
          </button>
          <button
            onClick={() => setView("list")}
            className={`btn btn-sm ${view === "list" ? "btn-primary" : "btn-ghost"}`}
          >
            <List {...iconProps} />
            List
          </button>
        </div>
      </div>
      {view === "board" ? <PipelineBoard estimations={estimations} /> : <DashboardTable estimations={estimations} q={q} />}
    </div>
  );
}
