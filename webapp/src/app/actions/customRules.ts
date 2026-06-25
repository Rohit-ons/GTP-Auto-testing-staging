"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const ADMIN_ROLES = ["ADMIN", "COSTING", "MANAGEMENT"];

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !ADMIN_ROLES.includes(role || "")) throw new Error("Unauthorized");
  return (session.user as { id: string }).id;
}

export async function getCustomRules() {
  const [standards, rules] = await Promise.all([
    prisma.standard.findMany({ orderBy: [{ code: "asc" }, { edition: "asc" }] }),
    prisma.customStandardRule.findMany({
      orderBy: [{ parameterKey: "asc" }, { priority: "asc" }],
      include: { standard: true },
    }),
  ]);
  return { standards, rules };
}

export async function createCustomRule(formData: FormData): Promise<void> {
  const userId = await requireAdmin();
  const standardId = String(formData.get("standardId"));
  const parameterKey = String(formData.get("parameterKey")).trim();
  const conditionJson = String(formData.get("conditionJson")).trim() || "{}";
  const valueText = String(formData.get("valueText")).trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const priority = parseInt(String(formData.get("priority") ?? "100"), 10);

  // Validate JSON early
  try { JSON.parse(conditionJson); } catch { throw new Error(`Invalid condition JSON: ${conditionJson}`); }
  if (!parameterKey || !valueText) throw new Error("parameterKey + valueText required");

  const created = await prisma.customStandardRule.create({
    data: { standardId, parameterKey, conditionJson, valueText, priority, description },
  });
  await prisma.auditLog.create({
    data: { userId, entity: "CustomStandardRule", entityId: created.id, action: "CREATE", field: parameterKey, newValue: valueText },
  });
  revalidatePath("/admin/standards/custom");
}

export async function toggleCustomRule(id: string): Promise<void> {
  const userId = await requireAdmin();
  const r = await prisma.customStandardRule.findUnique({ where: { id } });
  if (!r) return;
  await prisma.customStandardRule.update({ where: { id }, data: { isActive: !r.isActive } });
  await prisma.auditLog.create({
    data: { userId, entity: "CustomStandardRule", entityId: id, action: "UPDATE", field: "isActive", oldValue: String(r.isActive), newValue: String(!r.isActive) },
  });
  revalidatePath("/admin/standards/custom");
}

export async function deleteCustomRule(id: string): Promise<void> {
  const userId = await requireAdmin();
  await prisma.customStandardRule.delete({ where: { id } });
  await prisma.auditLog.create({ data: { userId, entity: "CustomStandardRule", entityId: id, action: "DELETE" } });
  revalidatePath("/admin/standards/custom");
}
