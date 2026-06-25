/**
 * Engine verification — asserts the GTP engine reproduces values taken directly from the
 * client's real GTP sheets (resistance from IS 8130, insulation nominal+min from IS 7098).
 * Run: npm run verify
 */
import { buildGtp } from "../src/lib/engine/gtp";
import type { CableInput } from "../src/lib/engine/types";
import { staticProvider } from "../src/lib/standards/staticProvider";

const std = staticProvider();
let failures = 0;

function rowVal(input: CableInput, rowNo: string): string {
  const sheet = buildGtp(input, std);
  return sheet.rows.find((r) => r.rowNo === rowNo)?.value ?? "<missing>";
}

function assert(name: string, actual: string, mustContain: string[]) {
  const ok = mustContain.every((m) => actual.includes(m));
  console.log(`${ok ? "[PASS]" : "[FAIL]"} ${name}\n    expect contains [${mustContain.join(", ")}]\n    actual = ${actual}`);
  if (!ok) failures++;
}

const base = (over: Partial<CableInput>): CableInput => ({
  voltageGrade: 1100, numberOfCores: 3.5, areaMain: 185, areaNeutral: 95,
  conductorMaterial: "AL", conductorClass: "2", conductorShape: "SHAPED",
  insulationCode: "XLPE", armoured: true, armourType: "FLAT_STRIP",
  innerSheathCode: "PVC_ST2", outerSheathCode: "PVC_ST2", outerSheathGrade: "FRLSH",
  standardEdition: "1988", ...over,
});

console.log("=== GTP Engine Verification (against real client GTP values) ===\n");

// 3.5C x 185/95 Al FRLSH (AL_XLPE_AR .xls col 1)
let i = base({ areaMain: 185, areaNeutral: 95 });
assert("185/95 Al — DC resistance (row 36)", rowVal(i, "36"), ["0.164", "0.320"]);
assert("185/95 Al — insulation Nom/Min (row 17)", rowVal(i, "17"), ["1.60 / 1.34", "1.10 / 0.89"]);
assert("185 Al — temp normal (row 12)", rowVal(i, "12"), ["90"]);

// 3.5C x 300/150 Al FRLSH (col 2)
i = base({ areaMain: 300, areaNeutral: 150 });
assert("300/150 Al — DC resistance (row 36)", rowVal(i, "36"), ["0.100", "0.206"]);
assert("300/150 Al — insulation Nom/Min (row 17)", rowVal(i, "17"), ["1.80 / 1.52", "1.40 / 1.16"]);

// 3.5C x 400/185 Cu (3.5C X 400 2XFY pdf)
i = base({ areaMain: 400, areaNeutral: 185, conductorMaterial: "CU", outerSheathGrade: "PVC_ST2" });
assert("400/185 Cu — DC resistance (row 36)", rowVal(i, "36"), ["0.0470", "0.0991"]);
assert("400/185 Cu — insulation Nom/Min (row 17)", rowVal(i, "17"), ["2.00 / 1.70", "1.60 / 1.34"]);

// Control cable 2C x 2.5 Cu
i = base({ numberOfCores: 2, areaMain: 2.5, areaNeutral: null, conductorMaterial: "CU", conductorShape: "CIRCULAR" });
assert("2.5 Cu — DC resistance (row 36)", rowVal(i, "36"), ["7.41"]);

// FRLSH test rows appear
i = base({});
assert("FRLSH — oxygen index row present (38a)", rowVal(i, "38a"), ["29"]);
assert("FRLSH — smoke density row present (38c)", rowVal(i, "38c"), ["60"]);

// ---- Phase B: bug-fixes + standards profile ----
console.log("\n--- Phase A/B/C/D regression ---");

// B1: a whole-number core cable must NOT show a neutral
i = base({ numberOfCores: 3, areaMain: 185, areaNeutral: 95, outerSheathGrade: "PVC_ST2" });
assert("B1 — 3C size has no neutral (row 9)", rowVal(i, "9"), ["185"]);
if (rowVal(i, "9").includes("N -")) { console.log("[FAIL] B1 — 3C still shows a neutral"); failures++; }
assert("B1 — 3C resistance has no neutral (row 36)", rowVal(i, "36"), ["0.164"]);
if (rowVal(i, "36").includes("N -")) { console.log("[FAIL] B1 — 3C resistance shows a neutral"); failures++; }

