"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !["ADMIN", "COSTING", "MANAGEMENT"].includes(role || "")) {
    throw new Error("Unauthorized");
  }
  return (session.user as { id: string }).id;
}

async function audit(userId: string, entity: string, entityId: string, action: string, field?: string, oldValue?: string, newValue?: string) {
  await prisma.auditLog.create({ data: { userId, entity, entityId, action, field, oldValue, newValue } });
}

export async function getStandardsOverview() {
  const standards = await prisma.standard.findMany({ orderBy: [{ code: "asc" }, { edition: "asc" }] });
  const conductorSpecs = await prisma.conductorSpec.findMany({ orderBy: [{ material: "asc" }, { area: "asc" }] });
  const is7098 = standards.find((s) => s.code === "IS 7098-1");
  const insulationSpecs = is7098
    ? await prisma.insulationSpec.findMany({ where: { standardId: is7098.id }, orderBy: { areaMin: "asc" } })
    : [];
  const outerSheathSpecs = is7098
    ? await prisma.outerSheathSpec.findMany({ where: { standardId: is7098.id }, orderBy: { diaMin: "asc" } })
    : [];
  const armourSpecs = is7098
    ? await prisma.armourSpec.findMany({ where: { standardId: is7098.id }, orderBy: [{ armourType: "asc" }, { diaMin: "asc" }] })
    : [];

  // Count specs per standard
  const specCounts = await Promise.all(standards.map(async (s) => ({
    id: s.id,
    conductors: await prisma.conductorSpec.count({ where: { standardId: s.id } }),
    insulations: await prisma.insulationSpec.count({ where: { standardId: s.id } }),
    sheaths: await prisma.outerSheathSpec.count({ where: { standardId: s.id } }),
    armours: await prisma.armourSpec.count({ where: { standardId: s.id } }),
    customRules: await prisma.customStandardRule.count({ where: { standardId: s.id } }),
  })));

  return { standards, conductorSpecs, insulationSpecs, outerSheathSpecs, armourSpecs, specCounts };
}

