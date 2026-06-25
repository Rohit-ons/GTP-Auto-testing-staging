"use client";

import { useState, useEffect, useCallback } from "react";
import {
  listUsers,
  createUser,
  updateUserRole,
  toggleUserActive,
} from "@/app/actions/users";
import { useSession } from "next-auth/react";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator", ENGINEER: "Engineer", SALES: "Sales",
  COSTING: "Costing", APPROVER: "Approver", MANAGEMENT: "Management",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "badge-danger", ENGINEER: "badge-primary", SALES: "badge-success",
  COSTING: "badge-violet", APPROVER: "badge-warning", MANAGEMENT: "badge-info",
};

const AVATAR_COLORS: Record<string, string> = {
  ADMIN: "avatar-violet", ENGINEER: "avatar-blue", SALES: "avatar-emerald",
  COSTING: "avatar-amber", APPROVER: "avatar-amber", MANAGEMENT: "avatar-blue",
};

const VALID_ROLES = ["ENGINEER", "SALES", "COSTING", "APPROVER", "MANAGEMENT", "ADMIN"];

type UserRow = {
  id: string; name: string | null; email: string | null; role: string;
  isActive: boolean; createdAt: string; lastLoginAt: string | null;
  department: string | null;
  _count: { cablesCreated: number; cablesApproved: number };
};

export default function UsersPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role;

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("ENGINEER");
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");

  const loadUsers = useCallback(async () => {
    const res = await listUsers();
    if (res.success && res.users) {
      setUsers(
        res.users.map((u: Omit<UserRow, "createdAt" | "lastLoginAt"> & { createdAt: string | Date, lastLoginAt: string | Date | null }) => ({
          ...u,
          createdAt: new Date(u.createdAt).toLocaleDateString(),
          lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : null,
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (userRole === "ADMIN") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadUsers().catch(() => setLoading(false));
    } else if (userRole !== undefined) {
      setLoading(false);
    }
  }, [userRole, loadUsers]);

  if (userRole !== "ADMIN") {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h3 className="empty-state-title">Access Denied</h3>
        <p className="empty-state-description">Only administrators can manage users.</p>
      </div>
    );
  }

  const filtered = users.filter((u) => {
    const matchSearch = !search || (u.name || "").toLowerCase().includes(search.toLowerCase()) || (u.email || "").toLowerCase().includes(search.toLowerCase());
    const matchRole = !filterRole || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const activeCount = users.filter(u => u.isActive).length;
  const roleCounts = VALID_ROLES.reduce((acc, r) => { acc[r] = users.filter(u => u.role === r).length; return acc; }, {} as Record<string, number>);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateMsg("");
    const res = await createUser({ name: newName, email: newEmail, role: newRole });
    if (res.success) {
      setCreateMsg(`User created! Temp password: ${res.tempPassword}`);
      setNewName(""); setNewEmail(""); setNewRole("ENGINEER");
      loadUsers();
      setTimeout(() => setShowCreate(false), 4000);
    } else {
      setCreateMsg(res.error || "Error");
    }
    setCreating(false);
  };

  const handleRoleChange = async (userId: string, role: string) => {
    await updateUserRole(userId, role);
    loadUsers();
  };

  const handleToggleActive = async (userId: string) => {
    const res = await toggleUserActive(userId);
    if (!res.success) alert(res.error);
    loadUsers();
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-header-title">User <span className="text-gradient">Management</span></h1>
          <p className="page-header-subtitle">Manage team members, roles, and access permissions</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add User
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="kpi-inline-row">
        <div className="kpi-inline-item">
          <span className="kpi-inline-value">{users.length}</span>
          <span className="kpi-inline-label">Total Users</span>
        </div>
        <div className="kpi-inline-item">
          <span className="kpi-inline-value" style={{ color: "var(--emerald-600)" }}>{activeCount}</span>
          <span className="kpi-inline-label">Active</span>
        </div>
        <div style={{ display: "flex", gap: "0.375rem", alignItems: "center", flexWrap: "wrap" }}>
          {VALID_ROLES.filter(r => roleCounts[r] > 0).map(r => (
            <span key={r} className={`badge ${ROLE_COLORS[r]}`} style={{ fontSize: "0.625rem" }}>
              {ROLE_LABELS[r]}: {roleCounts[r]}
            </span>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input className="input" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="select filter-select" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="">All Roles</option>
          {VALID_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
        <span className="badge badge-neutral">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="table-wrapper" style={{ border: "none" }}>
          <table className="table table-enhanced">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Department</th>
                <th>Designs</th>
                <th>Joined</th>
                <th>Last Login</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "3rem" }}><span className="spinner" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state" style={{ padding: "2rem" }}>
                      <h3 className="empty-state-title">No users found</h3>
                      <p className="empty-state-description">Try adjusting your search or role filter</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} style={{ opacity: u.isActive ? 1 : 0.6 }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div className={`avatar avatar-sm ${AVATAR_COLORS[u.role] || "avatar-blue"}`}>
                          {(u.name || "U").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{u.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        className="select"
                        style={{ width: "auto", fontSize: "0.8125rem", padding: "0.25rem 2rem 0.25rem 0.5rem" }}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        {VALID_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${u.isActive ? "badge-success" : "badge-danger"}`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
                      {u.department || "—"}
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 500 }}>
                      {u._count.cablesCreated}
                    </td>
                    <td className="time-relative">{u.createdAt}</td>
                    <td style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{u.lastLoginAt || "Never"}</td>
                    <td>
                      <button
                        className={`btn btn-sm ${u.isActive ? "btn-ghost" : "btn-success"}`}
                        onClick={() => handleToggleActive(u.id)}
                        title={u.isActive ? "Deactivate" : "Activate"}
                      >
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Add New User</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {createMsg && (
                  <div className={`alert ${createMsg.includes("created") ? "alert-success" : "alert-danger"}`}>
                    {createMsg}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="Enter full name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input type="email" className="input" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required placeholder="name@company.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select className="select" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                    {VALID_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                  <span className="form-hint">Determines what areas of the platform the user can access</span>
                </div>
                <div className="alert alert-info">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  A temporary password will be auto-generated and shown after creation.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? <><span className="spinner spinner-sm" /> Creating...</> : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
