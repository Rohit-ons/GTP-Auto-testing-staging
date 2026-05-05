import { getMaterials, createMaterial, deleteMaterial } from "@/app/actions/materials";
import BulkImportMaterials from "@/components/BulkImportMaterials";

export default async function MaterialsAdmin() {
  const materials = await getMaterials();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>Master <span className="text-gradient">Materials</span></h1>
        <BulkImportMaterials />
      </div>

      <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Add New Material</h2>
        <form action={createMaterial} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Name</label>
            <input name="name" required className="input" placeholder="e.g. Copper" />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Category</label>
            <select name="category" required className="input">
              <option value="CONDUCTOR">Conductor</option>
              <option value="INSULATION">Insulation</option>
              <option value="SHEATH">Sheath</option>
              <option value="ARMOUR">Armour</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Density (kg/m³)</label>
            <input name="density" type="number" step="any" className="input" placeholder="8960" />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Resistivity @ 20°C (Ω·mm²/m)</label>
            <input name="resistivity20" type="number" step="any" className="input" placeholder="0.01724" />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Temp Coefficient α</label>
            <input name="alpha" type="number" step="any" className="input" placeholder="0.00393" />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "0.6rem" }}>
              Save Material
            </button>
          </div>
        </form>
      </div>

      <div className="glass-card" style={{ padding: "1.5rem", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
              <th style={{ padding: "1rem 0.5rem" }}>Name</th>
              <th style={{ padding: "1rem 0.5rem" }}>Category</th>
              <th style={{ padding: "1rem 0.5rem" }}>Density</th>
              <th style={{ padding: "1rem 0.5rem" }}>Resistivity</th>
              <th style={{ padding: "1rem 0.5rem" }}>Alpha</th>
              <th style={{ padding: "1rem 0.5rem", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {materials.map(mat => (
              <tr key={mat.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                <td style={{ padding: "1rem 0.5rem", fontWeight: 500 }}>{mat.name}</td>
                <td style={{ padding: "1rem 0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", background: "var(--primary-glow)", borderRadius: "4px" }}>
                    {mat.category}
                  </span>
                </td>
                <td style={{ padding: "1rem 0.5rem", color: "var(--text-secondary)" }}>{mat.density || "-"}</td>
                <td style={{ padding: "1rem 0.5rem", color: "var(--text-secondary)" }}>{mat.resistivity20 || "-"}</td>
                <td style={{ padding: "1rem 0.5rem", color: "var(--text-secondary)" }}>{mat.alpha || "-"}</td>
                <td style={{ padding: "1rem 0.5rem", textAlign: "right" }}>
                  <form action={deleteMaterial.bind(null, mat.id)}>
                    <button type="submit" style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "0.875rem" }}>
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {materials.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                  No materials found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
