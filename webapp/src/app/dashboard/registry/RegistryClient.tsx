"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toggleParameter, createParameter } from "@/app/actions/registry";

const BUCKET_COLOR: Record<string, string> = {
  INPUT: "badge-primary",
  CALCULATED: "badge-violet",
  MASTER_STD: "badge-info",
  MASTER_CONST: "badge-neutral",
};

const SECTIONS = ["CONDUCTOR", "INSULATION", "INNER_SHEATH", "ARMOURING", "OUTER_SHEATH", "ELECTRICAL", "FRLS_TESTS", "GENERAL"];
const BUCKETS = ["INPUT", "CALCULATED", "MASTER_STD", "MASTER_CONST"];

const STANDARD_PARAMS = [
  { key: "conductor.maxResistance20", label: "Conductor Max Resistance", stdPattern: "8130|60228" },
  { key: "conductor.minWires", label: "Conductor Min Wires", stdPattern: "8130|60228" },
  { key: "insulation.nominalThickness", label: "Insulation Nominal Thickness", stdPattern: "7098|1554" },
  { key: "innerSheath.minThickness", label: "Inner Sheath Min Thickness", stdPattern: "7098|1554" },
  { key: "outerSheath.nominalThickness", label: "Outer Sheath Nominal Thickness", stdPattern: "7098|1554" },
  { key: "outerSheath.minThickness", label: "Outer Sheath Min Thickness", stdPattern: "7098|1554" },
  { key: "armour.dimension", label: "Armour Dimension Label", stdPattern: "7098|1554" },
  { key: "armour.nominalDim", label: "Armour Nominal Dimension", stdPattern: "7098|1554" },
];

type ParamRow = {
  id: string; key: string; rowNo: string | null; label: string; unit: string | null;
  section: string; bucket: string; standardRef: string | null; formulaKey: string | null;
  isActive: boolean; ordering: number;
};

type Standard = { id: string; code: string; edition: string; title: string };

