/**
 * Canonical IS standards data — single source of truth for the seed.
 *
 * Provenance:
 *  - Conductor max DC resistance @20C: IS 8130:1984/2013 Table 1/2. VALIDATED against the
 *    client's GTP sheets (e.g. 185 Al -> 0.164, 95 Al -> 0.320, 300 Al -> 0.100, 2.5 Cu -> 7.41). ✓
 *  - Conductor min wires: IS 8130 Table 2 (IEC 60228). Material-specific (authoritative).
 *    NOTE: some client sheets hand-enter different strand counts for shaped Al; those are
 *    treated as overrides. Strand convention (IS-strict vs house) is an open item (OI-strands).
 *  - Insulation nominal thickness (XLPE, 1100V): IS 7098-1 Table 5. VALIDATED (16->0.7, 25->0.9,
 *    50->1.0, 70->1.1, 95->1.1, 150->1.4, 185->1.6, 300->1.8, 400->2.0). ✓
 *  - Insulation MIN thickness rule: IS 7098-1 -> min = nominal - (0.1*nominal + 0.1).
 *    VALIDATED (1.60->1.34, 1.10->0.89, 1.80->1.52, 2.00->1.70). ✓
 *  - Inner / outer sheath + armour: IS 7098-1 Tables 6/8 + cl.12, keyed by running diameter.
 */

export type Mat = "CU" | "AL";

// ---------------------------------------------------------------------------
// IS 8130 — conductor max DC resistance @20C (ohm/km), Class 2 stranded
// ---------------------------------------------------------------------------
export const CONDUCTOR_RESISTANCE_20: Record<Mat, Record<number, number>> = {
  CU: {
    1.5: 12.1, 2.5: 7.41, 4: 4.61, 6: 3.08, 10: 1.83, 16: 1.15, 25: 0.727,
    35: 0.524, 50: 0.387, 70: 0.268, 95: 0.193, 120: 0.153, 150: 0.124,
    185: 0.0991, 240: 0.0754, 300: 0.0601, 400: 0.047, 500: 0.0366, 630: 0.0283,
  },
  AL: {
    16: 1.91, 25: 1.2, 35: 0.868, 50: 0.641, 70: 0.443, 95: 0.32, 120: 0.253,
    150: 0.206, 185: 0.164, 240: 0.125, 300: 0.1, 400: 0.0778, 500: 0.0605, 630: 0.0469,
  },
};

// IS 8130 Table 2 — minimum number of wires (Class 2), material-specific.
export const CONDUCTOR_MIN_WIRES: Record<Mat, Record<number, number>> = {
  CU: {
    1.5: 7, 2.5: 7, 4: 7, 6: 7, 10: 7, 16: 7, 25: 7, 35: 7, 50: 19, 70: 19,
    95: 19, 120: 37, 150: 37, 185: 37, 240: 61, 300: 61, 400: 61, 500: 61, 630: 91,
  },
  AL: {
    16: 6, 25: 6, 35: 6, 50: 6, 70: 12, 95: 15, 120: 15, 150: 15, 185: 30,
    240: 30, 300: 30, 400: 53, 500: 53, 630: 53,
  },
};

// ---------------------------------------------------------------------------
// IS 7098-1 Table 5 — XLPE insulation nominal thickness (mm) for 1100V, by area
// ---------------------------------------------------------------------------
export const XLPE_INSULATION_NOMINAL_1100V: Record<number, number> = {
  1.5: 0.7, 2.5: 0.7, 4: 0.7, 6: 0.7, 10: 0.7, 16: 0.7, 25: 0.9, 35: 0.9,
  50: 1.0, 70: 1.1, 95: 1.1, 120: 1.2, 150: 1.4, 185: 1.6, 240: 1.7,
  300: 1.8, 400: 2.0, 500: 2.2, 630: 2.4,
};

/** IS 7098-1 insulation minimum-thickness rule. */
export function insulationMinThickness(nominal: number): number {
  return round2(nominal - (0.1 * nominal + 0.1));
}

