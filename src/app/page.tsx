import { prisma } from "@/lib/prisma";
import { toSummary } from "@/lib/serialize";
import { NewEstimationButton } from "@/components/NewEstimationButton";
import { SearchBox } from "@/components/SearchBox";
import { OpportunityPhaseLegend } from "@/components/OpportunityPhaseBadge";
import { DashboardView } from "@/components/DashboardView";

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
          <h1 className="text-2xl font-bold tracking-tight text-brand-indigo">Estimations</h1>
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

      <OpportunityPhaseLegend />

      <div className="mt-6">
        <DashboardView estimations={estimations} q={q} />
      </div>
    </div>
  );
}
