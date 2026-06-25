"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function getRegistry() {
  return prisma.parameterDefinition.findMany({ orderBy: { ordering: "asc" } });
}

export async function toggleParameter(id: string): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "ADMIN") return { success: false, error: "Unauthorized" };
  const p = await prisma.parameterDefinition.findUnique({ where: { id } });
  if (!p) return { success: false, error: "Not found" };
  await prisma.parameterDefinition.update({ where: { id }, data: { isActive: !p.isActive } });
  await prisma.auditLog.create({
    data: { userId: (session!.user as { id: string }).id, entity: "ParameterDefinition", entityId: id, action: "UPDATE", field: "isActive", oldValue: String(p.isActive), newValue: String(!p.isActive) },
  });
  revalidatePath("/dashboard/registry");
  return { success: true };
}

export async function createParameter(data: {
  key: string; rowNo?: string; label: string; unit?: string;
  section: string; bucket: string; standardRef?: string;
  formulaKey?: string; sourceNote?: string; ordering?: number;
}): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "ADMIN") return { success: false, error: "Unauthorized" };
  try {
    const created = await prisma.parameterDefinition.create({
      data: {
        key: data.key,
        rowNo: data.rowNo || null,
        label: data.label,
        unit: data.unit || null,
        section: data.section,
        bucket: data.bucket,
        standardRef: data.standardRef || null,
        formulaKey: data.formulaKey || null,
        sourceNote: data.sourceNote || null,
        ordering: data.ordering ?? 0,
      },
    });
    await prisma.auditLog.create({
      data: { userId: (session!.user as { id: string }).id, entity: "ParameterDefinition", entityId: created.id, action: "CREATE", field: data.key, newValue: data.label },
    });
    revalidatePath("/dashboard/registry");
    return { success: true };
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") return { success: false, error: "A parameter with this key already exists." };
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
