// StandardsProvider backed by the canonical static data module.
// Used by the engine verification script and as a fallback. Mirrors the seeded DB exactly.

import type { ArmourType, ConductorMaterial, MaterialInfo, StandardsProvider } from "../engine/types";
import * as D from "./data";

interface Band { diaMin: number; diaMax: number }
function findBand<T extends Band>(bands: T[], dia: number): T | undefined {
  return bands.find((b) => dia > b.diaMin && dia <= b.diaMax) ?? bands[bands.length - 1];
}

export function staticProvider(): StandardsProvider {
  const matByCode = new Map<string, MaterialInfo>(D.MATERIALS.map((m) => [m.code as string, { ...m }]));

  return {
    resistance(material: ConductorMaterial, area: number) {
      return D.CONDUCTOR_RESISTANCE_20[material]?.[area] ?? null;
    },
    minWires(material: ConductorMaterial, area: number) {
      return D.CONDUCTOR_MIN_WIRES[material]?.[area] ?? null;
    },
    insulationNominal(type: string, voltage: number, area: number) {
      if (type === "XLPE" && voltage === 1100) {
        return D.XLPE_INSULATION_NOMINAL_1100V[area] ?? null;
      }
      // Other insulation/voltage tables not yet digitised.
      return D.XLPE_INSULATION_NOMINAL_1100V[area] ?? null;
    },
    innerSheathMin(dia: number) {
      return findBand(D.INNER_SHEATH_BANDS, dia)?.minThickness ?? null;
    },
    outerSheath(dia: number) {
      const b = findBand(D.OUTER_SHEATH_BANDS, dia);
      return b ? { nominal: b.nominalThickness, min: b.minThickness } : null;
    },
    armour(type: ArmourType, dia: number) {
      const bands = type === "ROUND_WIRE" ? D.ARMOUR_ROUND_WIRE_BANDS : D.ARMOUR_FLAT_STRIP_BANDS;
      const b = findBand(bands, dia);
      return b ? { dimension: b.dimension, nominalDim: b.nominalDim } : null;
    },
    material(code: string) {
      return matByCode.get(code) ?? null;
    },
  };
}
