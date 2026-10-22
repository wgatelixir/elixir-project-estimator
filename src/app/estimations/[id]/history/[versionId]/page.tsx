import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toVersionRecord } from "@/lib/serialize";
import { formatDateTime } from "@/lib/format";
import { ProposalSummary } from "@/components/editor/ProposalSummary";
import { RestoreVersionButton } from "@/components/editor/RestoreVersionButton";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string; versionId: string }>;
}

export default async function EstimationVersionPage({ params }: PageProps) {
  const { id, versionId } = await params;

  const row = await prisma.estimationVersion.findUnique({ where: { id: versionId } });
  if (!row || row.estimationId !== id) notFound();

  const version = toVersionRecord(row);
  const savedAt = formatDateTime(version.createdAt);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <Link
            href={`/estimations/${id}/history`}
            className="w-fit text-xs text-slate-400 transition-colors hover:text-brand-crimson"
          >
            ← Back to version history
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-brand-ink">Version from {savedAt}</h1>
        </div>
        <RestoreVersionButton estimationId={id} versionId={versionId} savedAt={savedAt} />
      </div>

      <p className="mt-4 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800 print:hidden">
        You&apos;re viewing a read-only snapshot saved on {savedAt}. Nothing here can be edited — use
        &quot;Restore this version&quot; to make it the current version again.
      </p>

      <div className="mt-6">
        <ProposalSummary
          meta={{
            clientName: version.clientName,
            projectName: version.projectName ?? "",
            ownerName: version.ownerName ?? "",
            status: version.status,
          }}
          data={version.data}
        />
      </div>
    </div>
  );
}