// ---- Standard CRUD ----
export async function createStandard(data: { code: string; edition: string; title: string }): Promise<{ success: boolean; error?: string; id?: string }> {
  const userId = await requireAdmin();
  try {
    const created = await prisma.standard.create({
      data: { code: data.code, edition: data.edition, title: data.title },
    });
    await audit(userId, "Standard", created.id, "CREATE", undefined, undefined, `${data.code} : ${data.edition}`);
    revalidatePath("/dashboard/standards");
    return { success: true, id: created.id };
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") return { success: false, error: "A standard with this code + edition already exists." };
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteStandard(id: string): Promise<{ success: boolean; error?: string }> {
  const userId = await requireAdmin();
  try {
    await prisma.standard.delete({ where: { id } });
    await audit(userId, "Standard", id, "DELETE");
    revalidatePath("/dashboard/standards");
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// ---- ConductorSpec (IS 8130) ----
export async function updateConductorSpec(formData: FormData): Promise<void> {
  const userId = await requireAdmin();
  const id = String(formData.get("id"));
  const maxResistance20 = (parseFloat(String(formData.get("maxResistance20"))) || 0);
  const minWires = (parseInt(String(formData.get("minWires")), 10) || 0);
  const prev = await prisma.conductorSpec.findUnique({ where: { id } });
  await prisma.conductorSpec.update({ where: { id }, data: { maxResistance20, minWires } });
  await audit(userId, "ConductorSpec", id, "UPDATE", "maxResistance20", String(prev?.maxResistance20), String(maxResistance20));
  revalidatePath("/dashboard/standards");
}

export async function createConductorSpec(formData: FormData): Promise<void> {
  const userId = await requireAdmin();
  const standardId = String(formData.get("standardId"));
  const material = String(formData.get("material"));
  const area = (parseFloat(String(formData.get("area"))) || 0);
  const maxResistance20 = (parseFloat(String(formData.get("maxResistance20"))) || 0);
  const minWires = (parseInt(String(formData.get("minWires")), 10) || 0);
  const created = await prisma.conductorSpec.create({
    data: { standardId, material, conductorClass: "2", shape: "CIRCULAR", area, maxResistance20, minWires },
  });
  await audit(userId, "ConductorSpec", created.id, "CREATE", undefined, undefined, `${material} ${area}mm²`);
  revalidatePath("/dashboard/standards");
}

export async function deleteConductorSpec(id: string): Promise<void> {
  const userId = await requireAdmin();
  await prisma.conductorSpec.delete({ where: { id } });
  await audit(userId, "ConductorSpec", id, "DELETE");
  revalidatePath("/dashboard/standards");
}

// ---- InsulationSpec ----
export async function updateInsulationSpec(formData: FormData): Promise<void> {
  const userId = await requireAdmin();
  const id = String(formData.get("id"));
  const nominalThickness = (parseFloat(String(formData.get("nominalThickness"))) || 0);
  const prev = await prisma.insulationSpec.findUnique({ where: { id } });
  await prisma.insulationSpec.update({ where: { id }, data: { nominalThickness } });
  await audit(userId, "InsulationSpec", id, "UPDATE", "nominalThickness", String(prev?.nominalThickness), String(nominalThickness));
  revalidatePath("/dashboard/standards");
}

export async function createInsulationSpec(formData: FormData): Promise<void> {
  const userId = await requireAdmin();
  const standardId = String(formData.get("standardId"));
  const insulationType = String(formData.get("insulationType"));
  const voltage = (parseFloat(String(formData.get("voltage"))) || 0);
  const areaMin = (parseFloat(String(formData.get("areaMin"))) || 0);
  const areaMax = (parseFloat(String(formData.get("areaMax"))) || 0);
  const nominalThickness = (parseFloat(String(formData.get("nominalThickness"))) || 0);
  const created = await prisma.insulationSpec.create({
    data: { standardId, insulationType, voltage, areaMin, areaMax, nominalThickness },
  });
  await audit(userId, "InsulationSpec", created.id, "CREATE", undefined, undefined, `${insulationType} ${areaMin}-${areaMax}mm²`);
  revalidatePath("/dashboard/standards");
}

export async function deleteInsulationSpec(id: string): Promise<void> {
  const userId = await requireAdmin();
  await prisma.insulationSpec.delete({ where: { id } });
  await audit(userId, "InsulationSpec", id, "DELETE");
  revalidatePath("/dashboard/standards");
}

// ---- InnerSheathSpec ----
export async function updateInnerSheathSpec(formData: FormData): Promise<void> {
  const userId = await requireAdmin();
  const id = String(formData.get("id"));
  const minThickness = (parseFloat(String(formData.get("minThickness"))) || 0);
  const prev = await prisma.innerSheathSpec.findUnique({ where: { id } });
  await prisma.innerSheathSpec.update({ where: { id }, data: { minThickness } });
  await audit(userId, "InnerSheathSpec", id, "UPDATE", "minThickness", String(prev?.minThickness), String(minThickness));
  revalidatePath("/dashboard/standards");
}

export async function createInnerSheathSpec(formData: FormData): Promise<void> {
  const userId = await requireAdmin();
  const standardId = String(formData.get("standardId"));
  const diaMin = (parseFloat(String(formData.get("diaMin"))) || 0);
  const diaMax = (parseFloat(String(formData.get("diaMax"))) || 0);
  const minThickness = (parseFloat(String(formData.get("minThickness"))) || 0);
  const created = await prisma.innerSheathSpec.create({
    data: { standardId, diaMin, diaMax, minThickness },
  });
  await audit(userId, "InnerSheathSpec", created.id, "CREATE", undefined, undefined, `Dia ${diaMin}-${diaMax}mm`);
  revalidatePath("/dashboard/standards");
}

export async function deleteInnerSheathSpec(id: string): Promise<void> {
  const userId = await requireAdmin();
  await prisma.innerSheathSpec.delete({ where: { id } });
  await audit(userId, "InnerSheathSpec", id, "DELETE");
  revalidatePath("/dashboard/standards");
}

// ---- OuterSheathSpec ----
export async function updateOuterSheathSpec(formData: FormData): Promise<void> {
  const userId = await requireAdmin();
  const id = String(formData.get("id"));
  const minThickness = (parseFloat(String(formData.get("minThickness"))) || 0);
  const nominalThickness = (parseFloat(String(formData.get("nominalThickness"))) || 0);
  const prev = await prisma.outerSheathSpec.findUnique({ where: { id } });
  await prisma.outerSheathSpec.update({ where: { id }, data: { minThickness, nominalThickness } });
  await audit(userId, "OuterSheathSpec", id, "UPDATE", "minThickness", String(prev?.minThickness), String(minThickness));
  revalidatePath("/dashboard/standards");
}

export async function createOuterSheathSpec(formData: FormData): Promise<void> {
  const userId = await requireAdmin();
  const standardId = String(formData.get("standardId"));
  const diaMin = (parseFloat(String(formData.get("diaMin"))) || 0);
  const diaMax = (parseFloat(String(formData.get("diaMax"))) || 0);
  const nominalThickness = (parseFloat(String(formData.get("nominalThickness"))) || 0);
  const minThickness = (parseFloat(String(formData.get("minThickness"))) || 0);
  const created = await prisma.outerSheathSpec.create({
    data: { standardId, diaMin, diaMax, nominalThickness, minThickness },
  });
  await audit(userId, "OuterSheathSpec", created.id, "CREATE", undefined, undefined, `Dia ${diaMin}-${diaMax}mm`);
  revalidatePath("/dashboard/standards");
}

export async function deleteOuterSheathSpec(id: string): Promise<void> {
  const userId = await requireAdmin();
  await prisma.outerSheathSpec.delete({ where: { id } });
  await audit(userId, "OuterSheathSpec", id, "DELETE");
  revalidatePath("/dashboard/standards");
}

// ---- ArmourSpec ----
export async function updateArmourSpec(formData: FormData): Promise<void> {
  const userId = await requireAdmin();
  const id = String(formData.get("id"));
  const dimension = String(formData.get("dimension"));
  const nominalDim = (parseFloat(String(formData.get("nominalDim"))) || 0);
  const prev = await prisma.armourSpec.findUnique({ where: { id } });
  await prisma.armourSpec.update({ where: { id }, data: { dimension, nominalDim } });
  await audit(userId, "ArmourSpec", id, "UPDATE", "dimension", prev?.dimension, dimension);
  revalidatePath("/dashboard/standards");
}

export async function createArmourSpec(formData: FormData): Promise<void> {
  const userId = await requireAdmin();
  const standardId = String(formData.get("standardId"));
  const armourType = String(formData.get("armourType"));
  const diaMin = (parseFloat(String(formData.get("diaMin"))) || 0);
  const diaMax = (parseFloat(String(formData.get("diaMax"))) || 0);
  const dimension = String(formData.get("dimension"));
  const nominalDim = (parseFloat(String(formData.get("nominalDim"))) || 0);
  const created = await prisma.armourSpec.create({
    data: { standardId, armourType, diaMin, diaMax, dimension, nominalDim },
  });
  await audit(userId, "ArmourSpec", created.id, "CREATE", undefined, undefined, `${armourType} Dia ${diaMin}-${diaMax}mm`);
  revalidatePath("/dashboard/standards");
}

export async function deleteArmourSpec(id: string): Promise<void> {
  const userId = await requireAdmin();
  await prisma.armourSpec.delete({ where: { id } });
  await audit(userId, "ArmourSpec", id, "DELETE");
  revalidatePath("/dashboard/standards");
}
