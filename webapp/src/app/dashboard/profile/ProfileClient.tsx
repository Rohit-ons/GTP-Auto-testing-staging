"use client";

import { useState } from "react";
import { updateProfile, changePassword } from "@/app/actions/users";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator", ENGINEER: "Engineer", SALES: "Sales",
  COSTING: "Costing", APPROVER: "Approver", MANAGEMENT: "Management"
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "badge-danger", ENGINEER: "badge-primary", SALES: "badge-success",
  COSTING: "badge-violet", APPROVER: "badge-warning", MANAGEMENT: "badge-info"
};

interface UserProfile {
  id: string; name: string | null; email: string | null; role: string;
  createdAt: string; lastLoginAt: string | null;
  department: string | null; phone: string | null;
  _count: { cablesCreated: number; cablesApproved: number };
}

export default function ProfileClient({ user }: { user: UserProfile }) {
  const [name, setName] = useState(user.name || "");
  const [department, setDepartment] = useState(user.department || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMessage, setPwdMessage] = useState("");
  
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMessage("");
    const res = await updateProfile(name);
    setMessage(res.success ? "Profile updated successfully!" : (res.error || "Error"));
    setSaving(false);
  };
  
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) { setPwdMessage("Passwords do not match"); return; }
    setPwdSaving(true); setPwdMessage("");
    const res = await changePassword(currentPwd, newPwd);
    setPwdMessage(res.success ? "Password changed successfully!" : (res.error || "Error"));
    if (res.success) { setCurrentPwd(""); setNewPwd(""); setConfirmPwd(""); }
    setPwdSaving(false);
  };
  
  const initials = (user.name || "U").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  
  return (
    <div style={{ maxWidth: 800 }}>
      {/* Profile Banner */}
      <div style={{
        background: "linear-gradient(135deg, var(--primary-600), var(--violet-500))",
        borderRadius: "var(--radius-xl)",
        padding: "2rem 2.5rem",
        marginBottom: "1.5rem",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{
          position: "absolute", right: "-30px", top: "-30px", width: "150px", height: "150px",
          borderRadius: "50%", background: "rgba(255,255,255,0.08)",
        }} />
        <div style={{
          position: "absolute", right: "80px", bottom: "-40px", width: "100px", height: "100px",
          borderRadius: "50%", background: "rgba(255,255,255,0.05)",
        }} />
        
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", position: "relative", zIndex: 1 }}>
          <div style={{
            width: "80px", height: "80px", borderRadius: "var(--radius-full)",
            background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.5rem", fontWeight: 800, color: "white",
            border: "3px solid rgba(255,255,255,0.3)",
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <h2 style={{ color: "white", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>
              {user.name || "User"}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
              {user.email}
            </p>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <span className={`badge ${ROLE_COLORS[user.role] || 'badge-neutral'}`} style={{ fontSize: "0.6875rem" }}>
                {ROLE_LABELS[user.role] || user.role}
              </span>
              {user.department && (
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.8125rem" }}>
                  · {user.department}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Activity Stats */}
      <div className="grid gap-lg mb-3" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="kpi-card kpi-blue">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Designs Created</span>
            <div className="kpi-card-icon icon-blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
          </div>
          <div className="kpi-card-value">{user._count.cablesCreated}</div>
        </div>
        <div className="kpi-card kpi-emerald">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Designs Approved</span>
            <div className="kpi-card-icon icon-emerald">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
          </div>
          <div className="kpi-card-value">{user._count.cablesApproved}</div>
        </div>
        <div className="kpi-card kpi-violet">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Member Since</span>
            <div className="kpi-card-icon icon-violet">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
          </div>
          <div className="kpi-card-value" style={{ fontSize: "1.125rem", fontWeight: 600 }}>
            {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </div>
        </div>
      </div>

      {/* Account Security */}
      <div className="card mb-3" style={{ overflow: "hidden" }}>
        <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div className="kpi-card-icon icon-amber" style={{ width: 28, height: 28 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Account Security</h3>
        </div>
        <div className="card-body">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border-light)" }}>
            <div>
              <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>Last Login</div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}
              </div>
            </div>
            <span className="badge badge-success">Secure</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.75rem" }}>
            <div>
              <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>Account Status</div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Your account is active and in good standing</div>
            </div>
            <span className="badge badge-success">Active</span>
          </div>
        </div>
      </div>
      
      {/* Edit Profile */}
      <div className="card mb-3" style={{ overflow: "hidden" }}>
        <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div className="kpi-card-icon icon-blue" style={{ width: 28, height: 28 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Edit Profile</h3>
        </div>
        <div className="card-body">
          {message && <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-danger'} mb-2`}>{message}</div>}
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} required placeholder="Enter your full name" />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="input" value={user.email || ""} disabled />
                <span className="form-hint">Email cannot be changed</span>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="input" value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Engineering, Quality, Sales" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +91 98765 43210" />
              </div>
            </div>
            <div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><span className="spinner spinner-sm" /> Saving...</> : "Update Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Change Password */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div className="kpi-card-icon icon-red" style={{ width: 28, height: 28 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Change Password</h3>
        </div>
        <div className="card-body">
          {pwdMessage && <div className={`alert ${pwdMessage.includes('success') ? 'alert-success' : 'alert-danger'} mb-2`}>{pwdMessage}</div>}
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input type="password" className="input" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} required placeholder="Enter your current password" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="input" value={newPwd} onChange={e => setNewPwd(e.target.value)} required minLength={6} placeholder="Min. 6 characters" />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input type="password" className="input" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required placeholder="Re-enter new password" />
              </div>
            </div>
            <div>
              <button type="submit" className="btn btn-outline" disabled={pwdSaving}>
                {pwdSaving ? <><span className="spinner spinner-sm" /> Changing...</> : "Change Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
