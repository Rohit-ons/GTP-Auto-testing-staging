import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ExportButton from "@/components/ExportButton";
import BulkImportCables from "@/components/BulkImportCables";

export default async function CablesAdmin() {
  const cables = await prisma.cableModel.findMany({
    include: {
      conductorMaterial: true,
      createdBy: true
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>Cable SKUs</h1>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <BulkImportCables />
          <Link href="/design" className="btn btn-primary">
            + New Design
          </Link>
        </div>
      </div>

      <div className="glass-card" style={{ padding: "1.5rem", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
              <th style={{ padding: "1rem 0.5rem" }}>SKU Name</th>
              <th style={{ padding: "1rem 0.5rem" }}>Cores / Area</th>
              <th style={{ padding: "1rem 0.5rem" }}>Material</th>
              <th style={{ padding: "1rem 0.5rem" }}>Status</th>
              <th style={{ padding: "1rem 0.5rem" }}>Created By</th>
              <th style={{ padding: "1rem 0.5rem", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cables.map(cable => (
              <tr key={cable.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                <td style={{ padding: "1rem 0.5rem", fontWeight: 500 }}>{cable.name}</td>
                <td style={{ padding: "1rem 0.5rem", color: "var(--text-secondary)" }}>
                  {cable.numberOfCores}C x {cable.conductorAreaMain}mm²
                </td>
                <td style={{ padding: "1rem 0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", background: "var(--primary-glow)", borderRadius: "4px" }}>
                    {cable.conductorMaterial.name}
                  </span>
                </td>
                <td style={{ padding: "1rem 0.5rem" }}>
                  <span style={{ 
                    fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "4px",
                    background: cable.status === "APPROVED" ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)",
                    color: cable.status === "APPROVED" ? "var(--accent)" : "var(--warning)"
                  }}>
                    {cable.status}
                  </span>
                </td>
                <td style={{ padding: "1rem 0.5rem", color: "var(--text-secondary)" }}>{cable.createdBy?.name || "-"}</td>
                <td style={{ padding: "1rem 0.5rem", textAlign: "right" }}>
                  {cable.status === "APPROVED" && (
                    <ExportButton cable={cable} label="Export" variant="text" />
                  )}
                  <Link href={`/admin/cables/${cable.id}`} style={{ color: "var(--primary)", fontSize: "0.875rem" }}>
                    View Specs
                  </Link>
                </td>
              </tr>
            ))}
            {cables.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                  No cable models designed yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
