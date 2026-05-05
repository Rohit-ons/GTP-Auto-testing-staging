import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 1. Seed Admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cablegen.com' },
    update: {},
    create: {
      email: 'admin@cablegen.com',
      name: 'System Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('Admin user seeded:', admin.email);

  // 2. Seed Materials
  const materials = [
    { name: 'Copper', category: 'CONDUCTOR', density: 8960, resistivity20: 0.01724, alpha: 0.00393 },
    { name: 'Aluminum', category: 'CONDUCTOR', density: 2700, resistivity20: 0.02826, alpha: 0.00431 },
    { name: 'XLPE', category: 'INSULATION', density: 920, resistivity20: null, alpha: null },
    { name: 'PVC ST2', category: 'SHEATH', density: 1380, resistivity20: null, alpha: null },
    { name: 'Galvanized Steel Strip', category: 'ARMOUR', density: 7850, resistivity20: null, alpha: null }
  ];

  for (const mat of materials) {
    await prisma.material.create({
      data: mat
    });
  }
  console.log('Seeded Materials');

  // 3. Seed Standard Rules (Examples from PRD)
  const rules = [
    { standardRef: 'IS 7098', ruleType: 'MIN_BENDING_RADIUS_MULTIPLE', value: 12, description: 'Minimum bending radius is 12x OD' },
    { standardRef: 'IEC/IS', ruleType: 'SC_K_FACTOR_AL', value: 0.094, description: 'Short circuit K factor for Aluminum' },
    { standardRef: 'IEC/IS', ruleType: 'SC_K_FACTOR_CU', value: 0.125, description: 'Short circuit K factor for Copper' },
    { standardRef: 'IS 7098', ruleType: 'MIN_INSULATION_THICKNESS', areaMin: 185, areaMax: 185, value: 1.6, description: 'Min insulation thickness for 185mm2' },
    { standardRef: 'IS 7098', ruleType: 'MIN_INSULATION_THICKNESS', areaMin: 95, areaMax: 95, value: 1.1, description: 'Min insulation thickness for 95mm2' }
  ];

  for (const rule of rules) {
    await prisma.standardRule.create({
      data: rule
    });
  }
  console.log('Seeded Standard Rules');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
