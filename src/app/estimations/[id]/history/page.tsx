import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime, formatHours } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { OpportunityPhaseBadge } from "@/components/OpportunityPhaseBadge";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EstimationHistoryPage({ params }: PageProps) {
  const { id } = await params;

  const estimation = await prisma.estimation.findUnique({ where: { id } });
  if (!estimation) notFound();

  const versions = await prisma.estimationVersion.findMany({
    where: { estimationId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      clientName: true,
      status: true,
      opportunityPhase: true,
      totalHours: true,
      totalPrice: true,
      note: true,
      createdAt: true,
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1">
        <Link
          href={`/estimations/${id}`}
          className="w-fit text-xs text-slate-400 transition-colors hover:text-brand-crimson"
        >
          ← Back to estimation
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-ink">Version history</h1>
        <p className="mt-1 text-sm text-slate-500">
          {estimation.clientName}
          {estimation.projectName ? ` · ${estimation.projectName}` : ""} — every saved snapshot, oldest to
          newest below. Click one to view it read-only, or restore it as the current version.
        </p>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Saved at</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Opportunity phase</th>
              <th className="px-4 py-3 text-right font-medium">Hours</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Note</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {versions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  No versions saved yet.
                </td>
              </tr>
            )}
            {versions.map((v, i) => (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <a
                    href={`/estimations/${id}/history/${v.id}`}
                    className="font-medium text-brand-ink transition-colors hover:text-brand-crimson hover:underline"
                  >
                    {formatDateTime(v.createdAt.toISOString())}
                  </a>
                  {i === 0 && (
                    <span className="ml-2 inline-flex items-center rounded bg-brand-indigo/10 px-1.5 py-0.5 text-[11px] font-medium text-brand-indigo">
                      Current
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={v.status} />
                </td>
                <td className="px-4 py-3">
                  <OpportunityPhaseBadge phase={v.opportunityPhase} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatHours(v.totalHours)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-brand-ink">
                  {formatCurrency(v.totalPrice)}
                </td>
                <td className="px-4 py-3 text-slate-500">{v.note || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={`/estimations/${id}/history/${v.id}`}
                    className="text-xs font-medium text-brand-indigo hover:underline"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
