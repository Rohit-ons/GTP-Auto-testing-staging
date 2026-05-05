import { prisma } from "../prisma";

export async function validateCableModel(params: {
  conductorArea: number;
  insulationThickness: number;
  overallDiameter: number;
}) {
  const violations: string[] = [];
  
  const rules = await prisma.standardRule.findMany();

  // 1. Check Insulation Thickness Rules
  const insulationRule = rules.find(r => 
    r.ruleType === "MIN_INSULATION_THICKNESS" && 
    (r.areaMin === null || params.conductorArea >= r.areaMin) &&
    (r.areaMax === null || params.conductorArea <= r.areaMax)
  );

  if (insulationRule && params.insulationThickness < insulationRule.value) {
    violations.push(`Insulation thickness (${params.insulationThickness}mm) is below minimum required (${insulationRule.value}mm) for ${params.conductorArea}mm² as per ${insulationRule.standardRef}`);
  }

  // 2. Return min bending radius
  const bendingRule = rules.find(r => r.ruleType === "MIN_BENDING_RADIUS_MULTIPLE");
  const minBendingRadius = bendingRule ? bendingRule.value * params.overallDiameter : 12 * params.overallDiameter;

  return {
    isValid: violations.length === 0,
    violations,
    suggestions: {
      minBendingRadius
    }
  };
}
