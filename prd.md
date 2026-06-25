# Product Requirements Document — Parametric Cable Model & GTP Costing Generator

| | |
|---|---|
| **Product** | Parametric Cable Model & GTP Costing Generator |
| **Version** | 2.0 (full-scale rewrite of the original `deep-research-report.md` PRD) |
| **Status** | Draft — **v1 scope locked to technical GTP generator only** (costing deferred to Phase 2, decision D5). GTP template fully reverse-engineered (`GTP-TEMPLATE-SPEC.md`). |
| **Owner** | Rohit (Open Network Solutions) |
| **Date** | 2026-06-05 |
| **Related docs** | `SOLUTION-ARCHITECTURE-ANALYSIS.md` (parameter taxonomy + architecture analysis), `deep-research-report.md` (v1 research), `AGENT_HANDOVER.md` |

---

## 1. Executive Summary

A web application that lets a cable-manufacturing engineer **tweak a small set of design parameters per client requirement and instantly generate a standards-compliant GTP (Guaranteed Technical Particulars) sheet and a cost/quotation sheet**. It replaces error-prone manual Excel sheets with an auditable, version-controlled engine.

The architecture is **metadata-driven**: every cable parameter is a configurable entity in a **Parameter Registry**, each mapped to (a) the governing **IS standard clause/table** and (b) a **formula or lookup** that derives or validates it. Admins can add, edit, or remove parameters without code changes. The **GTP output is generated to an exact template** reverse-engineered from the company's existing sheets (`GTP-TEMPLATE-SPEC.md`).

**v1 scope (D5):** ship the **technical GTP generator** to exact template. **Costing/BOM/quote-pricing is Phase 2** — designed for, but not built in v1 (no pricing data exists in the supplied sheets). **Core unit (D6):** one SKU = one cable size; comparative multi-size rendering is a later presentation feature.

**North-star outcome:** a correct, standards-compliant GTP sheet for a tweaked SKU in **under 5 minutes**, fully reproducible and audit-traceable.

---

## 2. Goals & Non-Goals

### 2.1 Goals (v1 — GTP generator)
- G1. Let an engineer produce a **technical GTP sheet** by changing only the "design knobs" (≈16 inputs).
- G2. Auto-derive all dependent dimensions/electrical values from standards + formulas.
- G3. Auto-fetch standard dimensions (insulation/sheath/armour) — overridable but **audited**.
- G4. Make **every parameter configurable** (add/edit/delete) and mapped to an IS clause + formula (Registry).
- G5. Output the GTP to the **exact 38-row template** of the company's existing sheets (PDF + Excel).
- G6. Support **standard versioning** (e.g. IS 7098-1 /1988 vs /2025) pinned per SKU.
- G7. Make every saved SKU/GTP a **reproducible, immutable, audited snapshot**.
- G8. Hardened RBAC, with **cost-visibility roles designed in** for Phase 2 (no cost data yet).

### 2.2 Phase 2 (designed-for, not built in v1)
- P2-1. **Costing engine:** material-up cost build-up (per-layer mass × BOM price) → final price.
- P2-2. BOM/Cost master, conversion rates, margin, LME-linked Cu/Al pricing.
- P2-3. Role-gated cost/margin visibility (Sales/Costing/Management).
- P2-4. Comparative multi-size GTP/BOQ rendering (composing N single SKUs).

### 2.3 Non-Goals
- NG1. Not a multi-tenant public SaaS (single-company internal tool).
- NG2. Not a full ERP / production-scheduling / inventory system.
- NG3. MV (IS 7098-2) and additional families beyond those observed are post-v1 unless §16 says otherwise.

---

## 3. Personas & Roles (RBAC)

| Role | Sees cost/margin? | Core capability |
|------|-------------------|-----------------|
| **Engineer** | ❌ No | Create/edit cable designs, generate technical GTP, run compliance checks |
| **Sales** | ✅ Yes | Build quotes from designs, set margin, generate costing sheet, manage clients |
| **Costing / Estimation** | ✅ Yes | Maintain BOM/price master, conversion rates, validate cost build-up |
| **Approver** | ✅ (configurable) | Review & approve designs/quotes; the current ADMIN-only-layout bug must be fixed so this role actually works |
| **Management** | ✅ Yes (read) | Dashboards, margins, win/loss, exposure to LME |
| **Admin** | ✅ Yes | Manage Parameter Registry, Standards Master, users, system config |

> **Cost confidentiality is a hard requirement:** cost & margin fields are server-side gated by role; the technical GTP path never leaks pricing to Engineer-only sessions.