// ---------------------------------------------------------------------------
// IS 7098-1:1988 Table 5 — inner-sheath thickness, by CALCULATED diameter over
// laid-up cores (fictitious dia per IS 10462 Part 1). Single-core => no inner sheath.
// Verified against the standard PDF and the client GTP sheets (185→0.5, 300→0.6, 400→0.7).
// band: (diaMin, diaMax]
// ---------------------------------------------------------------------------
export const INNER_SHEATH_BANDS = [
  { diaMin: 0, diaMax: 25, minThickness: 0.3 },
  { diaMin: 25, diaMax: 35, minThickness: 0.4 },
  { diaMin: 35, diaMax: 45, minThickness: 0.5 },
  { diaMin: 45, diaMax: 55, minThickness: 0.6 },
  { diaMin: 55, diaMax: 9999, minThickness: 0.7 },
];

// ---------------------------------------------------------------------------
// IS 7098-1 Table 8 — outer-sheath thickness, by diameter under sheath (mm)
// band: (diaMin, diaMax]  -> nominal / minimum
// min values VALIDATED against client sheets (e.g. under~42 -> 1.88, under~50 -> 2.20)
// ---------------------------------------------------------------------------
export const OUTER_SHEATH_BANDS = [
  { diaMin: 0, diaMax: 15, nominalThickness: 1.8, minThickness: 1.24 },
  { diaMin: 15, diaMax: 25, nominalThickness: 2.0, minThickness: 1.44 },
  { diaMin: 25, diaMax: 35, nominalThickness: 2.2, minThickness: 1.56 },
  { diaMin: 35, diaMax: 40, nominalThickness: 2.4, minThickness: 1.72 },
  { diaMin: 40, diaMax: 45, nominalThickness: 2.6, minThickness: 1.88 },
  { diaMin: 45, diaMax: 50, nominalThickness: 2.8, minThickness: 2.04 },
  { diaMin: 50, diaMax: 55, nominalThickness: 3.0, minThickness: 2.2 },
  { diaMin: 55, diaMax: 60, nominalThickness: 3.2, minThickness: 2.36 },
  { diaMin: 60, diaMax: 65, nominalThickness: 3.4, minThickness: 2.52 },
  { diaMin: 65, diaMax: 70, nominalThickness: 3.6, minThickness: 2.68 },
  { diaMin: 70, diaMax: 75, nominalThickness: 3.8, minThickness: 2.84 },
  { diaMin: 75, diaMax: 9999, nominalThickness: 4.0, minThickness: 3.0 },
];

// ---------------------------------------------------------------------------
// IS 7098-1 Table 6 — armour dimensions, by diameter under armour (mm)
// nominalDim = governing dimension (round-wire dia, or strip thickness; strip width 4.0)
// ---------------------------------------------------------------------------
// IS 7098-1:1988 Table 6 — nominal round-wire diameter by calculated dia under armour.
export const ARMOUR_ROUND_WIRE_BANDS = [
  { diaMin: 0, diaMax: 13, dimension: "1.40", nominalDim: 1.4 },
  { diaMin: 13, diaMax: 25, dimension: "1.40", nominalDim: 1.4 },
  { diaMin: 25, diaMax: 40, dimension: "2.00", nominalDim: 2.0 },
  { diaMin: 40, diaMax: 55, dimension: "2.50", nominalDim: 2.5 },
  { diaMin: 55, diaMax: 70, dimension: "3.15", nominalDim: 3.15 },
  { diaMin: 70, diaMax: 9999, dimension: "4.00", nominalDim: 4.0 },
];

// IS 7098-1:1988 Table 6 — flat strip is 4.0 mm wide; thickness 0.8 up to 40 mm dia, 1.4 above.
export const ARMOUR_FLAT_STRIP_BANDS = [
  { diaMin: 0, diaMax: 40, dimension: "4.00 x 0.80", nominalDim: 0.8 },
  { diaMin: 40, diaMax: 9999, dimension: "4.00 x 1.40", nominalDim: 1.4 },
];

// ===========================================================================
// POLYVION HOUSE PROFILE — the manufacturer's production-sheet deviations from
// strict IS. Selected per-SKU via standardsProfile = "POLYVION_HOUSE".
// ===========================================================================

