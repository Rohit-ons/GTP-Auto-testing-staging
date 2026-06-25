"use client";

import type { GtpSheet } from "@/lib/engine/types";

const BUCKET_BADGE: Record<string, string> = {
  INPUT: "badge-primary",
  CALCULATED: "badge-violet",
  MASTER_STD: "badge-info",
  MASTER_CONST: "badge-neutral",
};
const BUCKET_LABEL: Record<string, string> = {
  INPUT: "Input",
  CALCULATED: "Calc",
  MASTER_STD: "IS Std",
  MASTER_CONST: "Const",
};

interface Props {
  sheet: GtpSheet;
  /** When provided, fetched/computed rows become overridable (audited at save). */
  onOverride?: (rowNo: string, label: string, current: string) => void;
}

const OVERRIDABLE = new Set(["MASTER_STD", "CALCULATED"]);

export default function GtpSheetView({ sheet, onOverride }: Props) {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-bold">{sheet.header.manufacturer} — {sheet.header.brand}</h3>
        <div className="text-sm text-secondary">{sheet.header.title}</div>
        {sheet.header.customer && <div className="text-sm">Customer: {sheet.header.customer}</div>}
        {sheet.header.project && <div className="text-sm">Project: {sheet.header.project}</div>}
      </div>

      <div className="card-body">
        {sheet.warnings.length > 0 && (
          <div className="alert alert-warning mb-2">
            {sheet.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
          </div>
        )}

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}>#</th>
                <th>Description</th>
                <th style={{ width: "60px" }}>Unit</th>
                <th>Value</th>
                <th style={{ width: "56px" }}>Type</th>
                {onOverride && <th style={{ width: "36px" }} />}
              </tr>
            </thead>
            <tbody>
              {sheet.rows.map((r, i) => {
                if (r.section) {
                  return (
                    <tr key={i} style={{ background: "var(--bg-muted)" }}>
                      <td className="font-bold">{r.rowNo}</td>
                      <td colSpan={onOverride ? 5 : 4} className="font-bold" style={{ letterSpacing: "0.03em" }}>{r.label}</td>
                    </tr>
                  );
                }
                const canOverride = !!onOverride && OVERRIDABLE.has(r.bucket);
                return (
                  <tr key={i} style={{ background: r.overridden ? "rgba(245,158,11,0.08)" : undefined }}>
                    <td className="text-muted">{r.rowNo}</td>
                    <td title={r.source}>{r.label}</td>
                    <td className="text-secondary">{r.unit ?? ""}</td>
                    <td className="font-semibold">
                      {r.value}
                      {r.overridden && (
                        <span style={{ marginLeft: 6 }} className="text-xs text-warning" title={`Standard: ${r.standardValue}${r.overrideReason ? ` · ${r.overrideReason}` : ""}`}>
                          (was {r.standardValue})
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${BUCKET_BADGE[r.bucket] ?? "badge-neutral"}`}>
                        {BUCKET_LABEL[r.bucket] ?? r.bucket}
                      </span>
                    </td>
                    {onOverride && (
                      <td className="text-center">
                        {canOverride && (
                          <button onClick={() => onOverride(r.rowNo, r.label, r.overridden ? r.standardValue ?? r.value : r.value)} title="Override (audited)" className="btn btn-ghost" style={{ padding: "0.25rem", color: r.overridden ? "var(--warning)" : "var(--text-muted)" }}>✎</button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer block (Polyvion notes + signatory) */}
      {sheet.footer && (
        <div className="card-footer text-sm text-secondary">
          {sheet.footer.notes.map((n, i) => (
            <div key={i} style={{ marginBottom: "0.3rem" }}>{n}</div>
          ))}
          <div className="font-semibold text-primary text-right mt-1">
            {sheet.footer.signatory}
          </div>
        </div>
      )}
    </div>
  );
}
