"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createStandard,
  updateConductorSpec,
  createConductorSpec,
  deleteConductorSpec,
  updateInsulationSpec,
  createInsulationSpec,
  deleteInsulationSpec,
  updateOuterSheathSpec,
  createOuterSheathSpec,
  deleteOuterSheathSpec,
  updateArmourSpec,
  createArmourSpec,
  deleteArmourSpec,
} from "@/app/actions/standards";

type Standard = { id: string; code: string; edition: string; title: string; isActive: boolean };
type SpecCount = { id: string; conductors: number; insulations: number; sheaths: number; armours: number; customRules: number };

type ConductorSpec = { id: string; standardId: string; material: string; conductorClass: string; shape: string; area: number; minWires: number; maxResistance20: number };
type InsulationSpec = { id: string; standardId: string; insulationType: string; voltage: number; areaMin: number; areaMax: number; nominalThickness: number };
type OuterSheathSpec = { id: string; standardId: string; diaMin: number; diaMax: number; nominalThickness: number; minThickness: number };
type ArmourSpec = { id: string; standardId: string; armourType: string; diaMin: number; diaMax: number; dimension: string; nominalDim: number };

interface Props {
  data: {
    standards: Standard[];
    conductorSpecs: ConductorSpec[];
    insulationSpecs: InsulationSpec[];
    outerSheathSpecs: OuterSheathSpec[];
    armourSpecs: ArmourSpec[];
    specCounts: SpecCount[];
  };
}

const ITEM_TYPES = [
  { key: "AL_COND", label: "Aluminium Conductor", icon: "⚙" },
  { key: "CU_COND", label: "Copper Conductor", icon: "⚡" },
  { key: "XLPE_INS", label: "XLPE Insulation", icon: "🔌" },
  { key: "PVC_INS", label: "PVC Insulation", icon: "🔌" },
  { key: "INNER_SHEATH", label: "Inner Sheath", icon: "🛡️" },
  { key: "OUTER_SHEATH", label: "Outer Sheath", icon: "🛡️" },
  { key: "ARMOUR_ROUND", label: "Armour (Round Wire)", icon: "⛓️" },
  { key: "ARMOUR_FLAT", label: "Armour (Flat Strip)", icon: "⛓️" },
];

const cell = { className: "input", style: { padding: "0.35rem 0.5rem", fontSize: "0.85rem" } as React.CSSProperties };

