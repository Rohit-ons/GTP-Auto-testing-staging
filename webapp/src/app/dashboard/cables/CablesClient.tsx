"use client";

import { useState } from "react";
import Link from "next/link";

type CableRow = {
  id: string; name: string; numberOfCores: number; areaMain: number;
  voltageGrade: number; armoured: boolean; armourType: string | null;
  status: string; createdAt: string;
  conductorMaterial: { name: string };
  createdBy: { name: string | null };
};

const STATUS_FILTERS = ["", "DRAFT", "PENDING", "APPROVED", "REJECTED"];
const STATUS_LABELS: Record<string, string> = { "": "All Status", DRAFT: "Draft", PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected" };
const STATUS_BADGE: Record<string, string> = { APPROVED: "badge-success", PENDING: "badge-warning", REJECTED: "badge-danger", DRAFT: "badge-neutral" };

export default function CablesClient({ cables }: { cables: CableRow[] }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filtered = cables.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const approved = cables.filter(c => c.status === "APPROVED").length;
  const pending = cables.filter(c => c.status === "PENDING").length;

  return (
    <>
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-header-title">Cable <span className="text-gradient">SKUs</span></h1>
          <p className="page-header-subtitle">Manage all cable model designs and their approval status</p>
        </div>
        <div className="page-header-actions">
          <Link href="/dashboard/design" className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            New Design
          </Link>
        </div>
      </div>

      {/* Inline KPIs */}
      <div className="kpi-inline-row">
        <div className="kpi-inline-item">
          <span className="kpi-inline-value">{cables.length}</span>
          <span className="kpi-inline-label">Total SKUs</span>
        </div>
        <div className="kpi-inline-item">
          <span className="kpi-inline-value" style={{ color: "var(--emerald-600)" }}>{approved}</span>
          <span className="kpi-inline-label">Approved</span>
        </div>
        <div className="kpi-inline-item">
          <span className="kpi-inline-value" style={{ color: "var(--amber-600)" }}>{pending}</span>
          <span className="kpi-inline-label">Pending</span>
        </div>
        <div className="kpi-inline-item">
          <span className="kpi-inline-value" style={{ color: "var(--primary-600)" }}>
            {cables.length > 0 ? Math.round((approved / cables.length) * 100) : 0}%
          </span>
          <span className="kpi-inline-label">Approval Rate</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input className="input" placeholder="Search cable by name..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="select filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          {STATUS_FILTERS.map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
        </select>
        <span className="badge badge-neutral">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper" style={{ border: "none" }}>
          <table className="table table-enhanced">
            <thead>
              <tr>
                <th>SKU Name</th>
                <th>Configuration</th>
                <th>Voltage</th>
                <th>Material</th>
                <th>Armour</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Date</th>
                <th style={{ textAlign: "right", width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(cable => (
                <tr key={cable.id} className="row-clickable">
                  <td>
                    <Link href={`/dashboard/cables/${cable.id}`} style={{ color: "var(--primary-600)", fontWeight: 600 }}>
                      {cable.name}
                    </Link>
                  </td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
                    {cable.numberOfCores}C × {cable.areaMain}mm²
                  </td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
                    {cable.voltageGrade}V
                  </td>
                  <td>
                    <span className="badge badge-neutral">{cable.conductorMaterial.name}</span>
                  </td>
                  <td style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                    {cable.armoured ? (cable.armourType === "ROUND_WIRE" ? "Round Wire" : "Flat Strip") : "Unarmoured"}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[cable.status] || "badge-neutral"}`}>
                      {cable.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div className="avatar avatar-sm avatar-blue" style={{ width: 22, height: 22, fontSize: "0.5rem" }}>
                        {(cable.createdBy?.name || "U").slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>{cable.createdBy?.name || "-"}</span>
                    </div>
                  </td>
                  <td className="time-relative">
                    {new Date(cable.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <Link href={`/dashboard/cables/${cable.id}`} className="btn btn-ghost btn-sm">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state" style={{ padding: "3rem" }}>
                      <div className="empty-state-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/></svg>
                      </div>
                      <h3 className="empty-state-title">{search || filterStatus ? "No matches" : "No cable models yet"}</h3>
                      <p className="empty-state-description">
                        {search || filterStatus ? "Try adjusting your search or filters" : "Create your first cable design to get started"}
                      </p>
                      {!search && !filterStatus && (
                        <Link href="/dashboard/design" className="btn btn-primary">Create First Design</Link>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
