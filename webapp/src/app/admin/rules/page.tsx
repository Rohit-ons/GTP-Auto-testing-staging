import { getRules, createRule, deleteRule } from "@/app/actions/rules";

export default async function RulesAdmin() {
  const rules = await getRules();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>Standard Rules</h1>
      </div>

      <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Add New Rule</h2>
        <form action={createRule} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Standard Ref</label>
            <input name="standardRef" required className="input" placeholder="e.g. IS 7098" />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Rule Type</label>
            <input name="ruleType" required className="input" placeholder="e.g. MIN_INSULATION_THICKNESS" />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Area Min (mm²)</label>
            <input name="areaMin" type="number" step="any" className="input" placeholder="Optional" />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Area Max (mm²)</label>
            <input name="areaMax" type="number" step="any" className="input" placeholder="Optional" />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Value</label>
            <input name="value" type="number" step="any" required className="input" placeholder="Rule Output Value" />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Description</label>
            <input name="description" className="input" placeholder="Short description" />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gridColumn: "span 2" }}>
            <button type="submit" className="btn btn-primary" style={{ width: "200px", padding: "0.6rem" }}>
              Save Rule
            </button>
          </div>
        </form>
      </div>

      <div className="glass-card" style={{ padding: "1.5rem", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
              <th style={{ padding: "1rem 0.5rem" }}>Standard</th>
              <th style={{ padding: "1rem 0.5rem" }}>Type</th>
              <th style={{ padding: "1rem 0.5rem" }}>Area Range</th>
              <th style={{ padding: "1rem 0.5rem" }}>Value</th>
              <th style={{ padding: "1rem 0.5rem" }}>Description</th>
              <th style={{ padding: "1rem 0.5rem", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map(rule => (
              <tr key={rule.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <td style={{ padding: "1rem 0.5rem", fontWeight: 500 }}>{rule.standardRef}</td>
                <td style={{ padding: "1rem 0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", background: "rgba(245, 158, 11, 0.2)", color: "var(--warning)", borderRadius: "4px" }}>
                    {rule.ruleType}
                  </span>
                </td>
                <td style={{ padding: "1rem 0.5rem", color: "var(--text-secondary)" }}>
                  {rule.areaMin || "-"} to {rule.areaMax || "-"}
                </td>
                <td style={{ padding: "1rem 0.5rem", fontWeight: 600 }}>{rule.value}</td>
                <td style={{ padding: "1rem 0.5rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>{rule.description || "-"}</td>
                <td style={{ padding: "1rem 0.5rem", textAlign: "right" }}>
                  <form action={deleteRule.bind(null, rule.id)}>
                    <button type="submit" style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "0.875rem" }}>
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                  No rules found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
