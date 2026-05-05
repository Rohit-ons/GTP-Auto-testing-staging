import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { approveCable } from "@/app/actions/cables";
import Link from "next/link";
import ExportButton from "@/components/ExportButton";

export default async function CableDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const cable = await prisma.cableModel.findUnique({
    where: { id },
    include: {
      conductorMaterial: true,
      insulationMaterial: true,
      armourMaterial: true,
      outerSheathMaterial: true,
      createdBy: true
    }
  });

  if (!cable) {
    notFound();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>Spec Sheet: <span className="text-gradient">{cable.name}</span></h1>
        <div style={{ display: "flex", gap: "1rem" }}>
          {cable.status === "PENDING" && session?.user && (session.user as any).role !== "ENGINEER" && (
            <form action={approveCable.bind(null, id)}>
              <button type="submit" className="btn btn-primary">Approve Design</button>
            </form>
          )}
          {cable.status === "APPROVED" && (
            <ExportButton cable={cable} label="Export as PDF" variant="primary" />
          )}
          <Link href="/admin/cables" className="btn btn-outline">Back to Dashboard</Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        <div className="glass-card" style={{ padding: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem" }}>Technical Construction</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Conductor Material</span>
              <span style={{ fontWeight: 600 }}>{cable.conductorMaterial.name}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Main Core Area</span>
              <span style={{ fontWeight: 600 }}>{cable.conductorAreaMain} mm²</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Insulation Thickness</span>
              <span style={{ fontWeight: 600 }}>{cable.insulationThicknessMain} mm</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Armour Thickness</span>
              <span style={{ fontWeight: 600 }}>{cable.armourThickness || 0} mm</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Outer Sheath Thickness</span>
              <span style={{ fontWeight: 600 }}>{cable.outerSheathThickness} mm</span>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: "2rem", background: "var(--bg-secondary)" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem", color: "var(--primary)" }}>Computed Parameters</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Overall Diameter</span>
              <span style={{ fontWeight: 600 }}>{cable.computedOverallDiameter} mm</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>DC Resistance @ 20°C</span>
              <span style={{ fontWeight: 600 }}>{cable.computedDcResistance20} Ω/km</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>AC Resistance @ 90°C</span>
              <span style={{ fontWeight: 600 }}>{cable.computedAcResistance90} Ω/km</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Status</span>
              <span style={{ 
                fontSize: "0.875rem", padding: "0.2rem 0.5rem", borderRadius: "4px",
                background: cable.status === "APPROVED" ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)",
                color: cable.status === "APPROVED" ? "var(--accent)" : "var(--warning)"
              }}>
                {cable.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
