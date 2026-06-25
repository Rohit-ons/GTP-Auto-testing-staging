"use client";

import { useState } from "react";
import type { GtpSheet } from "@/lib/engine/types";

interface ExportButtonProps {
  sheet: GtpSheet;
  fileName?: string;
  label?: string;
  variant?: "primary" | "outline" | "text";
}

export default function ExportButton({ sheet, fileName = "GTP", label = "Export PDF", variant = "outline" }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheet, fileName }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `GTP_${fileName.replace(/[^a-zA-Z0-9]+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button onClick={handleExport} disabled={isExporting} className={`btn btn-${variant} btn-sm`}>
      {isExporting ? (
        <>
          <span className="spinner spinner-sm" />
          Exporting...
        </>
      ) : (
        label
      )}
    </button>
  );
}
