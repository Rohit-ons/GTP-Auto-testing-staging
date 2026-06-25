/**
 * Cable diameter build-up engine.
 *
 * IMPLEMENTS: IS 10462 (Part 1) : 1983 — Fictitious Calculation Method
 * REFERENCES:
 *   - IS 10462-1 cl.3.1  : fictitious conductor diameter (Table 1)
 *   - IS 10462-1 cl.3.2  : fictitious core diameter DC = dL + 2·ti
 *   - IS 10462-1 cl.3.3a : Df = k·DC  (all cores same size, Table 3)
 *   - IS 10462-1 cl.3.3b : Df = 2.42·(3·DC1 + DC2)/4  (3.5-core only)
 *   - IS 10462-1 cl.3.4  : Da = Df + 2·tg
 *   - IS 10462-1 cl.3.5  : Dx = Da + 2·tA
 *   - IS 7098-1 cl.9.3   : insulation min = ti − (0.1 + 0.1·ti)
 *   - IS 7098-1 Table 5  : inner sheath tg by Df band
 *   - IS 7098-1 Table 6  : armour tA by Da band
 *   - IS 7098-1 Table 8  : outer sheath by Dx band
 *
 * Rounding rule (IS 10462-1 cl.0.7):
 *   "Calculated value at each stage shall be rounded off to one significant
 *    place of decimal (0.1 mm) before proceeding to next step."
 */

import { resolveArmour } from "./profile";
import type { CableInput, DiameterChain, StandardsProvider } from "./types";

// ---------------------------------------------------------------------------
// IS 10462 Table 1 — Fictitious conductor diameter (mm) for fixed-installation
// cables (Classes 1 and 2). Shape and compactness are IGNORED — only
// cross-section area determines this value.
// ---------------------------------------------------------------------------
const IS10462_TABLE1: Record<number, number> = {
  1.5: 1.4, 2.5: 1.8, 4: 2.3,  6: 2.8,  10: 3.6, 16: 4.5,
  25:  5.6, 35:  6.7, 50: 8.0, 70: 9.4, 95: 11.0,120: 12.4,
  150:13.8,185:15.3, 240:17.5, 300:19.5, 400:22.6, 500:25.2,
  630:28.3, 800:31.9,1000:35.7,
};

// IS 10462 Table 3 — Assembly coefficient k for Df = k·DC (same-size cores)
const IS10462_TABLE3: Record<number, number> = {
  2:2.00, 3:2.16, 4:2.42, 5:2.70, 6:3.00, 7:3.00,
  8:3.45, 9:3.80,10:4.00,11:4.00,12:4.16,13:4.41,
  14:4.41,15:4.70,16:4.70,17:5.00,18:5.00,19:5.00,
  20:5.33,21:5.33,22:5.67,23:5.67,24:6.00,25:6.00,
  26:6.00,27:6.15,28:6.41,29:6.41,30:6.41,37:7.00,
  61:9.11,
};

/** IS 10462 cl.0.7 — round to 1 decimal place at each calculation step. */
function r1(n: number): number { return Math.round(n * 10) / 10; }
/** Final OD rounded to nearest 0.5 mm (GTP reference values). */
function r2(n: number): number { return Math.round(n * 100) / 100; }

/**
 * IS 10462 Table 1 fictitious conductor diameter.
 * Interpolates linearly for non-standard sizes; exact for standard IS sizes.
 */
export function fictitiousConductorDia(area: number): number {
  if (IS10462_TABLE1[area] !== undefined) return IS10462_TABLE1[area];
  // Linear interpolation between nearest standard sizes
  const areas = Object.keys(IS10462_TABLE1).map(Number).sort((a, b) => a - b);
  const lo = areas.filter(a => a < area).pop();
  const hi = areas.find(a => a > area);
  if (!lo) return IS10462_TABLE1[areas[0]];
  if (!hi) return IS10462_TABLE1[areas[areas.length - 1]];
  const t = (area - lo) / (hi - lo);
  return r1(IS10462_TABLE1[lo] + t * (IS10462_TABLE1[hi] - IS10462_TABLE1[lo]));
}

/**
 * Full IS 10462 Part 1 diameter build-up chain.
 *
 * Steps (matching IS 10462 clause numbers):
 *  3.1  dL  = fictitious conductor diameter (Table 1, ignores shape)
 *  3.2  DC  = dL + 2·ti     (core diameter, unscreened)
 *  3.3a Df  = k·DC           (all same-size cores, Table 3)
 *  3.3b Df  = 2.42·(3·DC1 + DC2)/4   (3.5-core special formula)
 *  3.4  Da  = Df + 2·tg      (over inner sheath; tg from IS 7098 Table 5)
 *  3.5  Dx  = Da + 2·tA      (over armour; tA from IS 7098 Table 6)
 *       OD  = Dx + 2·t_outer (outer sheath nominal from IS 7098 Table 8)
 */
