import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as D from "../src/lib/standards/data";

const prisma = new PrismaClient();

async function seedUsers() {
  const pwd = await bcrypt.hash("admin123", 10);
  const users = [
    { email: "admin@cablegen.com", name: "System Admin", role: "ADMIN" },
    { email: "engineer@cablegen.com", name: "Design Engineer", role: "ENGINEER" },
    { email: "sales@cablegen.com", name: "Sales User", role: "SALES" },
    { email: "approver@cablegen.com", name: "Approver", role: "APPROVER" },
    { email: "costing@cablegen.com", name: "Costing Manager", role: "COSTING" },
    { email: "management@cablegen.com", name: "Management User", role: "MANAGEMENT" },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, name: u.name },
      create: { ...u, password: pwd },
    });
  }
  console.log(`✔ Users: ${users.length} (password: admin123)`);
}

async function seedMaterials() {
  for (const m of D.MATERIALS) {
    await prisma.material.upsert({
      where: { code: m.code },
      update: { name: m.name, category: m.category, density: m.density, resistivity20: m.resistivity20, alpha: m.alpha, gtpText: m.gtpText },
      create: { code: m.code, name: m.name, category: m.category, density: m.density, resistivity20: m.resistivity20, alpha: m.alpha, gtpText: m.gtpText },
    });
  }
  console.log(`✔ Materials: ${D.MATERIALS.length}`);
}

async function seedStandards() {
  const is8130 = await prisma.standard.upsert({
    where: { code_edition: { code: "IS 8130", edition: "2013" } },
    update: {},
    create: { code: "IS 8130", edition: "2013", title: "Conductors for insulated electric cables and flexible cords" },
  });

  const editions = ["1988", "2025"];
  const is7098ByEdition: Record<string, string> = {};
  for (const ed of editions) {
    const s = await prisma.standard.upsert({
      where: { code_edition: { code: "IS 7098-1", edition: ed } },
      update: {},
      create: { code: "IS 7098-1", edition: ed, title: `XLPE insulated PVC sheathed cables up to 1100V (${ed})` },
    });
    is7098ByEdition[ed] = s.id;
  }

  // ---- Conductor specs (IS 8130 Table 2): resistance + min wires ----
  await prisma.conductorSpec.deleteMany({ where: { standardId: is8130.id } });
  const conductorRows: Parameters<typeof prisma.conductorSpec.create>[0]["data"][] = [];
  for (const mat of ["CU", "AL"] as const) {
    for (const [areaStr, res] of Object.entries(D.CONDUCTOR_RESISTANCE_20[mat])) {
      const area = Number(areaStr);
      const wires = D.CONDUCTOR_MIN_WIRES[mat][area] ?? 7;
      conductorRows.push({
        standardId: is8130.id, material: mat, conductorClass: "2", shape: "CIRCULAR",
        area, minWires: wires, maxResistance20: res,
      });
    }
  }
  await prisma.$transaction(conductorRows.map((d) => prisma.conductorSpec.create({ data: d })));

  // ---- IS 7098 spec tables, replicated for each edition ----
  for (const ed of editions) {
    const sid = is7098ByEdition[ed];
    await prisma.insulationSpec.deleteMany({ where: { standardId: sid } });
    await prisma.innerSheathSpec.deleteMany({ where: { standardId: sid } });
    await prisma.outerSheathSpec.deleteMany({ where: { standardId: sid } });
    await prisma.armourSpec.deleteMany({ where: { standardId: sid } });

    await prisma.$transaction(
      Object.entries(D.XLPE_INSULATION_NOMINAL_1100V).map(([a, t]) =>
        prisma.insulationSpec.create({
          data: { standardId: sid, insulationType: "XLPE", voltage: 1100, areaMin: Number(a), areaMax: Number(a), nominalThickness: t },
        }),
      ),
    );
    await prisma.$transaction(
      D.INNER_SHEATH_BANDS.map((b) =>
        prisma.innerSheathSpec.create({ data: { standardId: sid, diaMin: b.diaMin, diaMax: b.diaMax, minThickness: b.minThickness } }),
      ),
    );
    await prisma.$transaction(
      D.OUTER_SHEATH_BANDS.map((b) =>
        prisma.outerSheathSpec.create({ data: { standardId: sid, diaMin: b.diaMin, diaMax: b.diaMax, nominalThickness: b.nominalThickness, minThickness: b.minThickness } }),
      ),
    );
    await prisma.$transaction([
      ...D.ARMOUR_ROUND_WIRE_BANDS.map((b) =>
        prisma.armourSpec.create({ data: { standardId: sid, armourType: "ROUND_WIRE", diaMin: b.diaMin, diaMax: b.diaMax, dimension: b.dimension, nominalDim: b.nominalDim } }),
      ),
      ...D.ARMOUR_FLAT_STRIP_BANDS.map((b) =>
        prisma.armourSpec.create({ data: { standardId: sid, armourType: "FLAT_STRIP", diaMin: b.diaMin, diaMax: b.diaMax, dimension: b.dimension, nominalDim: b.nominalDim } }),
      ),
    ]);
  }
  console.log(`✔ Standards: IS 8130 (${conductorRows.length} conductor specs) + IS 7098-1 editions ${editions.join(", ")}`);
}