export default function StandardsClient({ data }: Props) {
  const router = useRouter();
  const { standards, conductorSpecs, insulationSpecs, outerSheathSpecs, armourSpecs, specCounts } = data;

  const [showCreateStandard, setShowCreateStandard] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newEdition, setNewEdition] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");

  const [selectedStandard, setSelectedStandard] = useState<string | null>(null);
  const [activeItemTab, setActiveItemTab] = useState<string | null>(null);
  const [addedItems, setAddedItems] = useState<Record<string, string[]>>({});
  const [showAddItemDropdown, setShowAddItemDropdown] = useState(false);

  const getVisibleItems = (stdId: string) => {
    const available = new Set<string>();
    if (conductorSpecs.some(c => c.standardId === stdId && c.material === "AL")) available.add("AL_COND");
    if (conductorSpecs.some(c => c.standardId === stdId && c.material === "CU")) available.add("CU_COND");
    if (insulationSpecs.some(i => i.standardId === stdId && i.insulationType === "XLPE")) available.add("XLPE_INS");
    if (insulationSpecs.some(i => i.standardId === stdId && i.insulationType === "PVC")) available.add("PVC_INS");
    if (outerSheathSpecs.some(s => s.standardId === stdId)) available.add("OUTER_SHEATH");
    if (armourSpecs.some(a => a.standardId === stdId && a.armourType === "ROUND_WIRE")) available.add("ARMOUR_ROUND");
    if (armourSpecs.some(a => a.standardId === stdId && a.armourType === "FLAT_STRIP")) available.add("ARMOUR_FLAT");

    const manual = addedItems[stdId] || [];
    manual.forEach(m => available.add(m));

    return ITEM_TYPES.filter(t => available.has(t.key)).map(t => t.key);
  };

  useEffect(() => {
    if (!selectedStandard) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveItemTab(null);
      return;
    }
    const visible = getVisibleItems(selectedStandard);
    if (visible.length > 0 && (!activeItemTab || !visible.includes(activeItemTab))) {
      setActiveItemTab(visible[0]);
    } else if (visible.length === 0) {
      setActiveItemTab(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStandard]);

  const handleCreateStandard = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateMsg("");
    const res = await createStandard({ code: newCode, edition: newEdition, title: newTitle });
    if (res.success) {
      setCreateMsg("Standard created successfully!");
      setNewCode(""); setNewEdition(""); setNewTitle("");
      setTimeout(() => { setShowCreateStandard(false); setCreateMsg(""); router.refresh(); }, 1500);
      setSelectedStandard(res.id!);
    } else {
      setCreateMsg(res.error || "Error creating standard");
    }
    setCreating(false);
  };

  const getSpecCount = (stdId: string) => specCounts.find(s => s.id === stdId);



  const handleAddItem = (key: string) => {
    if (!selectedStandard) return;
    setAddedItems(prev => {
      const existing = prev[selectedStandard] || [];
      if (!existing.includes(key)) return { ...prev, [selectedStandard]: [...existing, key] };
      return prev;
    });
    setActiveItemTab(key);
    setShowAddItemDropdown(false);
  };

  const visibleItems = selectedStandard ? getVisibleItems(selectedStandard) : [];
  const stdConductors = selectedStandard ? conductorSpecs.filter(c => c.standardId === selectedStandard) : [];
  const stdInsulations = selectedStandard ? insulationSpecs.filter(i => i.standardId === selectedStandard) : [];
  const stdOuterSheaths = selectedStandard ? outerSheathSpecs.filter(s => s.standardId === selectedStandard) : [];
  const stdArmours = selectedStandard ? armourSpecs.filter(a => a.standardId === selectedStandard) : [];

  return (
    <>
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-header-title">Standards <span className="text-gradient">Master</span></h1>
          <p className="page-header-subtitle">Versioned IS data tables that drive the engine. All edits are audited.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowCreateStandard(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add New Standard
          </button>
        </div>
      </div>

      <div className="grid-auto-fill mb-4 stagger">
        {standards.map((s) => {
          const counts = getSpecCount(s.id);
          return (
            <div
              key={s.id}
              className={`standard-card ${selectedStandard === s.id ? "selected" : ""}`}
              onClick={() => setSelectedStandard(selectedStandard === s.id ? null : s.id)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div className="standard-card-code">{s.code}</div>
                  <div className="standard-card-edition">Edition: {s.edition}</div>
                </div>
                <span className={`badge ${s.isActive ? "badge-success" : "badge-neutral"}`}>
                  {s.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="standard-card-title">{s.title}</div>
              <div className="standard-card-stats">
                <span className="standard-card-stat"><strong>{counts?.conductors || 0}</strong> conductors</span>
                <span className="standard-card-stat"><strong>{counts?.insulations || 0}</strong> insulations</span>
                <span className="standard-card-stat"><strong>{counts?.customRules || 0}</strong> rules</span>
              </div>
            </div>
          );
        })}
      </div>

      {!selectedStandard && (
        <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", borderStyle: "dashed" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ margin: "0 auto 1rem", opacity: 0.5 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
          </svg>
          <p>Select a standard card above to view or manage its items and parameters.</p>
        </div>
      )}

      {selectedStandard && (
        <div className="animate-fade-in">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
            <div className="tabs" style={{ marginBottom: 0, flex: 1 }}>
              {visibleItems.map(key => {
                const type = ITEM_TYPES.find(t => t.key === key)!;
                return (
                  <button
                    key={key}
                    className={`tab ${activeItemTab === key ? "tab-active" : ""}`}
                    onClick={() => setActiveItemTab(key)}
                  >
                    {type.icon} {type.label}
                  </button>
                );
              })}
              {visibleItems.length === 0 && (
                <span style={{ padding: "0.5rem 1rem", color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.875rem" }}>
                  No items in this standard yet.
                </span>
              )}
            </div>

            <div style={{ position: "relative" }}>
              <button className="btn btn-neutral" onClick={() => setShowAddItemDropdown(!showAddItemDropdown)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Add Material / Item
              </button>
              {showAddItemDropdown && (
                <div style={{
                  position: "absolute", top: "110%", right: 0, zIndex: 50,
                  background: "var(--bg-card)", border: "1px solid var(--border-color)",
                  borderRadius: "8px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  width: "220px", overflow: "hidden", display: "flex", flexDirection: "column"
                }}>
                  {ITEM_TYPES.filter(t => !visibleItems.includes(t.key)).length === 0 ? (
                    <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>All available item types added.</div>
                  ) : (
                    ITEM_TYPES.filter(t => !visibleItems.includes(t.key)).map(t => (
                      <button
                        key={t.key}
                        onClick={() => handleAddItem(t.key)}
                        style={{
                          background: "none", border: "none", padding: "0.75rem 1rem",
                          textAlign: "left", fontSize: "0.875rem", cursor: "pointer",
                          borderBottom: "1px solid var(--border-color)",
                          display: "flex", alignItems: "center", gap: "0.5rem"
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = "var(--bg-body)"}
                        onMouseOut={(e) => e.currentTarget.style.background = "none"}
                      >
                        <span>{t.icon}</span> <span>{t.label}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {activeItemTab && (
            <div className="card" style={{ overflow: "hidden" }}>
              {activeItemTab === "AL_COND" && (() => {
                const rows = stdConductors.filter(c => c.material === "AL");
                return (
                  <>
                    <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div className="kpi-card-icon icon-blue" style={{ width: 28, height: 28 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/></svg></div>
                      <div>
                        <h3 style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Aluminium Conductor Specs</h3>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Max DC Resistance @20°C + Min Wires</p>
                      </div>
                    </div>
                    <div className="table-wrapper" style={{ border: "none", borderRadius: 0 }}>
                      <table className="table table-enhanced">
                        <thead><tr><th>Area mm²</th><th>Class</th><th>Shape</th><th>R Ω/km</th><th>Min Wires</th><th style={{ width: 120 }}>Actions</th></tr></thead>
                        <tbody>
                          {rows.map((s) => (
                            <tr key={s.id}>
                              <td style={{ fontWeight: 600 }}>{s.area}</td>
                              <td><span className="badge badge-neutral">{s.conductorClass}</span></td>
                              <td style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>{s.shape}</td>
                              <td colSpan={3}>
                                <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                                  <form action={updateConductorSpec} style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                                    <input type="hidden" name="id" value={s.id} />
                                    <input {...cell} name="maxResistance20" defaultValue={s.maxResistance20} step="any" style={{ ...cell.style, width: "90px" }} />
                                    <input {...cell} name="minWires" defaultValue={s.minWires} type="number" style={{ ...cell.style, width: "60px" }} />
                                    <button type="submit" className="btn btn-primary btn-sm">Save</button>
                                  </form>
                                  <form action={deleteConductorSpec.bind(null, s.id)}>
                                    <button type="submit" className="btn btn-danger btn-sm">Del</button>
                                  </form>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {rows.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No parameters added yet. Add below.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                    <div className="card-footer">
                      <form action={createConductorSpec} style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                        <input type="hidden" name="standardId" value={selectedStandard} />
                        <input type="hidden" name="material" value="AL" />
                        <input {...cell} name="area" placeholder="Area mm²" step="any" style={{ ...cell.style, width: "80px" }} required />
                        <select {...cell} name="conductorClass" style={{ ...cell.style, width: "70px" }} required>
                          <option value="1">1</option>
                          <option value="2" selected>2</option>
                          <option value="5">5</option>
                          <option value="6">6</option>
                        </select>
                        <select {...cell} name="shape" style={{ ...cell.style, width: "100px" }} required>
                          <option value="CIRCULAR" selected>CIRCULAR</option>
                          <option value="SHAPED">SHAPED</option>
                          <option value="FLEXIBLE">FLEXIBLE</option>
                        </select>
                        <input {...cell} name="maxResistance20" placeholder="R Ω/km" step="any" style={{ ...cell.style, width: "80px" }} required />
                        <input {...cell} name="minWires" placeholder="Wires" type="number" style={{ ...cell.style, width: "70px" }} required />
                        <button type="submit" className="btn btn-primary btn-sm">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg> Add
                        </button>
                      </form>
                    </div>
                  </>
                );
              })()}

              {activeItemTab === "CU_COND" && (() => {
                const rows = stdConductors.filter(c => c.material === "CU");
                return (
                  <>
                    <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div className="kpi-card-icon icon-amber" style={{ width: 28, height: 28 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/></svg></div>
                      <div>
                        <h3 style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Copper Conductor Specs</h3>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Max DC Resistance @20°C + Min Wires</p>
                      </div>
                    </div>
                    <div className="table-wrapper" style={{ border: "none", borderRadius: 0 }}>
                      <table className="table table-enhanced">
                        <thead><tr><th>Area mm²</th><th>Class</th><th>Shape</th><th>R Ω/km</th><th>Min Wires</th><th style={{ width: 120 }}>Actions</th></tr></thead>
                        <tbody>
                          {rows.map((s) => (
                            <tr key={s.id}>
                              <td style={{ fontWeight: 600 }}>{s.area}</td>
                              <td><span className="badge badge-neutral">{s.conductorClass}</span></td>
                              <td style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>{s.shape}</td>
                              <td colSpan={3}>
                                <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                                  <form action={updateConductorSpec} style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                                    <input type="hidden" name="id" value={s.id} />
                                    <input {...cell} name="maxResistance20" defaultValue={s.maxResistance20} step="any" style={{ ...cell.style, width: "90px" }} />
                                    <input {...cell} name="minWires" defaultValue={s.minWires} type="number" style={{ ...cell.style, width: "60px" }} />
                                    <button type="submit" className="btn btn-primary btn-sm">Save</button>
                                  </form>
                                  <form action={deleteConductorSpec.bind(null, s.id)}>
                                    <button type="submit" className="btn btn-danger btn-sm">Del</button>
                                  </form>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {rows.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No parameters added yet. Add below.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                    <div className="card-footer">
                      <form action={createConductorSpec} style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                        <input type="hidden" name="standardId" value={selectedStandard} />
                        <input type="hidden" name="material" value="CU" />
                        <input {...cell} name="area" placeholder="Area mm²" step="any" style={{ ...cell.style, width: "80px" }} required />
                        <select {...cell} name="conductorClass" style={{ ...cell.style, width: "70px" }} required>
                          <option value="1">1</option>
                          <option value="2" selected>2</option>
                          <option value="5">5</option>
                          <option value="6">6</option>
                        </select>
                        <select {...cell} name="shape" style={{ ...cell.style, width: "100px" }} required>
                          <option value="CIRCULAR" selected>CIRCULAR</option>
                          <option value="SHAPED">SHAPED</option>
                          <option value="FLEXIBLE">FLEXIBLE</option>
                        </select>
                        <input {...cell} name="maxResistance20" placeholder="R Ω/km" step="any" style={{ ...cell.style, width: "80px" }} required />
                        <input {...cell} name="minWires" placeholder="Wires" type="number" style={{ ...cell.style, width: "70px" }} required />
                        <button type="submit" className="btn btn-primary btn-sm">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg> Add
                        </button>
                      </form>
                    </div>
                  </>
                );
              })()}

              {(activeItemTab === "XLPE_INS" || activeItemTab === "PVC_INS") && (() => {
                const insType = activeItemTab === "XLPE_INS" ? "XLPE" : "PVC";
                const rows = stdInsulations.filter(i => i.insulationType === insType);
                return (
                  <>
                    <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div className="kpi-card-icon icon-emerald" style={{ width: 28, height: 28 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
                      <div>
                        <h3 style={{ fontSize: "0.9375rem", fontWeight: 600 }}>{insType} Insulation Nominal Thickness</h3>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Based on Voltage and Area</p>
                      </div>
                    </div>
                    <div className="table-wrapper" style={{ border: "none", borderRadius: 0 }}>
                      <table className="table table-enhanced">
                        <thead><tr><th>Voltage (V)</th><th>Area Min (mm²)</th><th>Area Max (mm²)</th><th>Nominal mm</th><th style={{ width: 120 }}>Actions</th></tr></thead>
                        <tbody>
                          {rows.map((s) => (
                            <tr key={s.id}>
                              <td>{s.voltage}</td>
                              <td>{s.areaMin}</td>
                              <td>{s.areaMax}</td>
                              <td colSpan={2}>
                                <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                                  <form action={updateInsulationSpec} style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                                    <input type="hidden" name="id" value={s.id} />
                                    <input {...cell} name="nominalThickness" defaultValue={s.nominalThickness} step="any" style={{ ...cell.style, width: "90px" }} />
                                    <button type="submit" className="btn btn-primary btn-sm">Save</button>
                                  </form>
                                  <form action={deleteInsulationSpec.bind(null, s.id)}>
                                    <button type="submit" className="btn btn-danger btn-sm">Del</button>
                                  </form>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {rows.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No parameters added yet. Add below.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                    <div className="card-footer">
                      <form action={createInsulationSpec} style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                        <input type="hidden" name="standardId" value={selectedStandard} />
                        <input type="hidden" name="insulationType" value={insType} />
                        <input {...cell} name="voltage" placeholder="Voltage (e.g. 1100)" type="number" style={{ ...cell.style, width: "110px" }} required />
                        <input {...cell} name="areaMin" placeholder="Area Min" step="any" style={{ ...cell.style, width: "90px" }} required />
                        <input {...cell} name="areaMax" placeholder="Area Max" step="any" style={{ ...cell.style, width: "90px" }} required />
                        <input {...cell} name="nominalThickness" placeholder="Nominal mm" step="any" style={{ ...cell.style, width: "100px" }} required />
                        <button type="submit" className="btn btn-primary btn-sm">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg> Add Parameter
                        </button>
                      </form>
                    </div>
                  </>
                );
              })()}

              {activeItemTab === "OUTER_SHEATH" && (() => {
                const rows = stdOuterSheaths;
                return (
                  <>
                    <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div className="kpi-card-icon icon-violet" style={{ width: 28, height: 28 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/></svg></div>
                      <div>
                        <h3 style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Outer Sheath Thickness</h3>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>By diameter under sheath</p>
                      </div>
                    </div>
                    <div className="table-wrapper" style={{ border: "none", borderRadius: 0 }}>
                      <table className="table table-enhanced">
                        <thead><tr><th>Dia &gt; mm</th><th>Dia ≤ mm</th><th>Nominal</th><th>Min</th><th style={{ width: 120 }}>Actions</th></tr></thead>
                        <tbody>
                          {rows.map((s) => (
                            <tr key={s.id}>
                              <td>{s.diaMin}</td>
                              <td>{s.diaMax}</td>
                              <td colSpan={3}>
                                <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                                  <form action={updateOuterSheathSpec} style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                                    <input type="hidden" name="id" value={s.id} />
                                    <input {...cell} name="nominalThickness" defaultValue={s.nominalThickness} step="any" style={{ ...cell.style, width: "80px" }} />
                                    <input {...cell} name="minThickness" defaultValue={s.minThickness} step="any" style={{ ...cell.style, width: "80px" }} />
                                    <button type="submit" className="btn btn-primary btn-sm">Save</button>
                                  </form>
                                  <form action={deleteOuterSheathSpec.bind(null, s.id)}>
                                    <button type="submit" className="btn btn-danger btn-sm">Del</button>
                                  </form>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {rows.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No parameters added yet. Add below.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                    <div className="card-footer">
                      <form action={createOuterSheathSpec} style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                        <input type="hidden" name="standardId" value={selectedStandard} />
                        <input {...cell} name="diaMin" placeholder="Dia > mm" step="any" style={{ ...cell.style, width: "90px" }} required />
                        <input {...cell} name="diaMax" placeholder="Dia ≤ mm" step="any" style={{ ...cell.style, width: "90px" }} required />
                        <input {...cell} name="nominalThickness" placeholder="Nominal" step="any" style={{ ...cell.style, width: "90px" }} required />
                        <input {...cell} name="minThickness" placeholder="Min" step="any" style={{ ...cell.style, width: "90px" }} required />
                        <button type="submit" className="btn btn-primary btn-sm">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg> Add Parameter
                        </button>
                      </form>
                    </div>
                  </>
                );
              })()}

              {(activeItemTab === "ARMOUR_ROUND" || activeItemTab === "ARMOUR_FLAT") && (() => {
                const armourType = activeItemTab === "ARMOUR_ROUND" ? "ROUND_WIRE" : "FLAT_STRIP";
                const rows = stdArmours.filter(a => a.armourType === armourType);
                return (
                  <>
                    <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div className="kpi-card-icon icon-red" style={{ width: 28, height: 28 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg></div>
                      <div>
                        <h3 style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Armour Dimensions ({armourType.replace("_", " ")})</h3>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>By diameter under armour</p>
                      </div>
                    </div>
                    <div className="table-wrapper" style={{ border: "none", borderRadius: 0 }}>
                      <table className="table table-enhanced">
                        <thead><tr><th>Dia &gt;</th><th>Dia ≤</th><th>Dimension Label</th><th>Nominal Dim</th><th style={{ width: 120 }}>Actions</th></tr></thead>
                        <tbody>
                          {rows.map((s) => (
                            <tr key={s.id}>
                              <td>{s.diaMin}</td>
                              <td>{s.diaMax}</td>
                              <td colSpan={3}>
                                <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                                  <form action={updateArmourSpec} style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                                    <input type="hidden" name="id" value={s.id} />
                                    <input {...cell} name="dimension" defaultValue={s.dimension} style={{ ...cell.style, width: "110px", fontFamily: "monospace" }} />
                                    <input {...cell} name="nominalDim" defaultValue={s.nominalDim} step="any" style={{ ...cell.style, width: "90px" }} />
                                    <button type="submit" className="btn btn-primary btn-sm">Save</button>
                                  </form>
                                  <form action={deleteArmourSpec.bind(null, s.id)}>
                                    <button type="submit" className="btn btn-danger btn-sm">Del</button>
                                  </form>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {rows.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No parameters added yet. Add below.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                    <div className="card-footer">
                      <form action={createArmourSpec} style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                        <input type="hidden" name="standardId" value={selectedStandard} />
                        <input type="hidden" name="armourType" value={armourType} />
                        <input {...cell} name="diaMin" placeholder="Dia > mm" step="any" style={{ ...cell.style, width: "90px" }} required />
                        <input {...cell} name="diaMax" placeholder="Dia ≤ mm" step="any" style={{ ...cell.style, width: "90px" }} required />
                        <input {...cell} name="dimension" placeholder="Label (e.g. 1.40)" style={{ ...cell.style, width: "110px", fontFamily: "monospace" }} required />
                        <input {...cell} name="nominalDim" placeholder="Nominal" step="any" style={{ ...cell.style, width: "90px" }} required />
                        <button type="submit" className="btn btn-primary btn-sm">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg> Add Parameter
                        </button>
                      </form>
                    </div>
                  </>
                );
              })()}

            </div>
          )}
        </div>
      )}

      {showCreateStandard && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreateStandard(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Add New Standard</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreateStandard(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateStandard}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {createMsg && (
                  <div className={`alert ${createMsg.includes("success") ? "alert-success" : "alert-danger"}`}>
                    {createMsg}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Standard Code</label>
                  <input className="input" value={newCode} onChange={(e) => setNewCode(e.target.value)} required placeholder="e.g. IS 7098-2, IS 1554, IEC 60502" />
                  <span className="form-hint">The IS / IEC code identifier</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Edition / Year</label>
                  <input className="input" value={newEdition} onChange={(e) => setNewEdition(e.target.value)} required placeholder="e.g. 2025, 1988, Rev.3" />
                </div>
                <div className="form-group">
                  <label className="form-label">Title / Description</label>
                  <input className="input" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required placeholder="e.g. XLPE Insulated PVC Sheathed Cables (Part 2)" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateStandard(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? <><span className="spinner spinner-sm" /> Creating...</> : "Create Standard"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
