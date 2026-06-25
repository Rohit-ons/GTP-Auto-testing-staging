"use server";

import { prisma } from "@/lib/prisma";
import { buildGtp } from "@/lib/engine/gtp";
import { buildDbProvider } from "@/lib/standards/dbProvider";
import type { CableInput, GtpSheet, Overrides } from "@/lib/engine/types";

/** Build a live GTP sheet for the given inputs using the versioned DB standards. */
export async function previewGtp(input: CableInput, overrides: Overrides = {}): Promise<GtpSheet> {
  const std = await buildDbProvider(prisma, input.standardEdition ?? "1988");
  return buildGtp(input, std, overrides);
}

/** Material options for the design workbench, grouped by category. */
export async function getDesignOptions() {
  const materials = await prisma.material.findMany({ orderBy: { name: "asc" } });
  return {
    conductors: materials.filter((m) => m.category === "CONDUCTOR"),
    insulations: materials.filter((m) => m.category === "INSULATION"),
    sheaths: materials.filter((m) => m.category === "SHEATH"),
    armours: materials.filter((m) => m.category === "ARMOUR"),
  };
}