// ---- Parameter Registry (D1): the 38 canonical GTP rows ----
const REGISTRY: Array<{ key: string; rowNo: string; label: string; unit?: string; section: string; bucket: string; standardRef?: string; formulaKey?: string }> = [
  { key: "general.cableType", rowNo: "1", label: "Cable Type", section: "GENERAL", bucket: "CALCULATED", formulaKey: "composeDescription" },
  { key: "general.manufacturer", rowNo: "2", label: "Name of the Manufacturer", section: "GENERAL", bucket: "MASTER_CONST" },
  { key: "general.brand", rowNo: "3", label: "Brand Name", section: "GENERAL", bucket: "MASTER_CONST" },
  { key: "general.standards", rowNo: "4", label: "Applicable Standards", section: "GENERAL", bucket: "MASTER_STD", standardRef: "IS 7098-1 / IS 8130" },
  { key: "general.voltageGrade", rowNo: "5", label: "Voltage Grade", unit: "Volts", section: "GENERAL", bucket: "INPUT" },
  { key: "general.cores", rowNo: "6", label: "No. of Cores", unit: "Nos.", section: "GENERAL", bucket: "INPUT" },
  { key: "conductor.material", rowNo: "8", label: "Material", section: "CONDUCTOR", bucket: "INPUT" },
  { key: "conductor.size", rowNo: "9", label: "Size", unit: "Sq.mm", section: "CONDUCTOR", bucket: "INPUT" },
  { key: "conductor.strands", rowNo: "10", label: "No. of Strands", unit: "Nos.", section: "CONDUCTOR", bucket: "MASTER_STD", standardRef: "IS 8130 Table 2", formulaKey: "minWires" },
  { key: "conductor.shape", rowNo: "11", label: "Shape of Conductor", section: "CONDUCTOR", bucket: "INPUT" },
  { key: "conductor.tempNormal", rowNo: "12", label: "Temperature Rise on Normal Condition", unit: "Deg. C", section: "CONDUCTOR", bucket: "MASTER_STD" },
  { key: "conductor.tempSc", rowNo: "13", label: "Temperature Rise on Short Circuit Condition", unit: "Deg. C", section: "CONDUCTOR", bucket: "MASTER_STD" },
  { key: "insulation.material", rowNo: "15", label: "Material", section: "INSULATION", bucket: "INPUT" },
  { key: "insulation.type", rowNo: "16", label: "Type", section: "INSULATION", bucket: "CALCULATED" },
  { key: "insulation.thickness", rowNo: "17", label: "Thickness (Nom. / Min.)", unit: "mm", section: "INSULATION", bucket: "MASTER_STD", standardRef: "IS 7098 Table 5", formulaKey: "insulationNominal+minRule" },
  { key: "insulation.coreId", rowNo: "18", label: "Core Identification", section: "INSULATION", bucket: "MASTER_STD", standardRef: "IS 7098 Table 4" },
  { key: "innerSheath.material", rowNo: "20", label: "Materials", section: "INNER_SHEATH", bucket: "INPUT" },
  { key: "innerSheath.type", rowNo: "21", label: "Type", section: "INNER_SHEATH", bucket: "CALCULATED" },
  { key: "innerSheath.thickness", rowNo: "22", label: "Thickness (Min.)", unit: "mm", section: "INNER_SHEATH", bucket: "MASTER_STD", standardRef: "IS 7098 cl.12", formulaKey: "innerSheathMin" },
  { key: "innerSheath.colour", rowNo: "23", label: "Colour", section: "INNER_SHEATH", bucket: "MASTER_CONST" },
  { key: "armour.material", rowNo: "25", label: "Material", section: "ARMOURING", bucket: "INPUT" },
  { key: "armour.dimension", rowNo: "26", label: "Dimension", unit: "mm", section: "ARMOURING", bucket: "MASTER_STD", standardRef: "IS 7098 Table 6", formulaKey: "armour" },
  { key: "outerSheath.material", rowNo: "28", label: "Material", section: "OUTER_SHEATH", bucket: "INPUT" },
  { key: "outerSheath.type", rowNo: "29", label: "Type", section: "OUTER_SHEATH", bucket: "CALCULATED" },
  { key: "outerSheath.thickness", rowNo: "30", label: "Thickness (Min.)", unit: "mm", section: "OUTER_SHEATH", bucket: "MASTER_STD", standardRef: "IS 7098 Table 8", formulaKey: "outerSheath" },
  { key: "outerSheath.od", rowNo: "31", label: "Overall Diameter of Cable *", unit: "mm", section: "OUTER_SHEATH", bucket: "CALCULATED", formulaKey: "buildDiameterChain" },
  { key: "outerSheath.colour", rowNo: "32", label: "Colour Of Outer Sheath", section: "OUTER_SHEATH", bucket: "INPUT" },
  { key: "outerSheath.printing", rowNo: "33", label: "Printing On Outer Sheath", section: "OUTER_SHEATH", bucket: "MASTER_CONST" },
  { key: "outerSheath.drumLength", rowNo: "34", label: "Standard Drum Length", unit: "meter", section: "OUTER_SHEATH", bucket: "INPUT" },
  { key: "electrical.dcResistance", rowNo: "36", label: "Max. DC resistance of conductor of completed cable at 20°C", unit: "ohm / km", section: "ELECTRICAL", bucket: "MASTER_STD", standardRef: "IS 8130 Table 2", formulaKey: "resistance" },
  { key: "electrical.hvTest", rowNo: "37", label: "High Voltage Test", unit: "kV rms", section: "ELECTRICAL", bucket: "MASTER_STD" },
  { key: "fire.oxygenIndex", rowNo: "38a", label: "Oxygen Index Test (Min.)", unit: "%", section: "FRLS_TESTS", bucket: "MASTER_STD" },
  { key: "fire.tempIndex", rowNo: "38b", label: "Temperature Index Test (Min.)", unit: "Deg. C", section: "FRLS_TESTS", bucket: "MASTER_STD" },
  { key: "fire.smokeDensity", rowNo: "38c", label: "Smoke Density Rating (Max.)", unit: "%", section: "FRLS_TESTS", bucket: "MASTER_STD" },
  { key: "fire.acidGas", rowNo: "38d", label: "Acid Gas Emission (Max.)", unit: "%", section: "FRLS_TESTS", bucket: "MASTER_STD" },
  { key: "tests.flammability", rowNo: "39", label: "Flammability Test As Per IS : 10810 (Part-53)", unit: "Sec / mm", section: "GENERAL", bucket: "MASTER_CONST" },
];

async function seedRegistry() {
  for (let i = 0; i < REGISTRY.length; i++) {
    const p = REGISTRY[i];
    await prisma.parameterDefinition.upsert({
      where: { key: p.key },
      update: { rowNo: p.rowNo, label: p.label, unit: p.unit, section: p.section, bucket: p.bucket, standardRef: p.standardRef, formulaKey: p.formulaKey, ordering: i },
      create: { key: p.key, rowNo: p.rowNo, label: p.label, unit: p.unit, section: p.section, bucket: p.bucket, standardRef: p.standardRef, formulaKey: p.formulaKey, ordering: i },
    });
  }
  console.log(`✔ Parameter Registry: ${REGISTRY.length} definitions`);
}

async function main() {
  console.log("Seeding…");
  await seedUsers();
  await seedMaterials();
  await seedStandards();
  await seedRegistry();
  console.log("Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
