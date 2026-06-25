"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { bulkImportMaterials } from "@/app/actions/materials";

export default function BulkImportMaterials() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const downloadSample = () => {
    const data = [
      { name: "Copper", category: "CONDUCTOR", density: 8960, resistivity20: 0.01724, alpha: 0.00393 },
      { name: "Aluminum", category: "CONDUCTOR", density: 2700, resistivity20: 0.02826, alpha: 0.00431 },
      { name: "XLPE", category: "INSULATION", density: 920, resistivity20: "", alpha: "" },
      { name: "PVC ST2", category: "SHEATH", density: 1380, resistivity20: "", alpha: "" }
    ];
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Materials");
    XLSX.writeFile(wb, "Materials_Template.xlsx");
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage(null);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const res = await bulkImportMaterials(data);
        if (res.success) {
          setMessage({ type: "success", text: `Successfully imported ${res.count} materials!` });
        } else {
          setMessage({ type: "error", text: `Import failed: ${res.error}` });
        }
      } catch {
        setMessage({ type: "error", text: "Error parsing Excel file." });
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      {message && (
        <span style={{ fontSize: "0.85rem", fontWeight: 500, color: message.type === "success" ? "var(--emerald-600)" : "var(--red-600)", marginRight: "0.5rem" }}>
          {message.text}
        </span>
      )}
      
      <button onClick={downloadSample} className="btn btn-neutral" type="button" disabled={loading} title="Download Excel Template">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Template
      </button>
      
      <label className={`btn btn-neutral ${loading ? "disabled" : ""}`} style={{ cursor: loading ? "default" : "pointer", margin: 0 }}>
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={handleFile}
          disabled={loading}
          style={{ display: "none" }}
        />
        {loading ? (
          <><span className="spinner spinner-sm"></span> Importing...</>
        ) : (
          <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Import CSV</>
        )}
      </label>
    </div>
  );
}