// B2: insulation material follows the selected edition
i = base({ numberOfCores: 3, areaNeutral: null, standardEdition: "2025", outerSheathGrade: "PVC_ST2" });
assert("B2 — insulation material follows edition (row 15)", rowVal(i, "15"), ["(Part-1) 2025"]);

// B3: outer-sheath material reflects FRLSH grade
i = base({ numberOfCores: 3, areaNeutral: null, outerSheathGrade: "FRLSH" });
assert("B3 — outer material shows FRLSH (row 28)", rowVal(i, "28"), ["FRLSH"]);

// IS-strict (default): 185 Al strands=30, armour 1.40
i = base({ numberOfCores: 3, areaMain: 185, areaNeutral: null, outerSheathGrade: "PVC_ST2", standardsProfile: "IS_STRICT" });
assert("P1 IS-strict — 185 Al strands = 30 (row 10)", rowVal(i, "10"), ["30"]);
assert("P2 IS-strict — armour 4.00 x 1.40 (row 26)", rowVal(i, "26"), ["1.40"]);

// Polyvion house: 185 Al strands=37, armour 0.80, OD≈42 (matches client 3C×185 sheet)
i = base({ numberOfCores: 3, areaMain: 185, areaNeutral: null, outerSheathGrade: "PVC_ST2", standardsProfile: "POLYVION_HOUSE" });
assert("P1 house — 185 Al strands = 37 (row 10)", rowVal(i, "10"), ["37"]);
assert("P2 house — armour 4.00 x 0.80 (row 26)", rowVal(i, "26"), ["0.80"]);
{
  const od = Number(rowVal(i, "31"));
  const ok = od >= 40 && od <= 44; // client = 42
  console.log(`${ok ? "[PASS]" : "[FAIL]"} F1 house — practical OD ≈ 42 (row 31) → ${od}`);
  if (!ok) failures++;
}

// D/T1: nominal-only insulation display
i = base({ numberOfCores: 3, areaMain: 185, areaNeutral: null, showInsulationMin: false, outerSheathGrade: "PVC_ST2" });
assert("T1 — insulation nominal-only (row 17)", rowVal(i, "17"), ["1.60"]);
if (rowVal(i, "17").includes("/")) { console.log("[FAIL] T1 — nominal-only still shows '/min'"); failures++; }

// ---- Phase F/G/H regression ----
console.log("\n--- Phase F/G/H regression ---");
{
  const sheet = buildGtp(base({ numberOfCores: 3, areaMain: 185, areaNeutral: null, outerSheathGrade: "PVC_ST2" }), std);
  // F: footer present with tolerance note
  const ok1 = sheet.footer.notes.some((n) => n.includes("Variation Tolerance"));
  const ok2 = sheet.footer.notes.some((n) => n.includes("subject to tolerances"));
  const ok3 = sheet.footer.signatory.includes("POLYVION");
  console.log(`${ok1 ? "[PASS]" : "[FAIL]"} F — OD tolerance footer note`);
  console.log(`${ok2 ? "[PASS]" : "[FAIL]"} F — tolerances footer note`);
  console.log(`${ok3 ? "[PASS]" : "[FAIL]"} F — signatory block`);
  if (!ok1) failures++; if (!ok2) failures++; if (!ok3) failures++;
  // G: template key set
  const ok4 = sheet.templateKey === "POWER_XLPE";
  console.log(`${ok4 ? "[PASS]" : "[FAIL]"} G — POWER_XLPE template selected → ${sheet.templateKey}`);
  if (!ok4) failures++;
}
{
  // G: flexible cable selects FLEXIBLE_PVC
  const sheet = buildGtp(base({ numberOfCores: 3, areaMain: 1.5, areaNeutral: null, conductorMaterial: "CU", conductorShape: "FLEXIBLE", conductorClass: "5", insulationCode: "PVC_TYPE_D", armoured: false, outerSheathGrade: "PVC_ST3" }), std);
  const ok = sheet.templateKey === "FLEXIBLE_PVC";
  console.log(`${ok ? "[PASS]" : "[FAIL]"} G — FLEXIBLE_PVC template for Class-5 → ${sheet.templateKey}`);
  if (!ok) failures++;
}

console.log(`\n=== ${failures === 0 ? "ALL VALIDATED ✔" : failures + " FAILURE(S) ✘"} ===`);
process.exit(failures === 0 ? 0 : 1);
