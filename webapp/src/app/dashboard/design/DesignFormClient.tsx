"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { previewGtp } from "@/app/actions/gtp";
import { createCable } from "@/app/actions/cables";
import GtpSheetView from "@/components/GtpSheetView";
import type { CableInput, GtpSheet, Overrides } from "@/lib/engine/types";

interface Mat { id: string; code: string; name: string }
interface Options { conductors: Mat[]; insulations: Mat[]; sheaths: Mat[]; armours: Mat[] }

const COMMON_AREAS = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400];

const TOOLTIPS: Record<string, string> = {
  standardEdition: "The IS 7098-1 edition that governs all dimension lookups. Different editions may have different thickness tables.",
  standardsProfile: "IS-strict follows literal IS values. Polyvion house matches production sheets with house-rule adjustments.",
  insulationDisplay: "Choose whether to show both nominal/minimum thickness or just nominal on the GTP sheet.",
  numberOfCores: "Number of conducting cores. 3.5C means 3 full cores + 1 reduced neutral.",
  conductorMaterial: "Aluminium (AL) or Copper (CU) — affects resistance, weight, and pricing.",
  conductorShape: "Circular for single-core, Sector-shaped for multi-core compaction, Flexible for stranded.",
  area: "Cross-sectional area in mm². This is the primary sizing parameter.",
  conductorClass: "Class 1 = solid, Class 2 = stranded (standard), Class 5 = flexible.",
  armoured: "Whether the cable has steel wire or strip armour for mechanical protection.",
  outerSheathGrade: "PVC ST-2 is standard. FRLS/FRLSH for fire-retardant applications.",
};

