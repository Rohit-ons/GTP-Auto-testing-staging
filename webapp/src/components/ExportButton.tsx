"use client";

import { useState } from "react";

interface ExportButtonProps {
  cable: any;
  label?: string;
  variant?: "primary" | "outline" | "text";
}

export default function ExportButton({ cable, label = "Export PDF", variant = "outline" }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cores: cable.numberOfCores,
          area: cable.conductorAreaMain,
          conductorName: cable.conductorMaterial?.name || "Cable",
          insulationThk: cable.insulationThicknessMain,
          innerSheathThk: cable.innerSheathThickness,
          armourThk: cable.armourThickness,
          outerSheathThk: cable.outerSheathThickness,
          condDia: cable.computedOverallDiameter ? (cable.computedOverallDiameter * 0.4).toFixed(2) : "0", // Fallback if not specifically stored
          overallDia: cable.computedOverallDiameter,
          r20: cable.computedDcResistance20,
          r90: cable.computedAcResistance90,
          scRating: "TBD" // Calculate or fetch
        })
      });

      if (!res.ok) throw new Error("Export failed");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Datasheet_${cable.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const className = variant === "text" ? "" : `btn btn-${variant}`;
  const style = variant === "text" ? { 
    background: "transparent", 
    border: "none", 
    color: "var(--primary)", 
    cursor: "pointer", 
    fontSize: "0.875rem",
    padding: 0,
    marginRight: "1rem"
  } : {};

  return (
    <button 
      onClick={handleExport} 
      disabled={isExporting} 
      className={className}
      style={style}
    >
      {isExporting ? "..." : label}
    </button>
  );
}