export function buildDiameterChain(
  input: CableInput,
  std: StandardsProvider,
  insulationNominal: number,
): DiameterChain {
  const cores = input.numberOfCores;
  const is35Core = (cores === 3.5);

  // ---- Step 3.1 — fictitious conductor diameter ----
  const dL_main = fictitiousConductorDia(input.areaMain);
  const dL_neut = input.areaNeutral ? fictitiousConductorDia(input.areaNeutral) : null;

  // ---- Step 3.2 — fictitious core diameters ----
  // Insulation thickness for the neutral core uses the standard lookup for its OWN area.
  const insType = input.insulationCode.toUpperCase().startsWith("XLPE") ? "XLPE" : "PVC";
  const ti_main = insulationNominal;
  const ti_neut = (is35Core && input.areaNeutral)
    ? (std.insulationNominal(insType, input.voltageGrade, input.areaNeutral) ?? insulationNominal)
    : insulationNominal;
  const DC1 = r1(dL_main + 2 * ti_main);
  const DC2 = (dL_neut !== null) ? r1(dL_neut + 2 * ti_neut) : DC1;

  // ---- Step 3.3 — diameter over laid-up cores ----
  let Df: number;
  if (is35Core) {
    // IS 10462 cl.3.3b — special 3.5-core formula
    Df = r1(2.42 * (3 * DC1 + DC2) / 4);
  } else if (cores === 1) {
    Df = DC1; // single core — no assembly, no inner sheath
  } else {
    const k = IS10462_TABLE3[Math.floor(cores)] ?? (1 + 1.15 * Math.sqrt(cores));
    Df = r1(k * DC1);
  }

  // ---- Step 3.4 — inner sheath (IS 7098 Table 5) ----
  const tg = (cores > 1) ? (std.innerSheathMin(Df) ?? 0) : 0;
  const Da = r1(Df + 2 * tg);  // = fictitious dia under armour

  // ---- Step 3.5 — armour (IS 7098 Table 6, keyed by Da; profile-aware) ----
  const profile = input.standardsProfile ?? "IS_STRICT";
  let Dx = Da;
  let armourDim = 0;
  let armourLabel = "N/A";
  if (input.armoured && input.armourType) {
    const arm = resolveArmour(std, input.armourType, Da, profile);
    if (arm) {
      armourDim = arm.nominalDim;
      armourLabel = arm.dimension;
      Dx = r1(Da + 2 * armourDim);
    }
  }

  // ---- Outer sheath (IS 7098 Table 8, keyed by Dx) ----
  const outer = std.outerSheath(Dx);
  const outerNominal = outer?.nominal ?? 0;
  const outerMin = outer?.min ?? 0;
  // Fictitious reference OD uses the NOMINAL outer sheath (IS 10462 over sheath).
  const overallDiameter = r1(Dx + 2 * outerNominal);

  // ---- Practical OD (IS 10462 cl.0.4 — actual diameter computed separately) ----
  // Re-runs the build-up with ACTUAL (compacted) conductor diameters and the resolved
  // thicknesses. Sector cores compact (~0.90×); round cores ≈ fictitious. Built to the
  // minimum outer sheath (matches how cables are produced + the manufacturer's GTP OD).
  const sectorFactor = input.conductorShape === "SHAPED" ? 0.90 : 1.0;
  const dCondP_main = dL_main * sectorFactor;
  const dCondP_neut = (dL_neut !== null) ? dL_neut * sectorFactor : null;
  const DC1p = r1(dCondP_main + 2 * ti_main);
  const DC2p = (dCondP_neut !== null) ? r1(dCondP_neut + 2 * ti_neut) : DC1p;
  let DfP: number;
  if (is35Core) DfP = r1(2.42 * (3 * DC1p + DC2p) / 4);
  else if (cores === 1) DfP = DC1p;
  else DfP = r1((IS10462_TABLE3[Math.floor(cores)] ?? (1 + 1.15 * Math.sqrt(cores))) * DC1p);
  const practicalOverallDiameter = r1(DfP + 2 * tg + 2 * armourDim + 2 * outerMin);

  return {
    conductorDia: r2(dL_main),
    coreDia: r2(DC1),
    assemblyDia: r2(Df),
    diaOverInnerSheath: r2(Da),
    diaUnderArmour: r2(Da),
    diaOverArmour: r2(Dx),
    diaUnderOuterSheath: r2(Dx),
    overallDiameter: r2(overallDiameter),
    practicalOverallDiameter: r2(practicalOverallDiameter),
    innerSheath: tg,
    armourDim,
    armourLabel,
    outerNominal,
    outerMin,
  };
}

/** IS 7098: minimum bending radius = 12 × OD */
export function minBendingRadius(od: number): number { return 12 * od; }
