"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import UserMenu from "@/components/UserMenu";

interface AppShellProps {
  children: React.ReactNode;
  user: { name: string; email: string; role: string };
}

const ADMIN_ROLES = ["ADMIN", "MANAGEMENT", "APPROVER"];

const BREADCRUMB_MAP: Record<string, string> = {
  dashboard: "Dashboard",
  design: "Design Workbench",
  cables: "Cable SKUs",
  standards: "Standards Master",
  custom: "Custom Rules",
  registry: "Parameter Registry",
  materials: "Materials",
  users: "User Management",
  profile: "My Profile",
};

export default function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const showAdmin = ADMIN_ROLES.includes(user.role);
  const showSystem = user.role === "ADMIN";

  // Generate breadcrumbs from pathname
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => ({
    label: BREADCRUMB_MAP[seg] || seg,
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">P</div>
          <div className="sidebar-brand">
            Parametric Engine
            <small>Cable Design Platform</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          {/* Section: Main */}
          <div className="sidebar-section">Main</div>

          <Link
            href="/dashboard"
            className={`sidebar-link${isActive("/dashboard") && pathname === "/dashboard" ? " active" : ""}`}
          >
            <span className="sidebar-link-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </span>
            Dashboard
          </Link>

          <Link
            href="/dashboard/design"
            className={`sidebar-link${isActive("/dashboard/design") ? " active" : ""}`}
          >
            <span className="sidebar-link-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </span>
            Design Workbench
          </Link>

          <Link
            href="/dashboard/cables"
            className={`sidebar-link${isActive("/dashboard/cables") ? " active" : ""}`}
          >
            <span className="sidebar-link-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                <path d="M18 14h-8" />
                <path d="M15 18h-5" />
                <path d="M10 6h8v4h-8V6Z" />
              </svg>
            </span>
            Cable SKUs
          </Link>

          {/* Section: Administration */}
          {showAdmin && (
            <>
              <div className="sidebar-section">Administration</div>

              <Link
                href="/dashboard/standards"
                className={`sidebar-link${isActive("/dashboard/standards") ? " active" : ""}`}
              >
                <span className="sidebar-link-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
                Standards Master
              </Link>

              <Link
                href="/dashboard/registry"
                className={`sidebar-link${isActive("/dashboard/registry") ? " active" : ""}`}
              >
                <span className="sidebar-link-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </span>
                Parameter Registry
              </Link>

              <Link
                href="/dashboard/materials"
                className={`sidebar-link${isActive("/dashboard/materials") ? " active" : ""}`}
              >
                <span className="sidebar-link-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  </svg>
                </span>
                Materials
              </Link>
            </>
          )}

          {/* Section: System */}
          {showSystem && (
            <>
              <div className="sidebar-section">System</div>

              <Link
                href="/dashboard/users"
                className={`sidebar-link${isActive("/dashboard/users") ? " active" : ""}`}
              >
                <span className="sidebar-link-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
                User Management
              </Link>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              v1.0.0 · GTP Engine
            </div>
            <span className="badge badge-primary" style={{ fontSize: "0.6rem" }}>Beta</span>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="app-content">
        <header className="app-header">
          {/* Breadcrumb */}
          <nav className="breadcrumb">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            {breadcrumbs.map((bc, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                {i > 0 && <span className="breadcrumb-separator">/</span>}
                {bc.isLast ? (
                  <span className="breadcrumb-current">{bc.label}</span>
                ) : (
                  <Link href={bc.href}>{bc.label}</Link>
                )}
              </span>
            ))}
          </nav>

          {/* Header right section */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {/* Notification bell placeholder */}
            <button className="btn btn-ghost btn-icon" style={{ position: "relative" }} title="Notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-secondary)" }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            <UserMenu user={user} />
          </div>
        </header>
        <div className="app-main">{children}</div>
      </div>
    </div>
  );
}