---

## 4. Core Architectural Principle — The Parameter Registry (D1)

Everything in the product is described by **Parameter Definitions**, not hardcoded columns.

A **ParameterDefinition** has:
- `key`, `displayName`, `unit`, `group` (Conductor / Insulation / Inner Sheath / Armour / Outer Sheath / Commercial / Electrical / Dimensional / Weight / Cost)
- `bucket`: `INPUT` (user-tweakable) | `CALCULATED` (derived) | `MASTER` (fetched)
- `standardMapping`: `{ standard, clause, tableRef }` — the IS source of truth (nullable for pure-commercial params)
- `derivation`: for CALCULATED → `formulaKey` + input parameter keys; for MASTER → `lookupKey` + lookup key columns (area / diameter band / cores / material / class / voltage)
- `validation`: min/max/tolerance rule (often itself standard-mapped)
- `visibilityRole`: which roles can see it (e.g. cost params → Sales/Costing/Management/Admin)
- `active`, `version`, `order`

**Why this matters:** to add (say) "dielectric loss angle" or a new sheath type, an admin adds a ParameterDefinition, points it at the IS clause and a formula/lookup, and it appears in the workbench, GTP, and engine automatically — **no deployment**.

**Engine consequence:** the Calculation, Standards-Lookup, and Costing engines are **interpreters over the registry** (topologically resolving CALCULATED params by their dependency graph), not a fixed sequence of function calls.

---

## 5. Functional Requirements

### 5.1 Design Workbench
- FR-1. Present only the **INPUT** parameters (Bucket A) as editable controls, grouped.
- FR-2. On every change, resolve the dependency graph and recompute all CALCULATED params live.
- FR-3. Fetch all MASTER params from the Standards Master by the resolved keys (area, running diameter, cores, material, class, voltage).
- FR-4. Show MASTER dimensions as **read-only with an "override" affordance**; an override captures a reason and is flagged + audited (D3).
- FR-5. Show compliance status per parameter (OK / warning / violation) with the cited IS clause.
- FR-6. Support loading a **base SKU** and tweaking it (the primary "per-client" loop).

### 5.2 Standards Master (admin)
- FR-7. Store IS dimension tables as **versioned data** (insulation thk, sheath thk, armour dims, resistances, min-wires, kt factors, current ratings, K-factors).
- FR-8. Support **multiple standard versions / amendments** and **customer spec profiles** (e.g. MSEDCL Schedule-A) layered over base IS (per §16 Q11).
- FR-9. Bulk import via Excel; every edit is versioned and audited.

### 5.3 BOM / Cost Master (admin / costing)
- FR-10. Maintain versioned **price lists** (Cu, Al, XLPE, PVC grades, GI armour, fillers, tapes) with effective dates.
- FR-11. Maintain **conversion/process rates** (per kg / per layer / per km), **scrap %**, overheads, packing-by-size, testing, freight, GST, default margin.
- FR-12. Support **LME + FX inputs** (manual snapshot in v1; feed optional later).
- FR-13. Each quote pins a **price-list snapshot** for reproducibility.

### 5.4 GTP Engine (D2 — sheet-driven; single SKU per D6)
- FR-14. Generate the **technical GTP sheet** for one SKU to the **exact 38-row template** (`GTP-TEMPLATE-SPEC.md`), with variant row toggles (FRLS/FRLSH test rows, armoured/unarmoured N/A, Nom-only vs Nom/Min).
- FR-15. Compose the **Cable Type description string** and header/footer text from the SKU's selections + standard version.
- FR-16. Export: **PDF GTP** and **Excel GTP** mirroring the source files (letterhead, signatory, notes).
- _Phase 2:_ per-layer mass/km + cost build-up; cost rows rendered only for cost-authorized roles; comparative multi-size rendering.

### 5.5 Workflow & Output
- FR-17. Workflow: `DRAFT → PENDING → APPROVED` (+ `REVISED`); fix the current APPROVER-can't-access bug.
- FR-18. Saved SKU/GTP = **immutable snapshot** `{inputs, standardVersionId, engineVersion, outputs}` (price snapshot added in Phase 2).

### 5.6 Audit & Versioning
- FR-21. Full audit log (actor, entity, field, old→new, timestamp) on every master, design, and quote change.
- FR-22. Any historical quote can be **re-opened and reproduces identical numbers**.

### 5.7 Dashboards
- FR-23. KPI dashboards (see §9), role-scoped.

