import { prisma } from "@/lib/prisma";
import DesignFormClient from "./DesignFormClient";

export default async function DesignPage() {
  const materials = await prisma.material.findMany();
  
  const conductors = materials.filter(m => m.category === 'CONDUCTOR');
  const insulators = materials.filter(m => m.category === 'INSULATION');
  const sheaths = materials.filter(m => m.category === 'SHEATH');
  const armours = materials.filter(m => m.category === 'ARMOUR');

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>New Cable Design</h1>
      <DesignFormClient 
        conductors={conductors} 
        insulators={insulators} 
        sheaths={sheaths} 
        armours={armours} 
      />
    </div>
  );
}
