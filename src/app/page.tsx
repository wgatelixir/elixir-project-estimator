import { prisma } from "@/lib/prisma";
import { toSummary } from "@/lib/serialize";
import { formatCurrency, formatDate, formatHours } from "@/lib/format";
import { NewEstimationButton } from "@/components/NewEstimationButton";
import { EstimationRowActions } from "@/components/EstimationRowActions";
import { SearchBox } from "@/components/SearchBox";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const rows = await prisma.estimation.findMany({
    where: q
      ? {
          OR: [
            { clientName: { contains: q, mode: "insensitive" } },
            { projectName: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
  });
  const estimations = rows.map(toSummary);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Estimations</h1>
          <p className="mt-1 text-sm text-slate-500">
            Every saved project estimation, kept as a snapshot you can reopen, duplicate for a
            new version, or pull numbers from for a proposal.
          </p>
        </div>
        <NewEstimationButton />
      </div>

      <div className="mt-6">
        <SearchBox defaultValue={q ?? ""} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Client / Project</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 text-right font-medium">Hours</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Last updated</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {estimations.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  {q ? "No estimations match your search." : "No estimations yet — create the first one."}
                </td>
              </tr>
            )}
            {estimations.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <a href={`/estimations/${e.id}`} className="font-medium text-slate-900 hover:underline">
                    {e.clientName}
                  </a>
                  {e.projectName && <div className="text-xs text-slate-500">{e.projectName}</div>}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={e.status} />
                </td>
                <td className="px-4 py-3 text-slate-600">{e.ownerName || "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                  {formatHours(e.totalHours)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">
                  {formatCurrency(e.totalPrice)}
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDate(e.updatedAt)}</td>
                <td className="px-4 py-3">
                  <EstimationRowActions id={e.id} clientName={e.clientName} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
