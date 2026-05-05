"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getRules() {
  return await prisma.standardRule.findMany({
    orderBy: { standardRef: "asc" }
  });
}

export async function createRule(data: any) {
  try {
    const rule = await prisma.standardRule.create({
      data: {
        standardRef: data.standardRef,
        ruleType: data.ruleType,
        areaMin: data.areaMin ? parseFloat(data.areaMin) : null,
        areaMax: data.areaMax ? parseFloat(data.areaMax) : null,
        voltage: data.voltage ? parseFloat(data.voltage) : null,
        value: parseFloat(data.value),
        description: data.description || null,
      }
    });
    revalidatePath("/admin/rules");
    return { success: true, rule };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteRule(id: string) {
  try {
    await prisma.standardRule.delete({ where: { id } });
    revalidatePath("/admin/rules");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
