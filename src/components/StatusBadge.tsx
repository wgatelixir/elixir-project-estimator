import type { EstimationStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: EstimationStatus }) {
  const isFinal = status === "FINAL";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        isFinal ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      {isFinal ? "Final" : "Draft"}
    </span>
  );
}
