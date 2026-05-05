"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { 
  calculateConductorDCResistance20, 
  calculateConductorACResistance, 
  calculateApproximateConductorDiameter, 
  calculateOverallDiameter 
} from "@/lib/engines/calculation";

export async function createCable(data: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const cable = await prisma.cableModel.create({
      data: {
        name: `${data.cores}C x ${data.area}mm² ${data.conductorName || 'Cable'}`,
        voltageRating: 1.1, // Default LV
        numberOfCores: parseFloat(data.cores),
        conductorAreaMain: parseFloat(data.area),
        conductorClass: "Class 2", // Standard default
        conductorMaterialId: data.conductorMaterialId,
        insulationMaterialId: data.insulationMaterialId,
        insulationThicknessMain: parseFloat(data.insulationThk),
        innerSheathThickness: parseFloat(data.innerSheathThk),
        armourThickness: parseFloat(data.armourThk),
        outerSheathThickness: parseFloat(data.outerSheathThk),
        outerSheathMaterialId: data.outerSheathMaterialId,
        
        computedOverallDiameter: parseFloat(data.overallDia),
        computedDcResistance20: parseFloat(data.r20),
        computedAcResistance90: parseFloat(data.r90),
        
        createdById: (session.user as any).id,
        status: "PENDING"
      }
    });

    revalidatePath("/admin/cables");
    return { success: true, cable };
  } catch (error: any) {
    console.error("Create Cable Error:", error);
    return { success: false, error: error.message };
  }
}

export async function approveCable(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role === "ENGINEER") {
      throw new Error("Unauthorized - Approval requires Admin/Approver role");
    }

    const cable = await prisma.cableModel.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedById: (session.user as any).id
      }
    });

    revalidatePath("/admin/cables");
    revalidatePath(`/admin/cables/${id}`);
    return { success: true, cable };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function bulkImportCables(rows: any[]) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const conductors = await prisma.material.findMany({ where: { category: "CONDUCTOR" } });
    const insulators = await prisma.material.findMany({ where: { category: "INSULATION" } });
    const sheaths = await prisma.material.findMany({ where: { category: "SHEATH" } });

    for (const row of rows) {
      const cores = parseFloat(row.cores);
      const area = parseFloat(row.area);
      const insulationThk = parseFloat(row.insulationThk);
      const innerSheathThk = parseFloat(row.innerSheathThk);
      const armourThk = parseFloat(row.armourThk);
      const outerSheathThk = parseFloat(row.outerSheathThk);

      const condDia = calculateApproximateConductorDiameter(area);
      const overallDia = calculateOverallDiameter(condDia, insulationThk, innerSheathThk, armourThk, outerSheathThk, cores);
      
      const condMat = conductors.find(c => c.name.toLowerCase() === row.conductorMaterial?.toLowerCase()) || conductors[0];
      const r20 = calculateConductorDCResistance20(condMat.resistivity20 || 0, area);
      const r90 = calculateConductorACResistance(r20, condMat.alpha || 0, 90);
      
      await prisma.cableModel.create({
        data: {
          name: `${cores}C x ${area}mm² ${condMat.name}`,
          voltageRating: 1.1,
          numberOfCores: cores,
          conductorAreaMain: area,
          conductorClass: "Class 2",
          conductorMaterialId: condMat.id,
          insulationMaterialId: insulators[0].id,
          insulationThicknessMain: insulationThk,
          innerSheathThickness: innerSheathThk,
          armourThickness: armourThk,
          outerSheathThickness: outerSheathThk,
          outerSheathMaterialId: sheaths[0].id,
          
          computedOverallDiameter: parseFloat(overallDia.toFixed(2)),
          computedDcResistance20: parseFloat(r20.toFixed(4)),
          computedAcResistance90: parseFloat(r90.toFixed(4)),
          
          createdById: (session.user as any).id,
          status: "PENDING"
        }
      });
    }

    revalidatePath("/admin/cables");
    return { success: true, count: rows.length };
  } catch (error: any) {
    console.error("Bulk Import Error:", error);
    return { success: false, error: error.message };
  }
}
