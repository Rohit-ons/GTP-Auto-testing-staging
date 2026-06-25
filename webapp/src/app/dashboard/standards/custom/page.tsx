import { getCustomRules, createCustomRule, toggleCustomRule, deleteCustomRule } from "@/app/actions/customRules";

const KNOWN_PARAMETERS = [
  { key: "conductor.maxResistance20",       unit: "Ω/km",  condHint: '{"material":"AL","area":185}' },
  { key: "conductor.minWires",              unit: "nos",   condHint: '{"material":"AL","area":185}' },
  { key: "insulation.nominalThickness",     unit: "mm",    condHint: '{"type":"XLPE","voltage":1100,"area":185}' },
  { key: "innerSheath.minThickness",        unit: "mm",    condHint: '{"diaMin":35,"diaMax":45}' },
  { key: "outerSheath.minThickness",        unit: "mm",    condHint: '{"diaMin":40,"diaMax":45}' },
  { key: "outerSheath.nominalThickness",    unit: "mm",    condHint: '{"diaMin":40,"diaMax":45}' },
  { key: "armour.dimension",                unit: "mm",    condHint: '{"type":"FLAT_STRIP","diaMin":40,"diaMax":9999}' },
];

export default async function CustomRulesAdmin() {
  const { standards, rules } = await getCustomRules();

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Custom <span className="text-gradient">Standard Rules</span></h1>
        <p>
          Add ANY IS standard rule manually without code: pick a parameter, attach it to an IS standard, specify the condition (material / voltage / area band / diameter band as JSON), and give the value. Active rules <strong>override</strong> the built-in IS tables (lowest <em>priority</em> wins).
        </p>
      </div>

      {/* Add form */}
      <div className="card" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "1rem" }}>Add Rule</h2>
        <form action={createCustomRule} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label">Standard (source)</label>
            <select name="standardId" required className="input">
              {standards.map((s) => <option key={s.id} value={s.id}>{s.code} : {s.edition}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Parameter Key</label>
            <select name="parameterKey" required className="input">
              {KNOWN_PARAMETERS.map((p) => <option key={p.key} value={p.key}>{p.key} ({p.unit})</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label">Condition (JSON)</label>
            <input name="conditionJson" required className="input" placeholder='e.g. {"material":"AL","area":185}  or  {"diaMin":40,"diaMax":45}' />
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Supported keys: <code>material</code>, <code>area</code>, <code>voltage</code>, <code>type</code>, <code>areaMin/areaMax</code>, <code>diaMin/diaMax</code>. Bands are exclusive at the low end, inclusive at the high end.
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Value</label>
            <input name="valueText" required className="input" placeholder='e.g. 1.88  or  4.00 x 0.80' />
          </div>
          <div className="form-group">
            <label className="form-label">Priority (lower wins)</label>
            <input name="priority" type="number" defaultValue={100} className="input" />
          </div>
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label">Description / Clause reference</label>
            <input name="description" className="input" placeholder="e.g. IS 7098-1 cl.14.3 Table 8 col 4 (custom amendment)" />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <button type="submit" className="btn btn-primary" style={{ padding: "0.6rem 1.2rem" }}>Add Custom Rule</button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "1rem" }}>Active &amp; Inactive Rules ({rules.length})</h2>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Parameter</th><th>Standard</th><th>Condition</th>
                <th>Value</th><th>Prio</th><th>Description</th><th /><th />
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontFamily: "monospace", fontSize: "0.76rem" }}>{r.parameterKey}</td>
                  <td>{r.standard.code} : {r.standard.edition}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.74rem", color: "var(--text-secondary)" }}>{r.conditionJson}</td>
                  <td style={{ fontWeight: 600 }}>{r.valueText}</td>
                  <td>{r.priority}</td>
                  <td style={{ color: "var(--text-secondary)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.description ?? ""}>{r.description ?? "—"}</td>
                  <td>
                    <form action={toggleCustomRule.bind(null, r.id)}>
                      <button type="submit" style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "0.8rem", color: r.isActive ? "var(--accent)" : "var(--text-muted)" }}>
                        {r.isActive ? "● Active" : "○ Off"}
                      </button>
                    </form>
                  </td>
                  <td>
                    <form action={deleteCustomRule.bind(null, r.id)}>
                      <button type="submit" className="btn btn-danger btn-sm">Del</button>
                    </form>
                  </td>
                </tr>
              ))}
              {rules.length === 0 && (
                <tr><td colSpan={8} className="empty-state">No custom rules yet — the engine uses the seeded IS tables as-is.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
