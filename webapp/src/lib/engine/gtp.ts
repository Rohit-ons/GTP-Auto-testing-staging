// GTP sheet builder — produces the canonical 38-row Guaranteed Technical Particulars
// structure (per GTP-TEMPLATE-SPEC.md) from a CableInput + a StandardsProvider.
// Pure: no DB / framework. All standards values arrive via the provider or spec constants.

import {
  CORE_COLOURS,
  FIRE_TEST_VALUES,
  HV_TEST_KV,
  TEMP_RATINGS,
  insulationMinThickness,
} from "../standards/data";
import { buildDiameterChain } from "./geometry";
import { resolveMinWires } from "./profile";
import type { CableInput, GtpFooter, GtpRow, GtpSheet, Overrides, StandardsProvider } from "./types";

/**
 * G — Template consolidation.
 * All observed Polyvion GTPs collapse to ONE conditional template with row toggles.
 *   POWER_XLPE   → 38-row power/control cable (default; conditional on insulation=XLPE)
 *   FLEXIBLE_PVC → flexible PVC-D cable (Class 5/6; no inner-sheath/armour rows)
 * Footer text is IDENTICAL across all variants; only the row visibility changes.
 */
function pickTemplate(input: CableInput): "POWER_XLPE" | "FLEXIBLE_PVC" {
  if (input.conductorClass === "5" || input.conductorClass === "6") return "FLEXIBLE_PVC";
  if (input.insulationCode.toUpperCase().startsWith("PVC_TYPE_D")) return "FLEXIBLE_PVC";
  return "POWER_XLPE";
}

/** Standard Polyvion footer block — same across every observed GTP, derived from sample sheets. */
function buildFooter(input: CableInput, isFire: boolean): GtpFooter {
  const tol = input.odTolerancePct ?? 15; // default: "10 To 15 %"
  const tolText = (input.odTolerancePctLow ?? 10) + " To " + tol + " %";
  return {
    notes: [
      `* OD of cable is calculated and given for reference purpose, actual OD of cable will vary, Variation Tolerance ${tolText}.`,
      "Note:- The values given above are subject to tolerances as per the relevant standards.",
      isFire
        ? `Tests on ${input.outerSheathGrade} sheath shall be carried out as per IS 7098 / IS 10810 (latest amendments).`
        : "",
    ].filter(Boolean),
    signatory: `FOR :- ${input.manufacturer ?? DEFAULT_MANUFACTURER}`.toUpperCase(),
  };
}

const DEFAULT_MANUFACTURER = "M/s POLYVION CABLES PVT. LTD.";
const DEFAULT_BRAND = "POLYCORE";

function hasNeutral(input: CableInput): boolean {
  // A separate (reduced) neutral core exists ONLY for fractional core counts (e.g. 3.5C).
  // A whole-number core cable (1/2/3/4/5C) has no separate neutral — all cores are equal.
  return input.numberOfCores % 1 !== 0 && !!input.areaNeutral;
}

function fmt(n: number | null | undefined, dp = 2): string {
  if (n === null || n === undefined) return "-";
  return n.toFixed(dp);
}

function insulationTypeKey(code: string): "XLPE" | "PVC" {
  return code.toUpperCase().startsWith("XLPE") ? "XLPE" : "PVC";
}

function sheathGradeLabel(grade: string): string {
  switch (grade) {
    case "FRLS": return "FRLS PVC Type ST-2";
    case "FRLSH": return "FRLSH PVC Type ST-2";
    case "PVC_ST3": return "PVC Type ST-3";
    default: return "PVC Type ST-2";
  }
}

function shapeLabel(shape: string): string {
  if (shape === "SHAPED") return "Circular Stranded Sector Shaped";
  if (shape === "FLEXIBLE") return "Circular Flexible";
  return "Circular Stranded Round";
}

function composeDescription(input: CableInput, condName: string, insType: string): string {
  const parts = [
    `${shapeLabel(input.conductorShape)} ${condName} Conductor Class - ${input.conductorClass}`,
    `${insType} Insulated`,
    input.numberOfCores > 1 ? "Inner Sheathed" : null,
    input.armoured ? "Armoured" : "Unarmoured",
    `${sheathGradeLabel(input.outerSheathGrade)} Sheathed Power Cable`,
  ].filter(Boolean);
  return parts.join(", ");
}

