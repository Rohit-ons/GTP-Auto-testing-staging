"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { buildGtp } from "@/lib/engine/gtp";
import { buildDbProvider } from "@/lib/standards/dbProvider";
import type { CableInput, Overrides } from "@/lib/engine/types";

const APPROVER_ROLES = ["ADMIN", "APPROVER", "MANAGEMENT"];

/** Create a cable SKU from design inputs, snapshotting the generated GTP for reproducibility. */
export async function createCable(input: CableInput, overrides: Overrides = {}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };
    const userId = (session.user as { id?: string }).id as string;

    const edition = input.standardEdition ?? "1988";
    const std = await buildDbProvider(prisma, edition);
    const sheet = buildGtp(input, std, overrides);

    const [cond, ins, inner, outer] = await Promise.all([
      prisma.material.findUnique({ where: { code: input.conductorMaterial } }),
      prisma.material.findUnique({ where: { code: input.insulationCode } }),
      input.innerSheathCode ? prisma.material.findUnique({ where: { code: input.innerSheathCode } }) : Promise.resolve(null),
      prisma.material.findUnique({ where: { code: input.outerSheathCode } }),
    ]);
    if (!cond || !ins || !outer) return { success: false, error: "Material code not found in master" };

    const name = `${input.numberOfCores}C x ${input.areaMain}mm² ${cond.name} ${input.insulationCode}${input.armoured ? " Armd" : ""} ${input.outerSheathGrade}`;

    const cable = await prisma.cableModel.create({
      data: {
        name,
        status: "PENDING",
        standardEdition: edition,
        standardsProfile: input.standardsProfile ?? "IS_STRICT",
        voltageGrade: input.voltageGrade,
        numberOfCores: input.numberOfCores,
        areaMain: input.areaMain,
        areaNeutral: input.areaNeutral ?? null,
        conductorMaterialId: cond.id,
        conductorClass: input.conductorClass,
        conductorShape: input.conductorShape,
        insulationMaterialId: ins.id,
        armoured: input.armoured,
        armourType: input.armourType ?? null,
        innerSheathMaterialId: inner?.id ?? null,
        outerSheathMaterialId: outer.id,
        outerSheathGrade: input.outerSheathGrade,
        outerSheathColour: input.outerSheathColour ?? "Black",
        drumLength: input.drumLength ?? null,
        customer: input.customer ?? null,
        project: input.project ?? null,
        computedJson: JSON.stringify(sheet),
        overridesJson: Object.keys(overrides).length ? JSON.stringify(overrides) : null,
        createdById: userId,
      },
    });

    await prisma.auditLog.create({
      data: { userId, entity: "CableModel", entityId: cable.id, action: "CREATE" },
    });

    // Audit each standard override individually for traceability.
    for (const [rowNo, ov] of Object.entries(overrides)) {
      await prisma.auditLog.create({
        data: { userId, entity: "CableModel", entityId: cable.id, action: "OVERRIDE", field: rowNo, newValue: ov.value, oldValue: ov.reason ?? null },
      });
    }

    revalidatePath("/dashboard/cables");
    return { success: true, id: cable.id };
  } catch (error: unknown) {
    console.error("createCable error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function approveCable(id: string) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string })?.role;
    if (!session?.user || (role && !APPROVER_ROLES.includes(role))) {
      return { success: false, error: "Unauthorized — requires Approver/Admin/Management" };
    }
    const userId = (session.user as { id?: string }).id as string;
    await prisma.cableModel.update({ where: { id }, data: { status: "APPROVED", approvedById: userId } });
    await prisma.auditLog.create({ data: { userId, entity: "CableModel", entityId: id, action: "APPROVE" } });
    revalidatePath("/dashboard/cables");
    revalidatePath(`/dashboard/cables/${id}`);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/** Form-action wrapper (returns void) for use directly in <form action={...}>. */
export async function approveCableForm(id: string): Promise<void> {
  await approveCable(id);
}
