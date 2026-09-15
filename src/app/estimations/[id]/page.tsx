import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toRecord } from "@/lib/serialize";
import { EstimationEditor } from "@/components/editor/EstimationEditor";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EstimationPage({ params }: PageProps) {
  const { id } = await params;
  const row = await prisma.estimation.findUnique({ where: { id } });
  if (!row) notFound();

  return <EstimationEditor initial={toRecord(row)} />;
}
