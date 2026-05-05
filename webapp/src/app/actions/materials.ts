"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMaterials() {
  return await prisma.material.findMany({
    orderBy: { category: "asc" }
  });
}

export async function createMaterial(data: any) {
  try {
    const material = await prisma.material.create({
      data: {
        name: data.name,
        category: data.category,
        density: data.density ? parseFloat(data.density) : null,
        resistivity20: data.resistivity20 ? parseFloat(data.resistivity20) : null,
        alpha: data.alpha ? parseFloat(data.alpha) : null,
      }
    });
    revalidatePath("/admin/materials");
    return { success: true, material };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMaterial(id: string) {
  try {
    await prisma.material.delete({ where: { id } });
    revalidatePath("/admin/materials");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
export async function bulkImportMaterials(materials: any[]) {
  try {
    const created = await prisma.material.createMany({
      data: materials.map(m => ({
        name: m.name,
        category: m.category,
        density: m.density ? parseFloat(m.density) : null,
        resistivity20: m.resistivity20 ? parseFloat(m.resistivity20) : null,
        alpha: m.alpha ? parseFloat(m.alpha) : null,
      }))
    });
    revalidatePath("/admin/materials");
    return { success: true, count: created.count };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