export default function DesignFormClient({ options }: { options: Options }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [sheet, setSheet] = useState<GtpSheet | null>(null);
  const [loading, setLoading] = useState(false);
  const [overrides, setOverrides] = useState<Overrides>({});
  const [showGuide, setShowGuide] = useState(false);

  const [input, setInput] = useState<CableInput>({
    voltageGrade: 1100,
    numberOfCores: 3.5,
    areaMain: 185,
    areaNeutral: 95,
    conductorMaterial: "AL",
    conductorClass: "2",
    conductorShape: "SHAPED",
    insulationCode: "XLPE",
    armoured: true,
    armourType: "FLAT_STRIP",
    innerSheathCode: "PVC_ST2",
    outerSheathCode: "PVC_ST2",
    outerSheathGrade: "FRLSH",
    outerSheathColour: "Black",
    standardEdition: "1988",
    standardsProfile: "IS_STRICT",
    showInsulationMin: true,
    customer: "",
    project: "",
  });

  const set = <K extends keyof CableInput>(k: K, v: CableInput[K]) =>
    setInput((p) => ({ ...p, [k]: v }));

  const key = useMemo(() => JSON.stringify({ input, overrides }), [input, overrides]);
  useEffect(() => {
    let active = true;
    const t = setTimeout(async () => {
      if (!active) return;
      setLoading(true);
      try {
        const s = await previewGtp(input, overrides);
        if (active) setSheet(s);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => { active = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const handleOverride = (rowNo: string, label: string, current: string) => {
    const next = window.prompt(`Override "${label}" (row ${rowNo}).\nLeave blank to revert to the standard value.`, current);
    if (next === null) return;
    if (next.trim() === "" || next.trim() === current) {
      setOverrides((p) => { const c = { ...p }; delete c[rowNo]; return c; });
      return;
    }
    const reason = window.prompt("Reason for override (audited):", overrides[rowNo]?.reason ?? "Customer requirement") ?? "";
    setOverrides((p) => ({ ...p, [rowNo]: { value: next.trim(), reason } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await createCable(input, overrides);
      if (res.success && res.id) {
        router.push(`/dashboard/cables/${res.id}`);
      } else if (res.error === "Unauthorized") {
        alert("Please sign in to save designs.");
        router.push("/login");
      } else {
        alert("Error: " + res.error);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Reset all inputs to defaults?")) {
      setInput({
        voltageGrade: 1100, numberOfCores: 3.5, areaMain: 185, areaNeutral: 95,
        conductorMaterial: "AL", conductorClass: "2", conductorShape: "SHAPED",
        insulationCode: "XLPE", armoured: true, armourType: "FLAT_STRIP",
        innerSheathCode: "PVC_ST2", outerSheathCode: "PVC_ST2", outerSheathGrade: "FRLSH",
        outerSheathColour: "Black", standardEdition: "1988", standardsProfile: "IS_STRICT",
        showInsulationMin: true, customer: "", project: "",
      });
      setOverrides({});
    }
  };

  const hasNeutral = input.numberOfCores % 1 !== 0;

  const cableSummary = `${input.numberOfCores}C × ${input.areaMain}mm² ${input.conductorMaterial} ${input.insulationCode} — ${input.outerSheathGrade}`;

  return (
    <>
      {/* Collapsible Guide Banner */}
      <div className={`info-banner ${showGuide ? "open" : ""}`}>
        <button className="info-banner-toggle" onClick={() => setShowGuide(!showGuide)}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            {showGuide ? "Hide Guide" : "ℹ How to Use the Design Workbench"}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div className="info-banner-body">
          <h4>Getting Started</h4>
          <ul>
            <li>Configure your <strong>Standard Edition</strong> (IS 7098-1 : 1988 or 2025) — this controls all dimension lookups.</li>
            <li>Select <strong>conductor material</strong> (AL or CU), number of cores, and cross-section area.</li>
            <li>The right panel shows the <strong>live GTP sheet</strong> — it updates instantly as you change inputs.</li>
          </ul>
          <h4>Overriding Standard Values</h4>
          <ul>
            <li>Click the <strong>✎ icon</strong> next to any IS-Std or Calculated row to override its value.</li>
            <li>Overrides are flagged in amber and require a <strong>reason</strong> (audited on save).</li>
            <li>Leave the override blank to revert to the standard value.</li>
          </ul>
          <h4>Saving Your Design</h4>
          <ul>
            <li>Click <strong>&quot;Save SKU &amp; Generate GTP&quot;</strong> to persist the design as a Cable SKU.</li>
            <li>You&apos;ll be redirected to the cable detail page where you can export as PDF.</li>
          </ul>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: "2rem", alignItems: "start" }}>
        {/* ---- Design Inputs ---- */}
        <div className="card" style={{ position: "sticky", top: "5rem", overflow: "hidden" }}>
          <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div className="kpi-card-icon icon-blue" style={{ width: 28, height: 28 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </div>
            <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>Design Inputs</h2>
          </div>

          <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {/* Section: Standard Configuration */}
            <div className="section-divider">Standard Configuration</div>
            <div style={{ display: "grid", gap: "0.85rem" }}>
              <Field label="Standard Edition" tooltip={TOOLTIPS.standardEdition}>
                <select className="input" value={input.standardEdition} onChange={(e) => set("standardEdition", e.target.value)}>
                  <option value="1988">IS 7098-1 : 1988</option>
                  <option value="2025">IS 7098-1 : 2025</option>
                </select>
              </Field>
              <Field label="Standards Profile" tooltip={TOOLTIPS.standardsProfile}>
                <select className="input" value={input.standardsProfile} onChange={(e) => set("standardsProfile", e.target.value as CableInput["standardsProfile"])}>
                  <option value="IS_STRICT">IS-strict (literal IS 8130 / 7098)</option>
                  <option value="POLYVION_HOUSE">Polyvion house (match production sheets)</option>
                </select>
              </Field>
              <Field label="Insulation Thickness Display" tooltip={TOOLTIPS.insulationDisplay}>
                <select className="input" value={input.showInsulationMin ? "min" : "nom"} onChange={(e) => set("showInsulationMin", e.target.value === "min")}>
                  <option value="min">Nominal / Minimum</option>
                  <option value="nom">Nominal only</option>
                </select>
              </Field>
            </div>

            {/* Section: Conductor Specification */}
            <div className="section-divider">Conductor Specification</div>
            <div style={{ display: "grid", gap: "0.85rem" }}>
              <Row>
                <Field label="No. of Cores" tooltip={TOOLTIPS.numberOfCores}>
                  <select className="input" value={input.numberOfCores} onChange={(e) => {
                    const c = Number(e.target.value);
                    setInput((p) => ({ ...p, numberOfCores: c, areaNeutral: c % 1 !== 0 ? (p.areaNeutral ?? 95) : null }));
                  }}>
                    {[1, 2, 3, 3.5, 4, 5, 7, 10, 12, 14, 16, 19, 24].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Voltage (V)">
                  <input className="input" type="number" value={input.voltageGrade} onChange={(e) => set("voltageGrade", Number(e.target.value))} placeholder="e.g. 1100" />
                </Field>
              </Row>
              <Row>
                <Field label="Conductor" tooltip={TOOLTIPS.conductorMaterial}>
                  <select className="input" value={input.conductorMaterial} onChange={(e) => set("conductorMaterial", e.target.value as CableInput["conductorMaterial"])}>
                    <option value="AL">Aluminium</option>
                    <option value="CU">Copper</option>
                  </select>
                </Field>
                <Field label="Shape" tooltip={TOOLTIPS.conductorShape}>
                  <select className="input" value={input.conductorShape} onChange={(e) => set("conductorShape", e.target.value as CableInput["conductorShape"])}>
                    <option value="CIRCULAR">Circular</option>
                    <option value="SHAPED">Sector Shaped</option>
                    <option value="FLEXIBLE">Flexible</option>
                  </select>
                </Field>
              </Row>
              <Row>
                <Field label="Area — Main (mm²)" tooltip={TOOLTIPS.area}>
                  <input className="input" list="areas" type="number" value={input.areaMain} onChange={(e) => set("areaMain", Number(e.target.value))} placeholder="e.g. 185" />
                </Field>
                <Field label="Area — Neutral">
                  <input className="input" list="areas" type="number" disabled={!hasNeutral} value={input.areaNeutral ?? ""} onChange={(e) => set("areaNeutral", e.target.value ? Number(e.target.value) : null)} placeholder={hasNeutral ? "e.g. 95" : "N/A"} />
                </Field>
              </Row>
              <datalist id="areas">{COMMON_AREAS.map((a) => <option key={a} value={a} />)}</datalist>
              <Field label="Class" tooltip={TOOLTIPS.conductorClass}>
                <select className="input" value={input.conductorClass} onChange={(e) => set("conductorClass", e.target.value)}>
                  <option value="1">Class 1 (Solid)</option>
                  <option value="2">Class 2 (Stranded)</option>
                  <option value="5">Class 5 (Flexible)</option>
                </select>
              </Field>
            </div>

            {/* Section: Insulation & Sheathing */}
            <div className="section-divider">Insulation & Sheathing</div>
            <div style={{ display: "grid", gap: "0.85rem" }}>
              <Field label="Insulation">
                <select className="input" value={input.insulationCode} onChange={(e) => set("insulationCode", e.target.value)}>
                  {options.insulations.map((m) => <option key={m.id} value={m.code}>{m.name}</option>)}
                </select>
              </Field>
              <Row>
                <Field label="Armoured" tooltip={TOOLTIPS.armoured}>
                  <select className="input" value={input.armoured ? "yes" : "no"} onChange={(e) => set("armoured", e.target.value === "yes")}>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </Field>
                <Field label="Armour Type">
                  <select className="input" disabled={!input.armoured} value={input.armourType ?? "FLAT_STRIP"} onChange={(e) => set("armourType", e.target.value as CableInput["armourType"])}>
                    <option value="FLAT_STRIP">Flat Strip</option>
                    <option value="ROUND_WIRE">Round Wire</option>
                  </select>
                </Field>
              </Row>
              <Row>
                <Field label="Outer Sheath Grade" tooltip={TOOLTIPS.outerSheathGrade}>
                  <select className="input" value={input.outerSheathGrade} onChange={(e) => set("outerSheathGrade", e.target.value as CableInput["outerSheathGrade"])}>
                    <option value="PVC_ST2">PVC ST-2</option>
                    <option value="FRLS">FRLS</option>
                    <option value="FRLSH">FRLSH</option>
                    <option value="PVC_ST3">PVC ST-3</option>
                  </select>
                </Field>
                <Field label="Sheath Colour">
                  <input className="input" value={input.outerSheathColour ?? ""} onChange={(e) => set("outerSheathColour", e.target.value)} placeholder="e.g. Black, Grey" />
                </Field>
              </Row>
            </div>

            {/* Section: Project Details */}
            <div className="section-divider">Project Details</div>
            <div style={{ display: "grid", gap: "0.85rem" }}>
              <Field label="Customer">
                <input className="input" value={input.customer ?? ""} onChange={(e) => set("customer", e.target.value)} placeholder="Enter customer name" />
              </Field>
              <Field label="Project">
                <input className="input" value={input.project ?? ""} onChange={(e) => set("project", e.target.value)} placeholder="Enter project name or reference" />
              </Field>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-light)" }}>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ flex: 1, padding: "0.85rem" }}>
                {saving ? "Saving…" : "Save SKU & Generate GTP"}
              </button>
              <button onClick={handleReset} className="btn btn-ghost" style={{ padding: "0.85rem" }} title="Reset to defaults">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* ---- Live GTP ---- */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>Live GTP Sheet</h2>
                <span className={`status-dot ${loading ? "computing" : "live"}`}>
                  {loading ? "Computing…" : "Live"}
                </span>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                {cableSummary}
              </p>
            </div>
            {Object.keys(overrides).length > 0 && (
              <span className="badge badge-warning">{Object.keys(overrides).length} override(s)</span>
            )}
          </div>
          <div className="card-body" style={{ padding: "0.75rem" }}>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.75rem", padding: "0 0.75rem" }}>
              Click ✎ on an IS-Std / Calc row to override its value (the deviation is flagged and audited on save).
            </p>
            {sheet ? <GtpSheetView sheet={sheet} onOverride={handleOverride} /> : (
              <div className="empty-state" style={{ padding: "3rem" }}>
                <div className="empty-state-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <p className="empty-state-description">Adjust inputs to generate the GTP…</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, tooltip, children }: { label: string; tooltip?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", marginBottom: "0.3rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
        {label}
        {tooltip && (
          <span className="tooltip-wrapper">
            <span className="help-icon">?</span>
            <span className="tooltip-content">{tooltip}</span>
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>{children}</div>;
}
