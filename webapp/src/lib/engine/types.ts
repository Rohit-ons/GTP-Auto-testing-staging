// Engine domain types. Pure — no DB / framework imports.

export type ConductorMaterial = "CU" | "AL";
export type ConductorShape = "CIRCULAR" | "SHAPED" | "FLEXIBLE";
export type ArmourType = "ROUND_WIRE" | "FLAT_STRIP";
export type OuterSheathGrade = "PVC_ST2" | "PVC_ST3" | "FRLS" | "FRLSH";

/**
 * Which value set the engine treats as authoritative.
 *  - IS_STRICT      : literal IS 8130 / IS 7098 values (strands, armour) — default.
 *  - POLYVION_HOUSE : the manufacturer's production-sheet values (sector-Al strands,
 *                     4.0×0.80 strip everywhere). Reproduces the client's GTPs 1:1.
 */
export type StandardsProfile = "IS_STRICT" | "POLYVION_HOUSE";

/** The user-tweakable inputs (Bucket A) for one cable SKU. */
export interface CableInput {
  voltageGrade: number; // V, e.g. 1100
  numberOfCores: number; // 1, 2, 3, 3.5, 4, 5, 7, ...
  areaMain: number; // mm^2
  areaNeutral?: number | null; // mm^2 (3.5C / reduced neutral)
  conductorMaterial: ConductorMaterial;
  conductorClass: string; // "1" | "2" | "5" | "6"
  conductorShape: ConductorShape;
  insulationCode: string; // material code, e.g. "XLPE" | "PVC_TYPE_D"
  armoured: boolean;
  armourType?: ArmourType | null;
  innerSheathCode?: string | null;
  outerSheathCode: string; // sheath material code, e.g. "PVC_ST2"
  outerSheathGrade: OuterSheathGrade;
  outerSheathColour?: string;
  drumLength?: number | null;
  standardEdition?: string; // "1988" | "2025"
  standardsProfile?: StandardsProfile; // default IS_STRICT
  showInsulationMin?: boolean; // GTP row 17: true => "Nom. / Min.", false => "Nom." only
  odTolerancePctLow?: number; // footer note lower bound (default 10)
  odTolerancePct?: number;    // footer note upper bound (default 15)
  customer?: string | null;
  project?: string | null;
  brand?: string;
  manufacturer?: string;
}

export interface MaterialInfo {
  code: string;
  name: string;
  category: string;
  density?: number | null;
  resistivity20?: number | null;
  alpha?: number | null;
  gtpText?: string | null;
}

/** Synchronous standards lookups. Implemented from DB (versioned) or static data. */
export interface StandardsProvider {
  resistance(material: ConductorMaterial, area: number): number | null;
  minWires(material: ConductorMaterial, area: number): number | null;
  insulationNominal(type: string, voltage: number, area: number): number | null;
  innerSheathMin(dia: number): number | null;
  outerSheath(dia: number): { nominal: number; min: number } | null;
  armour(type: ArmourType, dia: number): { dimension: string; nominalDim: number } | null;
  material(code: string): MaterialInfo | null;
  registry: { key: string; rowNo: string | null; label: string; unit: string | null; section: string; bucket: string; standardRef: string | null; formulaKey: string | null; isActive: boolean }[];
}

/**
 * IS 10462 Part 1 fictitious diameter chain (mm) + the protective-covering thicknesses
 * resolved at each stage. Diameters are FICTITIOUS (standardised) values used to key the
 * IS 7098 thickness tables — not the actual physical OD (IS 10462 cl.0.4).
 */
export interface DiameterChain {
  conductorDia: number; // dL  — fictitious conductor diameter (IS 10462 Table 1)
  coreDia: number; // DC1 — fictitious core diameter (cl.3.2)
  assemblyDia: number; // Df  — fictitious diameter over laid-up cores (cl.3.3)
  diaOverInnerSheath: number; // Da  — over inner sheath (cl.3.4)
  diaUnderArmour: number; // Da  — under armour
  diaOverArmour: number; // Dx  — over armour (cl.3.5)
  diaUnderOuterSheath: number; // Dx
  overallDiameter: number; // fictitious reference OD = Dx + 2·outer-nominal (IS 10462)
  practicalOverallDiameter: number; // realistic OD (actual compacted build-up) — shown on GTP

  // Resolved thicknesses (single source of truth for the GTP rows)
  innerSheath: number; // tg — IS 7098 Table 5
  armourDim: number; // tA — IS 7098 Table 6 (wire dia / strip thickness)
  armourLabel: string; // human label e.g. "4.00 x 1.40"
  outerNominal: number; // IS 7098 Table 8 col 3
  outerMin: number; // IS 7098 Table 8 col 4 (the GTP "Thickness (Min.)")
}

export type Bucket = "INPUT" | "CALCULATED" | "MASTER_STD" | "MASTER_CONST";

export interface GtpRow {
  rowNo: string;
  section?: string; // section header marker
  label: string;
  unit?: string;
  value: string;
  bucket: Bucket;
  source?: string; // IS clause / formula reference
  overridden?: boolean; // value replaced by a user override
  standardValue?: string; // the original standard/computed value, when overridden
  overrideReason?: string;
}

/** User overrides keyed by GTP row number, e.g. { "30": { value: "1.88", reason: "Customer spec" } }. */
export type Overrides = Record<string, { value: string; reason?: string }>;

export interface GtpFooter {
  /** Bullet/notes that appear at the bottom of every Polyvion GTP sheet. */
  notes: string[];
  /** Right-aligned signatory block, e.g. "FOR :- M/S - POLYVION CABLES PVT. LTD." */
  signatory: string;
}

export interface GtpSheet {
  header: {
    manufacturer: string;
    brand: string;
    title: string;
    description: string;
    customer?: string | null;
    project?: string | null;
    applicableStandards: string;
  };
  rows: GtpRow[];
  dims: DiameterChain;
  warnings: string[];
  footer: GtpFooter;
  /** Which conditional template emitted this sheet (G — template consolidation). */
  templateKey: "POWER_XLPE" | "FLEXIBLE_PVC";
}
