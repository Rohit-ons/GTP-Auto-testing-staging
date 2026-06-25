import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DashboardCharts from "@/components/DashboardCharts";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const totalCables = await prisma.cableModel.count();
  const approvedCables = await prisma.cableModel.count({
    where: { status: "APPROVED" },
  });
  const pendingCables = await prisma.cableModel.count({
    where: { status: "PENDING" },
  });
  const draftCables = await prisma.cableModel.count({
    where: { status: "DRAFT" },
  });
  const totalMaterials = await prisma.material.count();
  const totalParameters = await prisma.parameterDefinition.count();
  const totalStandards = await prisma.standard.count();

  const statusDist = [
    { name: "Approved", value: approvedCables },
    { name: "Pending", value: pendingCables },
    { name: "Draft/Other", value: totalCables - approvedCables - pendingCables },
  ];

  const materialDist = await prisma.material.groupBy({
    by: ["category"],
    _count: { category: true },
  });

  const recentCables = await prisma.cableModel.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true } }, conductorMaterial: { select: { name: true } } },
  });

  const approvalRate = totalCables > 0 ? Math.round((approvedCables / totalCables) * 100) : 0;

  return (
    <div className="animate-fade-in">
      {/* Welcome */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-header-title">
            Welcome back, {session?.user?.name || "User"}
          </h1>
          <p className="page-header-subtitle">
            Here&apos;s what&apos;s happening with your cable designs today.
          </p>
        </div>
        <div className="page-header-actions">
          <Link href="/dashboard/design" className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Design
          </Link>
        </div>
      </div>

      {/* ShadCN-Style KPI Grid */}
      <div className="grid-auto-fit stagger mb-4">
        <div className="kpi-card kpi-blue">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Total Cable SKUs</span>
            <div className="kpi-card-icon icon-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
              </svg>
            </div>
          </div>
          <div className="kpi-card-value">{totalCables}</div>
          <div className="kpi-card-footer">
            <span className="kpi-card-trend trend-neutral">All time</span>
            <span className="kpi-card-subtitle">{draftCables} in draft</span>
          </div>
        </div>

        <div className="kpi-card kpi-emerald">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Approved Designs</span>
            <div className="kpi-card-icon icon-emerald">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          </div>
          <div className="kpi-card-value">{approvedCables}</div>
          <div className="kpi-card-footer">
            <span className="kpi-card-trend trend-up">↑ {approvalRate}%</span>
            <span className="kpi-card-subtitle">approval rate</span>
          </div>
        </div>

        <div className="kpi-card kpi-amber">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Pending Approval</span>
            <div className="kpi-card-icon icon-amber">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div className="kpi-card-value">{pendingCables}</div>
          <div className="kpi-card-footer">
            <span className={`kpi-card-trend ${pendingCables > 0 ? "trend-down" : "trend-neutral"}`}>
              {pendingCables > 0 ? "Needs action" : "All clear"}
            </span>
          </div>
        </div>

        <div className="kpi-card kpi-violet">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Materials in Master</span>
            <div className="kpi-card-icon icon-violet">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
            </div>
          </div>
          <div className="kpi-card-value">{totalMaterials}</div>
          <div className="kpi-card-footer">
            <span className="kpi-card-trend trend-neutral">{totalStandards} standards</span>
            <span className="kpi-card-subtitle">{totalParameters} params</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}
        className="mb-4"
      >
        <div className="card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div className="kpi-card-icon icon-blue" style={{ width: 28, height: 28 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 0 20" /></svg>
              </div>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 600 }}>SKU Status Distribution</h3>
            </div>
            <span className="badge badge-neutral">All time</span>
          </div>
          <div className="card-body">
            <DashboardCharts type="pie" data={statusDist} />
          </div>
        </div>
        <div className="card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div className="kpi-card-icon icon-violet" style={{ width: 28, height: 28 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
              </div>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Materials by Category</h3>
            </div>
            <span className="badge badge-neutral">{totalMaterials} total</span>
          </div>
          <div className="card-body">
            <DashboardCharts
              type="bar"
              data={materialDist.map((m) => ({
                name: m.category,
                value: m._count.category,
              }))}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-4">
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem", color: "var(--text-secondary)" }}>Quick Actions</h3>
        <div className="grid grid-3 gap-md">
          <Link href="/dashboard/design" className="quick-action">
            <div className="quick-action-icon" style={{ background: "var(--primary-50)", color: "var(--primary-600)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <div className="quick-action-content">
              <div className="quick-action-title">New Cable Design</div>
              <div className="quick-action-desc">Open the live design workbench</div>
            </div>
            <svg className="quick-action-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </Link>
          <Link href="/dashboard/materials" className="quick-action">
            <div className="quick-action-icon" style={{ background: "var(--violet-50)", color: "var(--violet-600)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
            </div>
            <div className="quick-action-content">
              <div className="quick-action-title">Manage Materials</div>
              <div className="quick-action-desc">Add or import material data</div>
            </div>
            <svg className="quick-action-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </Link>
          <Link href="/dashboard/standards" className="quick-action">
            <div className="quick-action-icon" style={{ background: "var(--emerald-50)", color: "var(--emerald-600)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="quick-action-content">
              <div className="quick-action-title">View Standards</div>
              <div className="quick-action-desc">IS 7098 & IS 8130 data tables</div>
            </div>
            <svg className="quick-action-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </Link>
        </div>
      </div>

      {/* Recent Cables Table */}
      <div className="card">
        <div
          className="card-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>
              Recent Cable Designs
            </h3>
            <span className="badge badge-neutral">{totalCables}</span>
          </div>
          <Link href="/dashboard/cables" className="btn btn-ghost btn-sm">
            View All →
          </Link>
        </div>
        <div
          className="table-wrapper"
          style={{ border: "none", borderRadius: 0 }}
        >
          <table className="table table-enhanced">
            <thead>
              <tr>
                <th>Cable Name</th>
                <th>Configuration</th>
                <th>Material</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentCables.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      padding: "3rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    <div style={{ marginBottom: "0.5rem" }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto", color: "var(--slate-300)" }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    No cables designed yet. Create your first design!
                  </td>
                </tr>
              ) : (
                recentCables.map((cable) => (
                  <tr key={cable.id} className="row-clickable">
                    <td>
                      <Link
                        href={`/dashboard/cables/${cable.id}`}
                        style={{
                          color: "var(--primary-600)",
                          fontWeight: 600,
                        }}
                      >
                        {cable.name}
                      </Link>
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
                      {cable.numberOfCores}C × {cable.areaMain}mm²
                    </td>
                    <td>
                      <span className="badge badge-neutral">{cable.conductorMaterial?.name || "—"}</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          cable.status === "APPROVED"
                            ? "badge-success"
                            : cable.status === "PENDING"
                            ? "badge-warning"
                            : cable.status === "REJECTED"
                            ? "badge-danger"
                            : "badge-neutral"
                        }`}
                      >
                        {cable.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div className="avatar avatar-sm avatar-blue" style={{ width: 24, height: 24, fontSize: "0.5625rem" }}>
                          {(cable.createdBy.name || "U").slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>{cable.createdBy.name}</span>
                      </div>
                    </td>
                    <td className="time-relative">
                      {cable.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
