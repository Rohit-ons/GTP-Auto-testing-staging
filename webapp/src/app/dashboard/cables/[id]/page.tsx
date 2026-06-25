import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { approveCableForm } from "@/app/actions/cables";
import GtpSheetView from "@/components/GtpSheetView";
import ExportButton from "@/components/ExportButton";
import type { GtpSheet } from "@/lib/engine/types";

const APPROVER_ROLES = ["ADMIN", "APPROVER", "MANAGEMENT"];

export default async function CableDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const cable = await prisma.cableModel.findUnique({
    where: { id },
    include: { conductorMaterial: true, createdBy: true, approvedBy: true },
  });

  if (!cable) notFound();

  const sheet: GtpSheet | null = cable.computedJson ? JSON.parse(cable.computedJson) : null;
  const role = (session?.user as { role?: string })?.role;
  const canApprove = !!session?.user && APPROVER_ROLES.includes(role);
  const auditLogs = await prisma.auditLog.findMany({
    where: { entity: "CableModel", entityId: id },
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-header-title">{cable.name}</h1>
          <span className={`badge ${cable.status === "APPROVED" ? "badge-success" : "badge-warning"}`}>{cable.status}</span>
        </div>
        <div className="page-header-actions">
          {cable.status === "PENDING" && canApprove && (
            <form action={approveCableForm.bind(null, id)}>
              <button type="submit" className="btn btn-primary">Approve</button>
            </form>
          )}
          {sheet && <ExportButton sheet={sheet} fileName={cable.name} label="Export PDF" variant="outline" />}
          <Link href="/dashboard/cables" className="btn btn-outline">Back</Link>
        </div>
      </div>

      <div className="card" style={{ padding: "2rem" }}>
        {sheet ? <GtpSheetView sheet={sheet} /> : <p style={{ color: "var(--text-muted)" }}>No GTP snapshot stored for this SKU.</p>}
      </div>

      <p style={{ marginTop: "1rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
        Created by {cable.createdBy?.name ?? "-"} · Standard IS 7098-1 : {cable.standardEdition}
        {cable.approvedBy && ` · Approved by ${cable.approvedBy.name}`}
      </p>

      <div className="card" style={{ padding: "1.5rem", marginTop: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Audit Trail</h2>
        {auditLogs.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No audit entries.</p>
        ) : (
          <div className="table-wrapper">
            <table className="table" style={{ fontSize: "0.82rem" }}>
              <tbody>
                {auditLogs.map((a) => (
                  <tr key={a.id}>
                    <td style={{ color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{new Date(a.createdAt).toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>{a.action}</td>
                    <td>
                      {a.action === "OVERRIDE" ? `Row ${a.field} → ${a.newValue}${a.oldValue ? ` (${a.oldValue})` : ""}` : a.field ?? ""}
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>{a.user?.name ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
