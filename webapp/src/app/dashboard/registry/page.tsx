import { getRegistry } from "@/app/actions/registry";
import { prisma } from "@/lib/prisma";
import RegistryClient from "./RegistryClient";

export default async function RegistryPage() {
  const rows = await getRegistry();
  const standards = await prisma.standard.findMany({
    select: { id: true, code: true, edition: true, title: true },
    orderBy: { code: "asc" }
  });

  return (
    <div className="animate-fade-in">
      <RegistryClient rows={rows} standards={standards} />
    </div>
  );
}