---

## 6. Non-Functional Requirements
- NFR-1. **Accuracy:** engine output within ±1% of reference datasheets/IS tables (regression-tested).
- NFR-2. **Performance:** live recompute < 200 ms; quote generation < 2 s.
- NFR-3. **Auditability/Reproducibility:** hard requirement (tender/regulated context).
- NFR-4. **Security:** server-side RBAC; cost data never sent to unauthorized clients; HTTPS; hashed creds.
- NFR-5. **Configurability:** new parameter live without code deploy (registry-driven).
- NFR-6. **Reliability:** 99.9% uptime target; no silent calc failures (typed, validated).
- NFR-7. **Usability:** new quote in < 5 min; tablet-responsive.
- NFR-8. **Data integrity:** strict Zod validation on all inputs and master imports.

---

## 7. Formulas & Lookups (engine spec)

Calculated (B) and master (C) parameters, keyed to registry `formulaKey` / `lookupKey`. (Full derivations and table sources in `SOLUTION-ARCHITECTURE-ANALYSIS.md` §1 & §7.)

**Geometry:** conductor dia `d=√(4A/π)` (or IS 10462 fictitious for shaped); strand dia `√(4A/(πN))` (N from IS 8130 Table 2); core dia `d+2·t_ins`; assembly `×k(cores)`; OD = running build-up with each thickness fetched from IS 7098 Tables 5/6/8 keyed by the running diameter.

**Electrical:** `R20=ρ/A×1000` **clamped to IS 8130 max (authoritative on GTP)**; `R90=R20(1+α·70)` (+skin/proximity per scope); `Iₖ=K·A/√t` (Al 0.094 / Cu 0.125); reactance/capacitance/voltage-drop/current-rating per confirmed depth (§16 Q18).

**Mechanical:** bending radius `12×OD`; pulling tension `9×D²`.

**Mass:** per layer `mass_kg/km = annular_area × density × 10⁻³`; total `W=Σ`.

**Cost build-up (template-calibrated against the sheets — D2):**
```
material   = Σ(mass_layer × unit_price)
conversion = Σ(process_rate × basis)
scrap      = material × scrap_%
factory    = material + conversion + scrap + overhead
ex_works   = factory × (1 + margin_%)
total      = ex_works × length + packing + testing + freight
invoiced   = total × (1 + GST_%)
```

---

## 8. Data Model (target)

**Registry & standards**
- `ParameterDefinition` (§4) · `ParameterDependency` (edges for the calc graph)
- `StandardTable` (versioned) · `StandardTableRow` (keyType AREA|DIAMETER_BAND|CORES, keyMin/Max, material/class/voltage, valueJson)
- `SpecProfile` (customer overrides layered on IS) · `SpecProfileRow`

**Materials & cost**
- `Material` (extend: keep density/resistivity20/alpha) · `PriceList` (versioned) · `PriceItem` · `ProcessRate` · `CostingParam`

**Design & quote**
- `CableModel` → becomes a thin header + `parameterValuesJson` (registry-driven) instead of fixed columns; keep relations for material FKs and workflow.
- `Quote` (cableModelId, priceListId, standardVersionId, qty, drumLength, marginPct, **outputsJson immutable**, status, client, tenderRef, createdBy, approvedBy)
- `User` (extend role enum: ENGINEER, SALES, COSTING, APPROVER, MANAGEMENT, ADMIN)
- `AuditLog`

> **Migration note:** moving `CableModel` from fixed columns to a registry-driven `parameterValuesJson` is the central schema change; provide a migration + keep indexed columns for the few always-queried fields (area, cores, voltage, status).

---

## 9. KPIs / Success Metrics
- **Speed:** avg quote time (<5 min), quotes/engineer/day.
- **Accuracy:** ±1% vs reference; compliance pass rate.
- **Business:** quote→win %, avg margin %, LME exposure, revisions/quote.
- **Ops:** approval cycle time, master-data freshness, audit completeness.
- **Adoption:** active users by role, SKUs, exports.

---

## 10. UX / UI
- **Design Workbench** (inputs left, live results + compliance right; fetched dimensions read-only w/ audited override).
- **Costing drawer** (role-gated): layer→material→kg/km→₹/kg→₹/km, conversion, overhead, margin slider, totals; price-snapshot selector.
- **GTP & Costing preview** styled to the exact company template.
- **Admin consoles:** Parameter Registry editor (map param→IS clause + formula), Standards Master grid, BOM/Cost Master grid — all versioned, Excel-importable.
- **Quote list, approval queue, audit timeline, dashboards.**
- IS-clause tooltips; tablet-responsive.