/**
 * House strand counts (sector Class-2, both materials), derived from the client GTPs:
 *   ≤50→7, 70-150→19, 185-300→37, 400-500→61, >500→91.
 * (Observed: 16/25/50→7, 70/95/150→19, 185/300→37, 400→61.)
 */
export function houseMinWires(area: number): number {
  if (area <= 50) return 7;
  if (area <= 150) return 19;
  if (area <= 300) return 37;
  if (area <= 500) return 61;
  return 91;
}

/** House flat-strip armour: 4.0 × 0.80 for ALL sizes (deviates from IS >40 mm → 1.4). */
export function houseFlatStrip(): { dimension: string; nominalDim: number } {
  return { dimension: "4.00 x 0.80", nominalDim: 0.8 };
}

// ---------------------------------------------------------------------------
// Material physical + descriptive constants
// ---------------------------------------------------------------------------
export const MATERIALS = [
  { code: "CU", name: "Copper", category: "CONDUCTOR", density: 8960, resistivity20: 0.01724, alpha: 0.00393, gtpText: "High Conductivity Electrolytic Grade Annealed Bare Copper Conductor Conf. To IS : 8130/2013" },
  { code: "AL", name: "Aluminium", category: "CONDUCTOR", density: 2700, resistivity20: 0.02826, alpha: 0.00403, gtpText: "EC H2/H4 Grade Aluminium Conductor Conf. To IS : 8130/2013" },
  { code: "XLPE", name: "XLPE", category: "INSULATION", density: 920, resistivity20: null, alpha: null, gtpText: "XLPE Compound Conf. To IS : 7098 (Part-1)" },
  { code: "PVC_TYPE_D", name: "PVC Type-D", category: "INSULATION", density: 1380, resistivity20: null, alpha: null, gtpText: "PVC Type-D As Per IS : 5831/1984" },
  { code: "PVC_ST2", name: "PVC ST-2", category: "SHEATH", density: 1400, resistivity20: null, alpha: null, gtpText: "Extruded PVC TYPE ST - 2 Conf. to IS : 5831/84" },
  { code: "PVC_ST3", name: "PVC ST-3", category: "SHEATH", density: 1400, resistivity20: null, alpha: null, gtpText: "Extruded PVC TYPE ST - 3 Conf. to IS : 5831/84" },
  { code: "GS_STRIP", name: "Galvanised Steel Flat Strip", category: "ARMOUR", density: 7850, resistivity20: null, alpha: null, gtpText: "Galvanised Steel Flat Strip" },
  { code: "GS_WIRE", name: "Galvanised Steel Round Wire", category: "ARMOUR", density: 7850, resistivity20: null, alpha: null, gtpText: "Galvanised Steel Round Wire" },
] as const;

// ---------------------------------------------------------------------------
// FRLS / FRLSH test constants (rendered as GTP rows 38a-d when applicable)
// ---------------------------------------------------------------------------
export const FIRE_TEST_VALUES = {
  oxygenIndexMin: 29, // %
  temperatureIndexMin: 250, // deg C
  smokeDensityMax: 60, // %
  acidGasMax: 20, // % by weight
};

// Temperature ratings driven by insulation type
export const TEMP_RATINGS: Record<string, { normal: number; shortCircuit: number }> = {
  XLPE: { normal: 90, shortCircuit: 250 },
  PVC: { normal: 70, shortCircuit: 160 },
  PVC_TYPE_D: { normal: 70, shortCircuit: 160 },
};

// High-voltage test by voltage grade (kV rms, 5 min)
export const HV_TEST_KV: Record<number, number> = { 1100: 3.0, 650: 2.5 };

// Core identification colours by core count (IS 7098 Table 4, common practice)
export const CORE_COLOURS: Record<string, string> = {
  "1": "Red",
  "2": "Red & Black",
  "3": "Red, Yellow & Blue",
  "3.5": "Red, Yellow, Blue & Black",
  "4": "Red, Yellow, Blue & Black",
  "5": "Red, Yellow, Blue, Black & Grey",
};

export const STANDARD_DRUM_LENGTHS = [
  { areaMax: 120, length: 500 },
  { areaMax: 9999, length: 250 },
];

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
