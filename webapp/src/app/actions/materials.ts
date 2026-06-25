"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMaterials() {
  return prisma.material.findMany({ orderBy: { category: "asc" } });
}

function toCode(name: string): string {
  return name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export async function createMaterial(data: { name: string, category: string, density?: number, resistivity20?: number, alpha?: number, code?: string }): Promise<{ success: boolean; error?: string }> {
  const name = data.name.trim();
  if (!name) return { success: false, error: "Name is required" };
  const category = data.category;
  const density = data.density;
  const resistivity20 = data.resistivity20;
  const alpha = data.alpha;
  const code = data.code || toCode(name);

  await prisma.material.upsert({
    where: { code },
    update: {
      name, category,
      density: density ? parseFloat(String(density)) : null,
      resistivity20: resistivity20 ? parseFloat(String(resistivity20)) : null,
      alpha: alpha ? parseFloat(String(alpha)) : null,
    },
    create: {
      code, name, category,
      density: density ?? null,
      resistivity20: resistivity20 ?? null,
      alpha: alpha ?? null,
    },
  });
  revalidatePath("/dashboard/materials");
  return { success: true };
}

/** Form action: deletes a material (returns void for use via bind). */
export async function deleteMaterial(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.material.delete({ where: { id } });
    revalidatePath("/dashboard/materials");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function bulkImportMaterials(materials: { name?: string; code?: string; category?: string; density?: string | number; resistivity20?: string | number; alpha?: string | number }[]) {
  try {
    let count = 0;
    for (const m of materials) {
      const name = String(m.name ?? "").trim();
      if (!name) continue;
      const code = String(m.code ?? "") || toCode(name);
      await prisma.material.upsert({
        where: { code },
        update: {},
        create: {
          code, name, category: m.category ?? "CONDUCTOR",
          density: m.density ? parseFloat(m.density) : null,
          resistivity20: m.resistivity20 ? parseFloat(m.resistivity20) : null,
          alpha: m.alpha ? parseFloat(m.alpha) : null,
        },
      });
      count++;
    }
    revalidatePath("/dashboard/materials");
    return { success: true, count };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
