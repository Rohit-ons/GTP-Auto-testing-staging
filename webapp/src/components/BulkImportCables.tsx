"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { bulkImportCables } from "@/app/actions/cables";

export default function BulkImportCables() {
  const [loading, setLoading] = useState(false);

  const downloadSample = () => {
    const data = [
      { cores: 3, area: 185, conductorMaterial: "Copper", insulationThk: 1.6, innerSheathThk: 0.5, armourThk: 0.8, outerSheathThk: 1.88 },
      { cores: 4, area: 95, conductorMaterial: "Aluminum", insulationThk: 1.1, innerSheathThk: 0.4, armourThk: 0.6, outerSheathThk: 1.6 }
    ];
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cables");
    XLSX.writeFile(wb, "Cables_Import_Template.xlsx");
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

        const res = await bulkImportCables(data);
        if (res.success) {
          alert(`Success! Imported ${res.count} cable designs. They have been added to the dashboard with 'PENDING' status for individual approval.`);
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
      <button onClick={downloadSample} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
        Download Excel Template
      </button>
      <div style={{ position: 'relative' }}>
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={handleFile}
          style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }}
          disabled={loading}
        />
        <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
          {loading ? "Importing..." : "Bulk Import SKUs"}
        </button>
      </div>
    </div>
  );
}