export default function RegistryClient({ rows, standards }: { rows: ParamRow[], standards: Standard[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterBucket, setFilterBucket] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");
  const [formData, setFormData] = useState({
    key: "", rowNo: "", label: "", unit: "", section: "CONDUCTOR",
    bucket: "INPUT", standardRef: "", formulaKey: "", sourceNote: "", ordering: 0,
  });

  const filtered = rows.filter(p => {
    const matchSearch = !search ||
      p.key.toLowerCase().includes(search.toLowerCase()) ||
      p.label.toLowerCase().includes(search.toLowerCase());
    const matchSection = !filterSection || p.section === filterSection;
    const matchBucket = !filterBucket || p.bucket === filterBucket;
    return matchSearch && matchSection && matchBucket;
  });

  const sectionCounts = SECTIONS.reduce((acc, s) => {
    acc[s] = rows.filter(r => r.section === s).length;
    return acc;
  }, {} as Record<string, number>);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateMsg("");
    const res = await createParameter({
      ...formData,
      rowNo: formData.rowNo || undefined,
      unit: formData.unit || undefined,
      standardRef: formData.standardRef || undefined,
      formulaKey: formData.formulaKey || undefined,
      sourceNote: formData.sourceNote || undefined,
    });
    if (res.success) {
      setCreateMsg("Parameter created successfully!");
      setFormData({ key: "", rowNo: "", label: "", unit: "", section: "CONDUCTOR", bucket: "INPUT", standardRef: "", formulaKey: "", sourceNote: "", ordering: 0 });
      setTimeout(() => { setShowCreate(false); setCreateMsg(""); router.refresh(); }, 1500);
    } else {
      setCreateMsg(res.error || "Error");
    }
    setCreating(false);
  };

  const set = <K extends keyof FormData>(field: K, value: FormData[K]) => setFormData(p => ({ ...p, [field]: value }));

  // Compute available formula keys based on selected standard
  const availableFormulaKeys = useMemo(() => {
    if (!formData.standardRef) return STANDARD_PARAMS;
    const std = standards.find(s => s.id === formData.standardRef);
    if (!std) return STANDARD_PARAMS;
    
    const matched = STANDARD_PARAMS.filter(p => new RegExp(p.stdPattern, 'i').test(std.code));
    return matched.length > 0 ? matched : STANDARD_PARAMS;
  }, [formData.standardRef, standards]);

  return (
    <>
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-header-title">Parameter <span className="text-gradient">Registry</span></h1>
          <p className="page-header-subtitle">
            Every GTP element — its bucket (Input / Calculated / IS-Standard / Const), the governing IS reference and its formula/lookup key.
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add Parameter
          </button>
        </div>
      </div>

      {/* Inline KPIs */}
      <div className="kpi-inline-row">
        <div className="kpi-inline-item">
          <span className="kpi-inline-value">{rows.length}</span>
          <span className="kpi-inline-label">Total Parameters</span>
        </div>
        <div className="kpi-inline-item">
          <span className="kpi-inline-value" style={{ color: "var(--emerald-600)" }}>{rows.filter(r => r.isActive).length}</span>
          <span className="kpi-inline-label">Active</span>
        </div>
        <div className="kpi-inline-item">
          <span className="kpi-inline-value" style={{ color: "var(--text-muted)" }}>{rows.filter(r => !r.isActive).length}</span>
          <span className="kpi-inline-label">Inactive</span>
        </div>
        <div className="kpi-inline-item">
          <span className="kpi-inline-value" style={{ color: "var(--violet-600)" }}>{rows.filter(r => r.bucket === "CALCULATED").length}</span>
          <span className="kpi-inline-label">Calculated</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            className="input"
            placeholder="Search by key or label..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="select filter-select" value={filterSection} onChange={(e) => setFilterSection(e.target.value)}>
          <option value="">All Sections</option>
          {SECTIONS.map(s => <option key={s} value={s}>{s} ({sectionCounts[s] || 0})</option>)}
        </select>
        <select className="select filter-select" value={filterBucket} onChange={(e) => setFilterBucket(e.target.value)}>
          <option value="">All Buckets</option>
          {BUCKETS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper" style={{ border: "none" }}>
          <table className="table table-enhanced">
            <thead>
              <tr>
                <th style={{ width: 50 }}>Row</th>
                <th>Key</th>
                <th>Label</th>
                <th>Section</th>
                <th>Bucket</th>
                <th>IS Reference</th>
                <th>Formula / Lookup</th>
                <th style={{ width: 80 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const stdRefName = standards.find(s => s.id === p.standardRef)?.code || p.standardRef;
                return (
                  <tr key={p.id} style={{ opacity: p.isActive ? 1 : 0.5 }}>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>{p.rowNo || "—"}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--primary-700)" }}>{p.key}</td>
                    <td style={{ fontWeight: 500 }}>{p.label}</td>
                    <td><span className="badge badge-neutral" style={{ fontSize: "0.625rem" }}>{p.section}</span></td>
                    <td>
                      <span className={`badge ${BUCKET_COLOR[p.bucket] ?? "badge-neutral"}`}>{p.bucket}</span>
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>{stdRefName ?? "—"}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.formulaKey ?? "—"}</td>
                    <td>
                      <form action={toggleParameter.bind(null, p.id)}>
                        <button type="submit" className={`btn btn-sm ${p.isActive ? "btn-success" : "btn-ghost"}`} style={{ fontSize: "0.75rem", padding: "0.25rem 0.625rem" }}>
                          {p.isActive ? "● Active" : "○ Off"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                    No parameters match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Parameter Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Parameter</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {createMsg && (
                  <div className={`alert ${createMsg.includes("success") ? "alert-success" : "alert-danger"}`}>{createMsg}</div>
                )}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Parameter Key <span className="text-danger">*</span></label>
                    <input className="input" value={formData.key} onChange={(e) => set("key", e.target.value)} required placeholder="e.g. conductor.maxDcResistance20" />
                    <span className="form-hint">Unique dot-notation key</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Row Number <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>(Optional)</span></label>
                    <input className="input" value={formData.rowNo} onChange={(e) => set("rowNo", e.target.value)} placeholder="e.g. 37" />
                    <span className="form-hint">GTP serial label</span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Label / Description <span className="text-danger">*</span></label>
                  <input className="input" value={formData.label} onChange={(e) => set("label", e.target.value)} required placeholder="e.g. Maximum DC Resistance at 20°C" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Unit <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>(Optional)</span></label>
                    <input className="input" value={formData.unit} onChange={(e) => set("unit", e.target.value)} placeholder="e.g. Ω/km, mm, kg/km" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ordering <span className="text-danger">*</span></label>
                    <input className="input" type="number" value={formData.ordering} onChange={(e) => set("ordering", parseInt(e.target.value) || 0)} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Section <span className="text-danger">*</span></label>
                    <select className="select" value={formData.section} onChange={(e) => set("section", e.target.value)}>
                      {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bucket <span className="text-danger">*</span></label>
                    <select className="select" value={formData.bucket} onChange={(e) => set("bucket", e.target.value)}>
                      {BUCKETS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">IS Standard Reference <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>(Optional)</span></label>
                    <select className="select" value={formData.standardRef} onChange={(e) => {
                      set("standardRef", e.target.value);
                      set("formulaKey", ""); // Reset formula key when standard changes
                    }}>
                      <option value="">-- None --</option>
                      {standards.map(s => (
                        <option key={s.id} value={s.id}>{s.code} ({s.edition})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Formula / Lookup Key <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>(Optional)</span></label>
                    <select className="select" value={formData.formulaKey} onChange={(e) => set("formulaKey", e.target.value)}>
                      <option value="">-- Select parameter value --</option>
                      {availableFormulaKeys.map(k => (
                        <option key={k.key} value={k.key}>{k.label}</option>
                      ))}
                      <option value="custom">Other / Custom...</option>
                    </select>
                    {formData.formulaKey === "custom" && (
                      <input 
                        className="input" 
                        style={{ marginTop: "0.5rem" }} 
                        placeholder="Enter custom key..." 
                        onChange={(e) => set("formulaKey", e.target.value)} 
                      />
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Source Note <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>(Optional)</span></label>
                  <input className="input" value={formData.sourceNote} onChange={(e) => set("sourceNote", e.target.value)} placeholder="Additional notes about the parameter source" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? <><span className="spinner spinner-sm" /> Creating...</> : "Create Parameter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
