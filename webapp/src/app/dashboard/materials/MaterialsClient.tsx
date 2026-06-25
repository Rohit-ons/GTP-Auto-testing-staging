"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMaterial, deleteMaterial } from "@/app/actions/materials";
import BulkImportMaterials from "@/components/BulkImportMaterials";

type MaterialRow = {
  id: string; code: string; name: string; category: string;
  density: number | null; resistivity20: number | null; alpha: number | null;
  gtpText: string | null;
};

const CATEGORIES = ["CONDUCTOR", "INSULATION", "SHEATH", "ARMOUR", "FILLER"];
const CAT_BADGE: Record<string, string> = {
  CONDUCTOR: "badge-primary", INSULATION: "badge-success",
  SHEATH: "badge-violet", ARMOUR: "badge-warning", FILLER: "badge-neutral",
};

export default function MaterialsClient({ materials }: { materials: MaterialRow[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("ALL");
  const [showForm, setShowForm] = useState(false);

  const tabs = ["ALL", ...CATEGORIES];
  const filtered = activeTab === "ALL" ? materials : materials.filter(m => m.category === activeTab);
  const catCounts = CATEGORIES.reduce((acc, c) => { acc[c] = materials.filter(m => m.category === c).length; return acc; }, {} as Record<string, number>);

  return (
    <>
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-header-title">Master <span className="text-gradient">Materials</span></h1>
          <p className="page-header-subtitle">
            Manage conductor, insulation, sheath, and armour material properties
          </p>
        </div>
        <div className="page-header-actions" style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <BulkImportMaterials />
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add Material
          </button>
        </div>
      </div>

      {/* Inline KPI Row */}
      <div className="kpi-inline-row">
        <div className="kpi-inline-item">
          <span className="kpi-inline-value">{materials.length}</span>
          <span className="kpi-inline-label">Total Materials</span>
        </div>
        {CATEGORIES.slice(0, 4).map(c => (
          <div key={c} className="kpi-inline-item">
            <span className="kpi-inline-value" style={{ fontSize: "1rem" }}>{catCounts[c] || 0}</span>
            <span className="kpi-inline-label">{c.charAt(0) + c.slice(1).toLowerCase()}</span>
          </div>
        ))}
      </div>

      {/* Create Material Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Material</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const formData = new FormData(form);
              const data = {
                name: String(formData.get("name") || ""),
                category: String(formData.get("category") || "CONDUCTOR"),
                code: String(formData.get("code") || ""),
                density: formData.get("density") ? parseFloat(String(formData.get("density"))) : undefined,
                resistivity20: formData.get("resistivity20") ? parseFloat(String(formData.get("resistivity20"))) : undefined,
                alpha: formData.get("alpha") ? parseFloat(String(formData.get("alpha"))) : undefined,
              };
              const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
              const originalText = btn.innerHTML;
              btn.innerHTML = '<span class="spinner spinner-sm"></span> Saving...';
              btn.disabled = true;
              
              const res = await createMaterial(data);
              if (res.success) {
                setShowForm(false);
                router.refresh();
              } else {
                alert(res.error || "Failed to create material");
                btn.innerHTML = originalText;
                btn.disabled = false;
              }
            }}>
              <div className="modal-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Code (unique) <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>(Optional)</span></label>
                  <input name="code" className="input" placeholder="e.g. CU, AL, XLPE" />
                  <span className="form-hint">Auto-generated if blank</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Name <span className="text-danger">*</span></label>
                  <input name="name" required className="input" placeholder="e.g. Copper, Aluminium" />
                </div>
                <div className="form-group">
                  <label className="form-label">Category <span className="text-danger">*</span></label>
                  <select name="category" required className="select">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Density (kg/m³) <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>(Optional)</span></label>
                  <input name="density" type="number" step="any" className="input" placeholder="e.g. 8960" />
                </div>
                <div className="form-group">
                  <label className="form-label">Resistivity @ 20°C (Ω·mm²/m) <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>(Optional)</span></label>
                  <input name="resistivity20" type="number" step="any" className="input" placeholder="e.g. 0.01724" />
                </div>
                <div className="form-group">
                  <label className="form-label">Temp Coefficient α <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>(Optional)</span></label>
                  <input name="alpha" type="number" step="any" className="input" placeholder="e.g. 0.00393" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="tabs">
        {tabs.map(t => (
          <button key={t} className={`tab ${activeTab === t ? "tab-active" : ""}`} onClick={() => setActiveTab(t)}>
            {t === "ALL" ? "All" : t.charAt(0) + t.slice(1).toLowerCase()}
            <span className="tab-badge">{t === "ALL" ? materials.length : catCounts[t] || 0}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper" style={{ border: "none" }}>
          <table className="table table-enhanced">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Category</th>
                <th>Density</th>
                <th>Resistivity</th>
                <th>Alpha</th>
                <th>GTP Text</th>
                <th style={{ textAlign: "right", width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(mat => (
                <tr key={mat.id}>
                  <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--primary-700)", fontWeight: 500 }}>{mat.code}</td>
                  <td style={{ fontWeight: 600 }}>{mat.name}</td>
                  <td>
                    <span className={`badge ${CAT_BADGE[mat.category] || "badge-neutral"}`}>
                      {mat.category}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>{mat.density || "—"}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>{mat.resistivity20 || "—"}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>{mat.alpha || "—"}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.75rem", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {mat.gtpText || "—"}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <form action={deleteMaterial.bind(null, mat.id)}>
                      <button type="submit" className="btn btn-danger btn-sm" onClick={(e) => { if (!confirm("Delete this material?")) e.preventDefault(); }}>
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state" style={{ padding: "2rem" }}>
                      <h3 className="empty-state-title">No materials found</h3>
                      <p className="empty-state-description">
                        {activeTab !== "ALL" ? `No ${activeTab.toLowerCase()} materials yet` : "Add your first material to get started"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
