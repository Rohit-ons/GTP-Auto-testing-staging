// Calculation Engine

export function calculateConductorDCResistance20(resistivity20: number, area: number) {
  // R20 = (rho / A) * 10^6  where rho in ohm.m, A in mm2.
  // Wait, if resistivity is in Ohm.mm2/m, then R = rho / A (in Ohm/m).
  // R (Ohm/km) = (rho / A) * 1000
  if (area <= 0) return 0;
  return (resistivity20 / area) * 1000;
}

export function calculateConductorACResistance(R20: number, alpha: number, tempC: number) {
  // RT = R20 * (1 + alpha * (T - 20))
  return R20 * (1 + alpha * (tempC - 20));
}

export function calculateApproximateConductorDiameter(area: number) {
  // d = sqrt(4A/pi)
  return Math.sqrt((4 * area) / Math.PI);
}

export function calculateOverallDiameter(
  conductorDia: number,
  insulationThickness: number,
  innerSheathThickness: number = 0,
  armourThickness: number = 0,
  outerSheathThickness: number = 0,
  cores: number = 1
) {
  // Simplified buildup for single core or multi-core.
  // For multi-core, the core assembly diameter is roughly D_core * K (e.g. K=2.15 for 3 core)
  const coreDia = conductorDia + 2 * insulationThickness;
  
  let assemblyDia = coreDia;
  if (cores === 3) assemblyDia = coreDia * 2.154;
  else if (cores === 4) assemblyDia = coreDia * 2.414;
  else if (cores > 1 && cores <= 5) assemblyDia = coreDia * 2.5; // Rough approximation for others

  return assemblyDia + 2 * innerSheathThickness + 2 * armourThickness + 2 * outerSheathThickness;
}

export function calculateShortCircuitRating(kFactor: number, area: number, timeS: number = 1) {
  // I = (K * A) / sqrt(t)
  return (kFactor * area) / Math.sqrt(timeS);
}
