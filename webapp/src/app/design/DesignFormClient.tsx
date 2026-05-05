"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createCable } from "@/app/actions/cables";
import { 
  calculateConductorDCResistance20, 
  calculateConductorACResistance, 
  calculateApproximateConductorDiameter, 
  calculateOverallDiameter, 
  calculateShortCircuitRating 
} from "@/lib/engines/calculation";

export default function DesignFormClient({ conductors, insulators, sheaths, armours }: any) {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cores, setCores] = useState(3);
  const [area, setArea] = useState(185);
  const [conductorMat, setConductorMat] = useState(conductors[0]?.id);
  const [insulationThk, setInsulationThk] = useState(1.6);
  const [innerSheathThk, setInnerSheathThk] = useState(0.5);
  const [outerSheathThk, setOuterSheathThk] = useState(1.88);
  const [armourThk, setArmourThk] = useState(0.8);

  // Derived Calculations
  const calculations = useMemo(() => {
    const material = conductors.find((c: any) => c.id === conductorMat);
    if (!material) return null;

    const condDia = calculateApproximateConductorDiameter(area);
    const overallDia = calculateOverallDiameter(condDia, insulationThk, innerSheathThk, armourThk, outerSheathThk, cores);
    const r20 = calculateConductorDCResistance20(material.resistivity20 || 0, area);
    const r90 = calculateConductorACResistance(r20, material.alpha || 0, 90);
    const scRating = calculateShortCircuitRating(material.name.toLowerCase() === 'aluminum' ? 0.094 : 0.125, area, 1);

    return {
      condDia: condDia.toFixed(2),
      overallDia: overallDia.toFixed(2),
      r20: r20.toFixed(4),
      r90: r90.toFixed(4),
      scRating: scRating.toFixed(2),
    };
  }, [cores, area, conductorMat, insulationThk, innerSheathThk, outerSheathThk, armourThk, conductors]);

  const handleExportPDF = async () => {
    if (!calculations) return;
    setIsExporting(true);
    try {
      const material = conductors.find((c: any) => c.id === conductorMat);
      const res = await fetch("/api/export", {
        method: "POST",
        body: JSON.stringify({
          cores, area, conductorName: material?.name,
          insulationThk, innerSheathThk, outerSheathThk, armourThk,
          ...calculations
        })
      });
      if (!res.ok) throw new Error("Export failed");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Datasheet_${cores}Cx${area}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSubmit = async () => {
    if (!calculations) return;
    setIsSubmitting(true);
    try {
      const material = conductors.find((c: any) => c.id === conductorMat);
      const res = await createCable({
        cores,
        area,
        conductorMaterialId: conductorMat,
        conductorName: material?.name,
        insulationMaterialId: insulators[0]?.id, // Default to first for MVP
        insulationThk,
        innerSheathThk,
        armourThk,
        outerSheathThk,
        outerSheathMaterialId: sheaths[0]?.id, // Default to first for MVP
        ...calculations
      });

      if (res.success) {
        alert("Cable design submitted for approval!");
        router.push("/admin/cables");
      } else {
        if (res.error === "Unauthorized") {
          alert("Please sign in to submit designs.");
          router.push("/api/auth/signin");
        } else {
          alert("Error: " + res.error);
        }
      }
    } catch (err) {
      alert("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "2rem" }}>
      {/* Form Input Side */}
      <div className="glass-card" style={{ padding: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem" }}>Parameters</h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Number of Cores</label>
            <input type="number" step="0.5" className="input" value={cores} onChange={e => setCores(Number(e.target.value))} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Conductor Area (mm²)</label>
            <input type="number" className="input" value={area} onChange={e => setArea(Number(e.target.value))} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Conductor Material</label>
            <select className="input" value={conductorMat} onChange={e => setConductorMat(e.target.value)}>
              {conductors.length > 0 ? (
                conductors.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)
              ) : (
                <option value="">No conductors available</option>
              )}
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Insulation Thickness (mm)</label>
            <input type="number" step="0.1" className="input" value={insulationThk} onChange={e => setInsulationThk(Number(e.target.value))} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Inner Sheath Thk (mm)</label>
            <input type="number" step="0.1" className="input" value={innerSheathThk} onChange={e => setInnerSheathThk(Number(e.target.value))} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Armour Thk (mm)</label>
            <input type="number" step="0.1" className="input" value={armourThk} onChange={e => setArmourThk(Number(e.target.value))} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Outer Sheath Thk (mm)</label>
            <input type="number" step="0.1" className="input" value={outerSheathThk} onChange={e => setOuterSheathThk(Number(e.target.value))} />
          </div>
        </div>

        <div style={{ marginTop: "2rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem", display: "flex", gap: "1rem" }}>
          <button onClick={handleSubmit} disabled={isSubmitting} className="btn btn-primary" style={{ flex: 1, padding: "1rem" }}>
            {isSubmitting ? "Submitting..." : "Submit for Approval"}
          </button>
          <button onClick={handleExportPDF} disabled={isExporting} className="btn btn-outline" style={{ flex: 1, padding: "1rem" }}>
            {isExporting ? "Generating..." : "Export PDF"}
          </button>
        </div>
      </div>

      {/* Live Calculation Results */}
      <div className="glass-card" style={{ padding: "2rem", background: "var(--bg-secondary)" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem", color: "var(--primary)" }}>Live Results</h2>
        {calculations && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Conductor Dia (approx)</span>
              <span style={{ fontWeight: 600 }}>{calculations.condDia} mm</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Overall Diameter</span>
              <span style={{ fontWeight: 600 }}>{calculations.overallDia} mm</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>DC Resistance @ 20°C</span>
              <span style={{ fontWeight: 600 }}>{calculations.r20} Ω/km</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>AC Resistance @ 90°C</span>
              <span style={{ fontWeight: 600 }}>{calculations.r90} Ω/km</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Short Circuit (1s)</span>
              <span style={{ fontWeight: 600 }}>{calculations.scRating} kA</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