export function buildGtp(input: CableInput, std: StandardsProvider, overrides: Overrides = {}): GtpSheet {
  const warnings: string[] = [];
  const neutral = hasNeutral(input);

  const condMat = std.material(input.conductorMaterial);
  const insMat = std.material(input.insulationCode);
  const innerMat = input.innerSheathCode ? std.material(input.innerSheathCode) : null;
  // const outerMat = std.material(input.outerSheathCode);
  const insType = insMat?.name ?? insulationTypeKey(input.insulationCode);
  const tempKey = insulationTypeKey(input.insulationCode);
  const temp = TEMP_RATINGS[input.insulationCode] ?? TEMP_RATINGS[tempKey] ?? TEMP_RATINGS.XLPE;

  // ---- Conductor electricals (strands are profile-aware: IS 8130 vs Polyvion house) ----
  const profile = input.standardsProfile ?? "IS_STRICT";
  const rMain = std.resistance(input.conductorMaterial, input.areaMain);
  const rNeutral = neutral && input.areaNeutral ? std.resistance(input.conductorMaterial, input.areaNeutral) : null;
  const wMain = resolveMinWires(std, input.conductorMaterial, input.areaMain, profile);
  const wNeutral = neutral && input.areaNeutral ? resolveMinWires(std, input.conductorMaterial, input.areaNeutral, profile) : null;
  if (rMain === null) warnings.push(`No IS 8130 resistance for ${input.areaMain}mm² ${input.conductorMaterial}`);

  // ---- Insulation ----
  const insNomMain = std.insulationNominal(tempKey, input.voltageGrade, input.areaMain);
  const insNomNeutral = neutral && input.areaNeutral ? std.insulationNominal(tempKey, input.voltageGrade, input.areaNeutral) : null;
  if (insNomMain === null) warnings.push(`No IS 7098 insulation thickness for ${input.areaMain}mm² @ ${input.voltageGrade}V`);
  const insMinMain = insNomMain !== null ? insulationMinThickness(insNomMain) : null;
  const insMinNeutral = insNomNeutral !== null ? insulationMinThickness(insNomNeutral) : null;

  // ---- Dimensions / build-up (IS 10462 Part 1 fictitious method) ----
  // The chain resolves every protective-covering thickness in a single pass; the GTP
  // rows below read straight from it (no redundant lookups → guaranteed consistency).
  const dims = buildDiameterChain(input, std, insNomMain ?? 0);
  const innerMin = input.numberOfCores > 1 ? dims.innerSheath : null;

  // ---- Misc standard values ----
  const hv = HV_TEST_KV[input.voltageGrade] ?? 3.0;
  const coreColours = CORE_COLOURS[String(input.numberOfCores)] ?? "As per IS 7098";
  const isFire = input.outerSheathGrade === "FRLS" || input.outerSheathGrade === "FRLSH";
  const edition = input.standardEdition ?? "1988";
  const applicableStandards = `IS : 7098 (Part-1) ${edition}, IS : 8130/2013 & This Data Sheet.`;

  const sizeVal = neutral ? `M - ${input.areaMain} & N - ${input.areaNeutral}` : `${input.areaMain}`;
  const strandsVal = neutral ? `M - ${wMain ?? "-"} & N - ${wNeutral ?? "-"}` : `${wMain ?? "-"}`;
  const resVal = neutral
    ? `M - ${fmt(rMain, 4)} & N - ${fmt(rNeutral, 4)}`
    : `${fmt(rMain, 4)}`;
  // Row 17 display style: "Nom. / Min." (default) or "Nom." only (T1, per client template)
  const showMin = input.showInsulationMin !== false;
  const insThkLabel = showMin ? "Thickness (Nom. / Min.)" : "Thickness (Nom.)";
  const insThkVal = showMin
    ? (neutral
        ? `M - ${fmt(insNomMain)} / ${fmt(insMinMain)} & N - ${fmt(insNomNeutral)} / ${fmt(insMinNeutral)}`
        : `${fmt(insNomMain)} / ${fmt(insMinMain)}`)
    : (neutral
        ? `M - ${fmt(insNomMain)} & N - ${fmt(insNomNeutral)}`
        : `${fmt(insNomMain)}`);

  const resolvers: Record<string, () => string | null> = {
    "general.cableType": () => composeDescription(input, condMat?.name ?? input.conductorMaterial, insType),
    "general.manufacturer": () => input.manufacturer ?? DEFAULT_MANUFACTURER,
    "general.brand": () => input.brand ?? DEFAULT_BRAND,
    "general.standards": () => applicableStandards,
    "general.voltageGrade": () => `${input.voltageGrade} Volt`,
    "general.cores": () => `${input.numberOfCores} Core`,
    "conductor.material": () => condMat?.gtpText ?? condMat?.name ?? input.conductorMaterial,
    "conductor.size": () => sizeVal,
    "conductor.strands": () => strandsVal,
    "conductor.shape": () => `${shapeLabel(input.conductorShape)} ${condMat?.name ?? ""} Conductor Class - ${input.conductorClass}`.trim(),
    "conductor.tempNormal": () => `${temp.normal}°C`,
    "conductor.tempSc": () => `${temp.shortCircuit}°C`,
    "insulation.material": () => insMat?.gtpText ?? insMat?.name ?? input.insulationCode,
    "insulation.type": () => `Extruded ${insType}`,
    "insulation.thickness": () => insThkVal,
    "insulation.coreId": () => coreColours,
    "innerSheath.material": () => innerMat?.gtpText ?? "Extruded PVC TYPE ST - 2 Conf. to IS : 5831/84",
    "innerSheath.type": () => "Extruded PVC",
    "innerSheath.thickness": () => innerMin !== null && innerMin !== undefined ? fmt(innerMin) : "N/A",
    "innerSheath.colour": () => "Black",
    "armour.material": () => input.armoured ? (input.armourType === "ROUND_WIRE" ? "Galvanised Steel Round Wire" : "Galvanised Steel Flat Strip") : "N/A",
    "armour.dimension": () => (input.armoured && dims.armourDim > 0) ? `${dims.armourLabel}${input.armourType === "ROUND_WIRE" ? " ± 0.040" : " ±10%"}` : "N/A",
    "outerSheath.material": () => `Extruded ${sheathGradeLabel(input.outerSheathGrade)} Conf. to IS : 5831/84`,
    "outerSheath.type": () => `Extruded ${input.outerSheathGrade === "FRLS" ? "FRLS PVC" : input.outerSheathGrade === "FRLSH" ? "FRLSH PVC" : "PVC"}`,
    "outerSheath.thickness": () => dims.outerMin ? fmt(dims.outerMin) : "-",
    "outerSheath.od": () => `${dims.practicalOverallDiameter}`,
    "outerSheath.colour": () => input.outerSheathColour ?? "Black",
    "outerSheath.printing": () => `Manufacturer's name, Year of manufacture, Voltage Grade and Size of cable${isFire ? " " + input.outerSheathGrade : ""} Sequential Length Marking shall be printed on outer sheath at every 1 mtr interval.`,
    "outerSheath.drumLength": () => `${input.drumLength ?? (input.areaMain <= 120 ? 500 : 250)} Mtrs. ±5% Tolerance`,
    "electrical.dcResistance": () => resVal,
    "electrical.hvTest": () => `${fmt(hv, 1)} kV (rms) for 5 minutes Core to Core / Armour`,
    "fire.oxygenIndex": () => isFire ? `${FIRE_TEST_VALUES.oxygenIndexMin}` : null,
    "fire.tempIndex": () => isFire ? `${FIRE_TEST_VALUES.temperatureIndexMin}` : null,
    "fire.smokeDensity": () => isFire ? `${FIRE_TEST_VALUES.smokeDensityMax}` : null,
    "fire.acidGas": () => isFire ? `${FIRE_TEST_VALUES.acidGasMax} (By Weight)` : null,
    "tests.flammability": () => "Period of burning after removal of flame max (60 Sec.), Unaffected Portion of cable min (50 mm)",
  };

  const rows: GtpRow[] = [];
  const push = (r: GtpRow) => rows.push(r);
  let currentSection = "";

  for (const def of std.registry) {
    const valFn = resolvers[def.key];
    const val = valFn ? valFn() : null;

    if (val === null) continue;

    if (def.section !== currentSection) {
      currentSection = def.section;
      const sectionRowNo = def.rowNo ? String(parseInt(def.rowNo.replace(/[a-z]/i, ""), 10) - 1) : "";
      let sectionLabel = def.section;
      if (def.section === "FRLS_TESTS") sectionLabel = `TESTS ON ${input.outerSheathGrade}`;
      else if (def.section === "ELECTRICAL") sectionLabel = "ELECTRICAL PARAMETERS";
      else sectionLabel = def.section.replace(/_/g, " ");

      push({ rowNo: sectionRowNo, section: sectionLabel, label: sectionLabel, value: "", bucket: "MASTER_CONST" as Bucket });
    }

    let finalLabel = def.label;
    if (def.key === "insulation.thickness") finalLabel = insThkLabel;

    push({
      rowNo: def.rowNo || "",
      label: finalLabel,
      unit: def.unit || undefined,
      value: val,
      bucket: (def.bucket as Bucket) || "MASTER_CONST",
      source: def.standardRef || undefined,
    });
  }

  // ---- Apply user overrides (audited at the action layer) ----
  for (const r of rows) {
    if (r.section) continue;
    const ov = overrides[r.rowNo];
    if (ov && ov.value !== undefined && ov.value !== "" && ov.value !== r.value) {
      r.standardValue = r.value;
      r.value = ov.value;
      r.overridden = true;
      r.overrideReason = ov.reason;
      warnings.push(`Row ${r.rowNo} (${r.label}) overridden: ${r.standardValue} → ${ov.value}${ov.reason ? ` (${ov.reason})` : ""}`);
    }
  }

  return {
    header: {
      manufacturer: input.manufacturer ?? DEFAULT_MANUFACTURER,
      brand: input.brand ?? DEFAULT_BRAND,
      title: `GUARANTEED TECHNICAL PARTICULARS (${condMat?.name ?? ""} ${insType} ${input.armoured ? "ARMOURED" : "UNARMOURED"} ${isFire ? input.outerSheathGrade + " " : ""}POWER CABLE)`.replace(/\s+/g, " ").trim(),
      description: `${input.voltageGrade} VOLTAGE GRADE ${composeDescription(input, (condMat?.name ?? input.conductorMaterial).toUpperCase(), insType).toUpperCase()} CONFIRMING TO ${applicableStandards}`,
      customer: input.customer,
      project: input.project,
      applicableStandards,
    },
    rows,
    dims,
    warnings,
    footer: buildFooter(input, isFire),
    templateKey: pickTemplate(input),
  };
}
