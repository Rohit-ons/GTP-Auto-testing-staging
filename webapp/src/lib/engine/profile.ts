// Profile-aware resolvers — apply the Polyvion house overrides on top of the IS provider.
// Keeps the IS data untouched (provider stays IS-strict); the override is a pure layer.

import { houseFlatStrip, houseMinWires } from "../standards/data";
import type { ArmourType, ConductorMaterial, StandardsProfile, StandardsProvider } from "./types";

/** Strand count: IS 8130 (strict) or the Polyvion house band table. */
export function resolveMinWires(
  std: StandardsProvider,
  material: ConductorMaterial,
  area: number,
  profile: StandardsProfile,
): number | null {
  if (profile === "POLYVION_HOUSE") return houseMinWires(area);
  return std.minWires(material, area);
}

/** Armour dimension: IS 7098 Table 6 (strict) or the Polyvion house 4.0×0.80 strip. */
export function resolveArmour(
  std: StandardsProvider,
  type: ArmourType,
  dia: number,
  profile: StandardsProfile,
): { dimension: string; nominalDim: number } | null {
  if (profile === "POLYVION_HOUSE" && type === "FLAT_STRIP") return houseFlatStrip();
  return std.armour(type, dia);
}
