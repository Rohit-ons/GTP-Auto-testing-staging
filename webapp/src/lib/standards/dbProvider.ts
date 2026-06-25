// StandardsProvider backed by the versioned DB tables. Pre-fetches all relevant rows
// for an IS 7098 edition (+ IS 8130) into memory, then returns a synchronous provider so
// the pure engine can stay sync.

import type { PrismaClient } from "@prisma/client";
import type { ArmourType, ConductorMaterial, StandardsProvider } from "../engine/types";

interface Band { diaMin: number; diaMax: number }
function findBand<T extends Band>(bands: T[], dia: number): T | undefined {
  return bands.find((b) => dia > b.diaMin && dia <= b.diaMax) ?? bands[bands.length - 1];
}

export async function buildDbProvider(
  prisma: PrismaClient,
  edition = "1988",
): Promise<StandardsProvider> {
  const is8130 = await prisma.standard.findFirst({ where: { code: "IS 8130" } });
  const is7098 =
    (await prisma.standard.findFirst({ where: { code: "IS 7098-1", edition } })) ??
    (await prisma.standard.findFirst({ where: { code: "IS 7098-1" } }));

  const [conductorSpecs, insSpecs, innerSpecs, outerSpecs, armourSpecs, materials, customRules, registry] =
    await Promise.all([
      prisma.conductorSpec.findMany({ where: is8130 ? { standardId: is8130.id } : {} }),
      prisma.insulationSpec.findMany({ where: is7098 ? { standardId: is7098.id } : {} }),
      prisma.innerSheathSpec.findMany({ where: is7098 ? { standardId: is7098.id } : {} }),
      prisma.outerSheathSpec.findMany({ where: is7098 ? { standardId: is7098.id } : {} }),
      prisma.armourSpec.findMany({ where: is7098 ? { standardId: is7098.id } : {} }),
      prisma.material.findMany(),
      prisma.customStandardRule.findMany({ where: { isActive: true }, orderBy: { priority: "asc" } }),
      prisma.parameterDefinition.findMany({ where: { isActive: true }, orderBy: { ordering: "asc" } }),
    ]);

  // Phase H — index custom rules by parameterKey for the priority overlay.
  const customByKey = new Map<string, typeof customRules>();
  for (const r of customRules) {
    const arr = customByKey.get(r.parameterKey) ?? [];
    arr.push(r); customByKey.set(r.parameterKey, arr);
  }
  function matchCustom(key: string, cond: Record<string, unknown>): string | null {
    const rules = customByKey.get(key); if (!rules) return null;
    for (const r of rules) {
      try {
        const c = JSON.parse(r.conditionJson) as Record<string, unknown>;
        let ok = true;
        for (const k of Object.keys(c)) {
          const want = c[k];
          // band match: {areaMin,areaMax} / {diaMin,diaMax} against cond.area / cond.dia
          if (k === "areaMin" && (cond.area as number) < want) { ok = false; break; }
          if (k === "areaMax" && (cond.area as number) > want) { ok = false; break; }
          if (k === "diaMin" && (cond.dia as number) <= want) { ok = false; break; }
          if (k === "diaMax" && (cond.dia as number) > want) { ok = false; break; }
          if (!["areaMin", "areaMax", "diaMin", "diaMax"].includes(k) && cond[k] !== want) { ok = false; break; }
        }
        if (ok) return r.valueText;
      } catch { /* skip malformed */ }
    }
    return null;
  }

  const resByKey = new Map<string, number>();
  const wiresByKey = new Map<string, number>();
  for (const c of conductorSpecs) {
    resByKey.set(`${c.material}|${c.area}`, c.maxResistance20);
    wiresByKey.set(`${c.material}|${c.area}`, c.minWires);
  }
  const matByCode = new Map(materials.map((m) => [m.code, m]));
  const innerBands = innerSpecs.map((s) => ({ diaMin: s.diaMin, diaMax: s.diaMax, minThickness: s.minThickness }))
    .sort((a, b) => a.diaMin - b.diaMin);
  const outerBands = outerSpecs.map((s) => ({ diaMin: s.diaMin, diaMax: s.diaMax, nominal: s.nominalThickness, min: s.minThickness }))
    .sort((a, b) => a.diaMin - b.diaMin);
  const armourRound = armourSpecs.filter((s) => s.armourType === "ROUND_WIRE")
    .map((s) => ({ diaMin: s.diaMin, diaMax: s.diaMax, dimension: s.dimension, nominalDim: s.nominalDim }))
    .sort((a, b) => a.diaMin - b.diaMin);
  const armourStrip = armourSpecs.filter((s) => s.armourType === "FLAT_STRIP")
    .map((s) => ({ diaMin: s.diaMin, diaMax: s.diaMax, dimension: s.dimension, nominalDim: s.nominalDim }))
    .sort((a, b) => a.diaMin - b.diaMin);

  return {
    resistance(material: ConductorMaterial, area: number) {
      const custom = matchCustom("conductor.maxResistance20", { material, area });
      if (custom !== null) return Number(custom);
      return resByKey.get(`${material}|${area}`) ?? null;
    },
    minWires(material: ConductorMaterial, area: number) {
      const custom = matchCustom("conductor.minWires", { material, area });
      if (custom !== null) return Number(custom);
      return wiresByKey.get(`${material}|${area}`) ?? null;
    },
    insulationNominal(type: string, voltage: number, area: number) {
      const custom = matchCustom("insulation.nominalThickness", { type, voltage, area });
      if (custom !== null) return Number(custom);
      const m = insSpecs.find(
        (s) => s.insulationType === type && s.voltage === voltage && area >= s.areaMin && area <= s.areaMax,
      );
      return m ? m.nominalThickness : null;
    },
    innerSheathMin(dia: number) {
      const custom = matchCustom("innerSheath.minThickness", { dia });
      if (custom !== null) return Number(custom);
      return findBand(innerBands, dia)?.minThickness ?? null;
    },
    outerSheath(dia: number) {
      const custom = matchCustom("outerSheath.minThickness", { dia });
      const customNom = matchCustom("outerSheath.nominalThickness", { dia });
      if (custom !== null || customNom !== null) {
        const b = findBand(outerBands, dia);
        return {
          nominal: customNom !== null ? Number(customNom) : (b?.nominal ?? 0),
          min: custom !== null ? Number(custom) : (b?.min ?? 0),
        };
      }
      const b = findBand(outerBands, dia);
      return b ? { nominal: b.nominal, min: b.min } : null;
    },
    armour(type: ArmourType, dia: number) {
      const custom = matchCustom("armour.dimension", { type, dia });
      if (custom !== null) {
        const num = Number(custom.split("x").pop()?.trim() ?? custom);
        return { dimension: custom, nominalDim: isFinite(num) ? num : 0 };
      }
      const b = findBand(type === "ROUND_WIRE" ? armourRound : armourStrip, dia);
      return b ? { dimension: b.dimension, nominalDim: b.nominalDim } : null;
    },
    material(code: string) {
      const m = matByCode.get(code);
      return m ? { code: m.code, name: m.name, category: m.category, density: m.density, resistivity20: m.resistivity20, alpha: m.alpha, gtpText: m.gtpText } : null;
    },
    registry,
  };
}
