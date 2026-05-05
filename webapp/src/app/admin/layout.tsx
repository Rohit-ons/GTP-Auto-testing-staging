import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "ADMIN") {
    // Redirect non-admins or unauthenticated users
    redirect("/api/auth/signin"); // Or a custom unauthorized page
  }

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 4rem)" }}>
      {/* Sidebar */}
      <aside style={{ width: "250px", borderRight: "1px solid var(--border-color)", padding: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "2rem" }}>Admin Panel</h2>
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <Link href="/admin" className="nav-link">
            Dashboard Overview
          </Link>
          <Link href="/admin/materials" className="nav-link">
            Materials
          </Link>
          <Link href="/admin/rules" className="nav-link">
            Standard Rules
          </Link>
          <Link href="/admin/cables" className="nav-link">
            All Cable SKUs
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}