---

## 11. Technology Stack
Next.js 15/16 (App Router) + React 19 + TypeScript · Prisma + PostgreSQL · NextAuth (hardened RBAC) · **Zod** (validation) · pure-function **engine module + Vitest** regression tests vs IS references · `xlsx` (import + costing export) · Puppeteer/React-PDF (GTP) · TanStack Query (live workbench). Engine is registry-interpreting with a dependency-graph resolver.

---

## 12. Phasing / Milestones

**v1 (technical GTP generator):**
- **M0 — Foundations:** fix known bugs (APPROVER layout, FormData actions, missing imports); harden RBAC (roles incl. cost-gated ones, even though cost is Phase 2).
- **M1 — Parameter Registry + Standards Master:** registry model + dependency-graph resolver; digitise IS 7098/8130 tables for the families/sizes in `GTP-TEMPLATE-SPEC.md` §3; workbench reading the registry; standard versioning (1988/2025).
- **M2 — GTP engine + exact-template export:** render the 38-row template per `GTP-TEMPLATE-SPEC.md` with variant toggles; PDF + Excel output matching the source files; SKU snapshot + audit + workflow.

**Phase 2:** Costing/BOM master, cost roll-up, cost-gated rendering, comparative multi-size BOQ, spec profiles, MV/other families.

---

## 13. Assumptions
Per `SOLUTION-ARCHITECTURE-ANALYSIS.md` §11 (AS1–AS10) and §11b decisions (D1–D4).

## 14. Risks & Mitigations
- **Sheet template ambiguity** → must reverse-engineer carefully; mitigate by getting all sheet variants + a worked example (§16).
- **Standards digitisation errors** → validate every table against the PDF + a reference datasheet; version-control.
- **Registry complexity / circular formulas** → dependency-graph validation, cycle detection, admin guardrails.
- **Cost leakage** → server-side role gating + tests asserting no cost in Engineer payloads.
- **LME volatility** → snapshot pricing per quote; show price date on every quote.
- **Migration risk** (fixed→registry schema) → staged migration + keep hot columns indexed.

## 15. Out-of-the-box compliance references
IS 7098-1:1988 (+ amendments), IS 8130:1984, IS 5831:1984, IS 3975, IS 10462, IS 10810; IEC 60228/60287/60502/60332 as secondary. The MSEDCL `SPEC-1-core-LTXLPESPEC2006` is the worked tender-spec example for the GTP layout.

---

## 16. Open Items — BLOCKING & to resolve before M2

> These map to `SOLUTION-ARCHITECTURE-ANALYSIS.md` §12. The starred ones block the costing/GTP build.

- ✅ **OI-1a (RESOLVED).** GTP sheets received (8 files, Polyvion/POLYCORE). Canonical 38-row template + full element-identity mapping in `GTP-TEMPLATE-SPEC.md`. Engine logic validated against real data.
- ✅ **OI-1b (RESOLVED, D5).** v1 = **technical GTP only**; costing deferred to Phase 2. Costing-template sample needed only when Phase 2 starts.
- ✅ **OI-11 (RESOLVED, D6).** Core unit = **single SKU per sheet**; comparative columns are a Phase-2 presentation feature.
- OI-2. Confirm cost build-up line items vs §7 (anything missing?).
- OI-3. Cu/Al pricing: manual snapshot vs live LME feed.
- OI-4. Conversion cost basis: per-kg / per-step / per-km; share existing rate cards.
- OI-5. Margin model: single % vs layered; per-client overrides.
- OI-6. Standards digitisation breadth: full tables now vs sizes-you-sell first.
- OI-7. Spec-profile overrides (e.g. MSEDCL) as selectable layer — confirm.
- OI-8. Final quote lifecycle (Won/Lost/Production) + approval depth.
- OI-9. Electrical depth for v1 (reactance/capacitance/Vdrop/current-rating?).
- OI-10. IS 10462 fictitious-diameter needed for shaped conductors in v1?
- OI-11. Multi-size BOQ per quote vs one SKU per quote.
- OI-12. Reference datasheets to validate engine to ±1%.
- OI-13. Deployment target, concurrency, data-residency.

---

_This PRD is intentionally registry-first so the product can grow parameter-by-parameter, each tied to its IS source and formula. The costing/GTP-template sections will be finalised to exact fidelity once the comparative sheets (OI-1) are provided._
