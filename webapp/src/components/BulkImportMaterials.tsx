"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { bulkImportMaterials } from "@/app/actions/materials";

export default function BulkImportMaterials() {
  const [loading, setLoading] = useState(false);

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
          alert(`Successfully imported ${res.count} materials!`);
        } else {
          alert(`Import failed: ${res.error}`);
        }
      } catch (err) {
        alert("Error parsing Excel file.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <button onClick={downloadSample} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
        Download Template
      </button>
      <div style={{ position: 'relative' }}>
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={handleFile}
          style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }}
          disabled={loading}
        />
        <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          {loading ? "Importing..." : "Bulk Import Excel"}
        </button>
      </div>
    </div>
  );
}
