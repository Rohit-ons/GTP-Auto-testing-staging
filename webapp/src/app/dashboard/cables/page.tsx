import { prisma } from "@/lib/prisma";
import CablesClient from "./CablesClient";

export default async function CablesPage() {
  const cables = await prisma.cableModel.findMany({
    include: {
      conductorMaterial: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="animate-fade-in">
      <CablesClient cables={cables.map(c => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      }))} />
    </div>
  );
}
