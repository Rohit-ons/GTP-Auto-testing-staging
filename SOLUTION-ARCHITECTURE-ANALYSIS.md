# Solution Architecture Analysis — Parametric Cable Model & GTP Costing Generator

> **Purpose of this document.** This is a pre-PRD working analysis produced by acting as a Technical Solutions Architect over (a) the existing codebase, (b) the existing `deep-research-report.md` (the original PRD draft), (c) the three standards PDFs (IS 7098-1:1988, IS 8130:1984), and (d) the MSEDCL technical specification (`SPEC-1-core-LTXLPESPEC2006.pdf`).
>
> It exists to do three things before we write the new `prd.md`:
> 1. Classify **every parameter** into one of three buckets: **(A) user-tweakable**, **(B) auto-calculated** (with formula), **(C) master-fetched** (standards master or internal BOM/cost master).
> 2. Lay out the **full target architecture** — inputs, outputs, UI/UX, backend logic, data workflows, KPIs, formulas, DB schema, tech stack.
> 3. **Flag every assumption and unknown** so they can be resolved by structured questions (Section 12) rather than guessed.
>
> **Primary use case driving this design:** _"Quickly tweak the changeable parameters per client needs, then generate a GTP (Guaranteed Technical Particulars) + costing sheet."_ Everything below is optimised for that loop.

---

## 0. Context Recap (what exists today)

**Stack (as built):** Next.js 15/16 (App Router) + React 19 + TypeScript · Prisma ORM → SQLite (dev) / PostgreSQL (prod) · NextAuth v4 (credentials + bcrypt, JWT) · Recharts · Puppeteer (PDF) · `xlsx` (bulk import).

**Current data model (`prisma/schema.prisma`):** `User` (ADMIN/ENGINEER/APPROVER), `Material` (density, resistivity20, alpha), `StandardRule` (areaMin/areaMax/voltage/value), `CableModel` (full construction + 4 cached computed fields).

**Current calculation engine (`calculation.ts`)** implements only 5 functions: DC resistance (ρ/A), AC resistance (temp correction), approx conductor diameter (√(4A/π)), overall diameter (with hardcoded stranding factors 2.154/2.414/2.5), short-circuit (K·A/√t).

**Current design form (`DesignFormClient.tsx`)** lets the user *freely type* every thickness (insulation, inner sheath, armour, outer sheath) — there is **no standards lookup** and **no costing** at all today.

**Key gaps relative to the stated use case:**
- ❌ No costing / BOM / pricing engine of any kind.
- ❌ No GTP document output (only a basic datasheet PDF).
- ❌ Standards data lives as a handful of seeded `StandardRule` rows (exact-match only), not as the real IS 7098 / IS 8130 dimension tables.
- ❌ Dimensions are typed by the user instead of fetched from standards (wrong direction for a guaranteed-particulars tool).
- ❌ Rules engine exists but is never called from the UI.

---

## 1. The Core Insight: Three Parameter Buckets

The whole product hinges on correctly separating these. Below is the **complete parameter inventory**, classified.

### Bucket A — User-Tweakable Inputs (the "design knobs")
These are the *only* fields a user should touch per client. Everything else derives from them.

| # | Parameter | Type / Options | Notes |
|---|-----------|----------------|-------|
| A1 | Number of cores | 1, 2, 3, 3.5, 4, 5, n | "3.5" = 3 phase + 1 reduced neutral |
| A2 | Conductor material | Copper / Aluminium | Drives resistivity, density, price |
| A3 | Conductor nominal area — phase | mm² (1.5…1000) | The master design variable |
| A4 | Conductor nominal area — neutral | mm² (for 3.5C / reduced neutral) | Auto-suggested from phase area, overridable |
| A5 | Conductor class | Class 1 (solid) / Class 2 (stranded) / 5 / 6 (flexible) | Per IS 8130 |
| A6 | Conductor shape | Circular / Shaped (sector) / Compacted circular | Affects fictitious diameter |
| A7 | Voltage grade | 1.1 kV (LV) [MV later] | Drives insulation thickness table |
| A8 | Insulation material | XLPE / PVC / others | XLPE default for this product |
| A9 | Armoured? | Yes / No | If yes → armour layers added |
| A10 | Armour type | Round wire (GS) / Flat strip (GS) / Non-magnetic | Per IS 7098 cl.6 |
| A11 | Inner sheath method | Extruded / Taped / None | Per IS 7098 cl.12 |
| A12 | Outer sheath material / grade | PVC ST2 / FR / FRLS / FRLSH / LSZH | Affects price + fire tests |
| A13 | Outer sheath colour | Black (default) / other | Cosmetic + spec |
| A14 | Standard / drum length | m (e.g. 500/250/1000) | For costing + packing |
| A15 | Order quantity | m or km | For total costing |
| A16 | Sequential marking / branding text | free text | Embossing spec |

### Bucket B — Auto-Calculated (derived, with formulas)
Computed live from Bucket A + the fetched master values. **Formulas in Section 7.**

| # | Output | Depends on | Formula ref |
|---|--------|------------|-------------|
| B1 | Conductor diameter (nominal/fictitious) | A3, A5, A6 | §7.1 (IS 10462 fictitious method) |
| B2 | Strand diameter | A3 + min-wires master (C-tables) | §7.2 |
| B3 | Core diameter | B1 + insulation thk (C) | §7.3 |
| B4 | Laid-up / assembly diameter | B3 × stranding factor (A1) | §7.4 |
| B5 | Diameter under inner sheath / armour / outer sheath | build-up | §7.5 |
| B6 | **Overall diameter (finished)** | full build-up | §7.5 |
| B7 | DC resistance @20°C | A2,A3 (validated vs C master) | §7.6 |
| B8 | AC resistance @90°C | B7 + α + skin/proximity | §7.7 |
| B9 | Short-circuit current Iₖ (1s) | A2,A3 | §7.8 |
| B10 | Reactance / capacitance (approx) | geometry | §7.9 |
| B11 | Voltage drop (per A, per km) | B8, B10 | §7.10 |
| B12 | Min bending radius | B6 | §7.11 (12×OD) |
| B13 | Max pulling tension | B6 | §7.11 (9×D²) |
| B14 | **Mass per km, per layer** (conductor, insulation, fillers, inner sheath, armour, outer sheath) | geometry × density (C) | §7.12 |
| B15 | **Total cable weight (kg/km)** | Σ B14 | §7.12 |
| B16 | **Material cost build-up** | B14 × unit price (BOM master) | §7.13 |
| B17 | **Conversion / process cost** | per-layer or per-kg process rates (BOM master) | §7.13 |
| B18 | **GTP landed price** (material + process + scrap + overhead + packing + testing + margin + freight + GST) | full roll-up | §7.13 |

### Bucket C — Master-Fetched (never typed by the user)
Split into **C-S = Standards Master** (IS tables, version-controlled) and **C-B = Internal BOM / Cost Master**.

**C-S — Standards Master (digitised IS tables):**

| # | Data | Source table | Keyed by |
|---|------|-------------|----------|
| CS1 | Min number of wires | IS 8130 Table 2 | area, material, class |
| CS2 | **Max DC resistance @20°C** (authoritative) | IS 8130 Table 1 (solid) / Table 2 (stranded) | area, material, class |
| CS3 | Temperature correction factors kₜ | IS 8130 Table 6 | measured temp |
| CS4 | Nominal insulation thickness | IS 7098 Table 5 | area, voltage |
| CS5 | Insulation tolerance rule | IS 7098 / IS 10462 | nominal thk |
| CS6 | Inner sheath thickness | IS 7098 (cl.12 / Table 5) | laid-up diameter |
| CS7 | Armour wire/strip dimensions | IS 7098 Table 6 | calculated dia under armour |
| CS8 | Armour DC resistance | IS 7098 Table 7 | area, core count, armour type |
| CS9 | **Outer sheath thickness (nominal + min)** | IS 7098 Table 8 | calculated dia under sheath |
| CS10 | Core lay-up plan | IS 7098 Table 4 | number of cores |
| CS11 | XLPE / PVC property limits | IS 7098 Table 1 | material |
| CS12 | Current carrying capacity | SPEC tables / IS 3961 | area, install method |
| CS13 | Short-circuit K factor | IEC/IS (Al 0.094, Cu 0.125) | material |
| CS14 | Standard drum lengths | SPEC cl.6 | area band |

**C-B — Internal BOM / Cost Master:**

| # | Data | Notes |
|---|------|-------|
| CB1 | Material unit price — Copper | LME-linked, frequently updated |
| CB2 | Material unit price — Aluminium | LME-linked |
| CB3 | Material unit price — XLPE compound | ₹/kg |
| CB4 | Material unit price — PVC ST2 / FR / FRLS / FRLSH | ₹/kg per grade |
| CB5 | Material unit price — GI armour wire/strip | ₹/kg |
| CB6 | Material unit price — fillers / tapes / binders | ₹/kg |
| CB7 | Process / conversion cost | per kg or per layer (drawing, stranding, extrusion, armouring, sheathing) |
| CB8 | Scrap / wastage factor | % per process |
| CB9 | Fixed + variable overhead | ₹/km or % |
| CB10 | Packing cost (drum) | ₹/drum by size |
| CB11 | Testing cost | ₹/lot or ₹/km |
| CB12 | Margin / profit % | configurable per quote |
| CB13 | Freight | ₹/km or ₹/t·km |
| CB14 | GST / taxes | % |
| CB15 | LME price + exchange rate | live or manual input |

> **Material physical constants** (resistivity, α, density) sit in the existing `Material` table — these are a hybrid (physical truth + standard) and feed both Bucket B formulas and C-S validations.

---

## 2. Target System Architecture (high level)

```
┌──────────────────────────────────────────────────────────────────────┐
│  CLIENT (Next.js App Router, React 19)                                 │
│  • Design Workbench (Bucket A knobs + live Bucket B preview)           │
│  • GTP / Costing Sheet viewer + export                                 │
│  • Admin: Standards Master, BOM/Cost Master, Users, Rules              │
└───────────────┬──────────────────────────────────────────────────────┘
                │ Server Actions / Route Handlers
┌───────────────▼──────────────────────────────────────────────────────┐
│  APPLICATION / DOMAIN LAYER                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ Calculation │  │ Standards    │  │ Costing/GTP  │  │ Rules /     │  │
│  │ Engine      │→ │ Lookup Engine│→ │ Engine       │  │ Validation  │  │
│  │ (pure fns)  │  │ (table fetch)│  │ (BOM roll-up)│  │ Engine      │  │
│  └─────────────┘  └─────────────┘  └──────────────┘  └─────────────┘  │
│  Workflow/Approval · Export (PDF/XLSX) · Audit · Versioning           │
└───────────────┬──────────────────────────────────────────────────────┘
                │ Prisma
┌───────────────▼──────────────────────────────────────────────────────┐
│  DATA: Postgres — Cable SKUs · Standards Master (versioned) ·          │
│        BOM/Cost Master (versioned) · Quotes · Audit Log · Users        │
└──────────────────────────────────────────────────────────────────────┘
```

**Design principle:** Calculation Engine = pure deterministic functions (testable). Standards Lookup = data fetch keyed by area/diameter. Costing Engine = consumes calculated masses + BOM prices. All three are versioned so a quote is reproducible (same inputs + same standard version + same price snapshot = same output forever).

---

## 3. Inputs (consolidated)

- **Per-design inputs:** Bucket A (16 knobs above).
- **Per-quote inputs:** order quantity, drum length, margin %, price-snapshot date, freight/GST, client name & tender ref.
- **Admin/master inputs:** Standards Master tables (CS1–CS14), BOM/Cost Master (CB1–CB15), Material constants.
- **System inputs:** logged-in user/role, standard version selection, LME/FX (manual or feed).

## 4. Outputs

1. **Live calculation preview** (Bucket B) inside the design workbench.
2. **GTP sheet** — Guaranteed Technical Particulars: full construction + electrical + dimensional + weight + test table, formatted to tender style, exportable PDF.
3. **Costing sheet** — per-layer mass × price build-up → conversion → overhead → margin → final ₹/km and ₹/total, exportable PDF + XLSX.
4. **Combined GTP+Costing quote** (the headline deliverable).
5. **Compliance / deviation report** (pass/flag against standards).
6. **Audit trail & version history** per SKU/quote.
7. **Dashboards / KPIs** (Section 9).

## 5. UI/UX Components

- **Design Workbench:** left = Bucket A knobs (only ~16 controls, grouped: Conductor / Insulation / Armour / Sheath / Commercial); right = live Bucket B results + compliance chips (green/amber/red). Dimensions shown as **read-only fetched values** with a "standard override" toggle (audited).
- **Standard-vs-actual diff panel:** shows fetched nominal vs any override, with the governing clause cited.
- **Costing panel / drawer:** expandable BOM table (layer, material, kg/km, ₹/kg, ₹/km), then conversion, overhead, margin, totals; margin slider; price-snapshot selector.
- **GTP preview** styled like the tender Schedule-A sheet.
- **Admin masters:** editable, version-controlled grids for Standards Master + BOM/Cost Master, with bulk Excel import (reuse existing `xlsx`).
- **Quote list / dashboard**, **approval queue**, **audit timeline**.
- Tooltips citing IS clauses; responsive (engineers use tablets).

## 6. Backend Logic & Data Workflows

**Primary workflow (the use-case loop):**
```
1. User picks/loads a base SKU → tweaks Bucket A knobs
2. Calculation Engine computes geometry (B1–B6)
3. Standards Lookup fetches CS4/CS6/CS7/CS9 dimensions by area/diameter
4. Engine builds up OD + per-layer mass (B14–B15)
5. Rules Engine validates (overrides flagged)
6. Costing Engine: mass × BOM price snapshot → cost roll-up (B16–B18)
7. User adjusts margin/qty → live total
8. Generate GTP + Costing sheet → export / save quote (immutable snapshot)
9. (optional) Submit → approval workflow → Approved
```

**Versioning rule:** every saved quote stores `{inputs, standardVersionId, priceSnapshotId, engineVersion, outputs}` so it is reproducible and auditable.

**Workflow states:** `DRAFT → PENDING → APPROVED → (REVISED)`; quotes get `QUOTED → SENT → WON/LOST` (TBD — see Q).

## 7. Formulas (engine spec)

- **§7.1 Conductor diameter:** circular approx `d = √(4A/π)`; shaped/compacted → IS 10462 fictitious diameter method (factor tables). _[needs IS 10462 digitised — see Q]_
- **§7.2 Strand diameter:** `d_strand = √(4A / (π·N))` where N = min wires from CS1.
- **§7.3 Core diameter:** `D_core = d_cond + 2·t_insulation` (t from CS4).
- **§7.4 Assembly diameter:** `D_asm = D_core × k(cores)` (k: 1C=1, 2C=2.0, 3C=2.154, 4C=2.414, 5C=2.70 …). _[confirm factor source — currently hardcoded]_
- **§7.5 Build-up:** `OD = D_asm + 2·t_inner + 2·t_armour + 2·t_outer` (each t from CS6/CS7/CS9, keyed by the running calculated diameter).
- **§7.6 DC resistance @20°C:** `R20 = ρ/A × 1000 (Ω/km)`; **then clamp/validate against CS2 max**. GTP reports the **standard max**, not the raw formula value.
- **§7.7 AC resistance @90°C:** `R90 = R20·(1+α·(90−20))` + skin & proximity factors (IEC 60287) for AC. _[decide depth — see Q]_
- **§7.8 Short-circuit:** `Iₖ = K·A/√t` (K: Al 0.094, Cu 0.125, from CS13).
- **§7.9 Reactance/Capacitance:** approximate from geometry / IS tables. _[scope TBD]_
- **§7.10 Voltage drop:** `V_d = √3·I·(R·cosφ + X·sinφ)·L`.
- **§7.11 Bending radius `= 12×OD`; pulling tension `= 9×D²` (N).**
- **§7.12 Mass per km:** per layer `m = A_layer × density × 10⁻⁶ × 1000 (kg/km)`; conductor `m = A × density`; insulation/sheath from annular cross-section × density; armour from wire/strip cross-section × lay length × density. Total `W = Σ m_layer`.
- **§7.13 Costing roll-up:**
  ```
  material_cost   = Σ (mass_layer_kg_per_km × unit_price_₹_per_kg)
  conversion_cost = Σ (process_rate × basis)            # per kg or per layer
  scrap_cost      = material_cost × scrap_%
  factory_cost    = material + conversion + scrap + overhead
  ex_works_₹/km   = factory_cost × (1 + margin_%)
  total_₹         = ex_works × length + packing + testing + freight
  invoiced_₹      = total × (1 + GST_%)
  ```

## 8. Database Schema (target additions)

Keep `User`. Evolve `Material`, `StandardRule`, `CableModel`. **Add:**

- **`StandardTable`** (versioned): `standard` (IS 7098/8130), `tableName` (e.g. INSULATION_THK), `version`, `effectiveFrom`.
- **`StandardTableRow`**: `tableId`, `keyType` (AREA | DIAMETER_BAND | CORES), `keyMin`, `keyMax`, `material?`, `class?`, `voltage?`, `valueJson` (nominal/min/max/wires/etc.).
- **`PriceList`** (versioned snapshot): `name`, `effectiveDate`, `lmeCu`, `lmeAl`, `fx`, `status`.
- **`PriceItem`**: `priceListId`, `materialKey`, `unitPrice`, `uom`.
- **`ProcessRate`**: `priceListId`, `processKey`, `rate`, `basis` (PER_KG|PER_LAYER|PER_KM), `scrapPct`.
- **`CostingParam`**: overhead, margin default, packing-by-size, testing, freight, GST.
- **`Quote`**: `cableModelId`, `priceListId`, `standardVersionId`, `qty`, `drumLength`, `marginPct`, `outputsJson` (immutable), `status`, `client`, `tenderRef`, `createdBy`, `approvedBy`.
- **`AuditLog`**: actor, entity, field, old, new, ts.
- Extend `CableModel` with: `conductorShape`, `armoured`, `fireGrade`, `neutralArea`, plus per-layer computed mass fields (or store in `outputsJson`).

## 9. KPIs / Metrics

- **Speed:** avg time to generate a quote (target < 5 min); quotes/engineer/day.
- **Accuracy:** calc vs reference within ±1%; standards-compliance pass rate.
- **Business:** quote→win conversion; avg margin %; material-cost exposure vs LME movement; rework/revision count per quote.
- **Ops:** approval cycle time; master-data freshness (days since last price update); audit completeness.
- **Adoption:** active engineers, SKUs created, exports generated.

## 10. Technology Stack (recommendation)

Keep the current Next.js 15/16 + TS + Prisma + Postgres + NextAuth core (it fits). **Add:** Zod (input + master validation), a typed pure-function engine module with Vitest unit tests against IS reference values, `xlsx` for master import/costing export (already present), Puppeteer/React-PDF for GTP PDF, and a price-snapshot service. Consider TanStack Query for live workbench reactivity. RBAC hardened so APPROVER actually works (current bug).

## 11. Assumptions Made (flagged — confirm or correct)

> I have **assumed nothing silently**. Each of these is a working assumption I used to draft the above; all are open for correction in Section 12.

- **AS1.** Primary product scope is **LT (1.1 kV) XLPE power cable** first; MV (IS 7098-2) is later.
- **AS2.** GTP = "Guaranteed Technical Particulars" tender document; the headline deliverable is a **combined GTP + costing quote**.
- **AS3.** Standards dimensions should be **fetched, not typed**; user override is allowed but audited.
- **AS4.** DC resistance reported on GTP = **IS 8130 max value**, not the raw ρ/A formula value.
- **AS5.** Costing is **material + conversion + scrap + overhead + margin + packing + testing + freight + GST**, with Cu/Al **LME-linked**.
- **AS6.** Single-company internal tool (not multi-tenant SaaS).
- **AS7.** Currency = **INR**; standards = **Indian (IS)** primary, IEC secondary.
- **AS8.** Reuse/evolve the existing Next.js codebase rather than rewrite.
- **AS9.** Stranding/assembly factors and IS 10462 fictitious-diameter factors will be sourced/digitised (not yet in repo as full tables).
- **AS10.** Quote outputs are **immutable snapshots** for auditability.

---

## 11b. DECISIONS LOCKED (from stakeholder, 2026-06-05)

These override/refine the assumptions above and are now binding inputs to `prd.md`:

- **D1 — Dynamic Parameter Registry (foundational).** The product must NOT hardcode cable parameters. Every parameter is a configurable, first-class entity that can be **added, edited, or deleted** by admins, and each carries: (a) its **identity** (name, unit, bucket type), (b) a **mapping to a specific IS standard parameter/clause/table** that governs it, and (c) a **mapped formula** describing how it is derived or validated. The engine reads this registry at runtime — code does not assume a fixed field list. _(This replaces the static `CableModel` columns with a metadata-driven model — see PRD data model.)_
- **D2 — Sheet-driven GTP/Costing engine.** The user has **comparative GTP sheets for different cable models**. Workflow: ingest → decompose every element → map to Parameter Registry identity → regenerate to exact template. ➜ **UPDATE 2026-06-05: 8 GTP sheets received and fully decomposed in `GTP-TEMPLATE-SPEC.md` (canonical 38-row template, every element mapped to bucket+IS source+formula, engine logic validated against real data). REMAINING BLOCKER: no costing/pricing sheet among them — all are purely technical GTPs. Costing template still needs a sample OR a decision to ship technical GTP first.**
- **D3 — Dimensions:** Fetched from standards, **override allowed but audited** (deviation logged + flagged).
- **D4 — Roles:** Expand RBAC beyond Engineer/Approver/Admin to include **Sales / Costing / Management**. **Cost & margin are gated by role**; engineers see technical GTP only.
- **D5 — v1 scope = TECHNICAL GTP GENERATOR ONLY (2026-06-05).** All received sheets are technical GTPs with no pricing, and the stakeholder confirmed **costing is deferred to a later phase**. v1 builds the registry-driven engine + the exact 38-row GTP template output (PDF/Excel). The BOM/Cost master, costing roll-up, and quote-pricing become Phase 2. (Cost-visibility RBAC from D4 is still *designed in* so Phase 2 drops in cleanly, but no cost data exists in v1.)
- **D6 — Primary unit = SINGLE SKU per sheet (2026-06-05).** Although the sample sheets are comparative (multi-size columns), the core data/domain unit is **one cable SKU = one size**. Comparative side-by-side rendering is a later presentation feature that composes N single SKUs; it is **not** the base entity. Simplifies the data model (`CableModel` = one size).

---

## 12. Structured Open Questions (need your answers before writing `prd.md`)

Grouped by theme. Answer inline; I'll only write the PRD once these are resolved.

### Theme 1 — Product scope & primary deliverable
- **Q1.** Is the headline output a **combined GTP + Costing quote**, or two separate documents? Who consumes each (internal sales vs external tender submission)?
- **Q2.** Voltage scope for v1: **LT 1.1 kV only**, or must MV (3.3–33 kV, IS 7098-2) be in scope now?
- **Q3.** Cable families in scope: only **XLPE power cables**, or also PVC-insulated, control, flexible, aerial bunched, etc.?

### Theme 2 — Costing engine (most important, least defined today)
- **Q4.** Confirm the cost build-up structure in §7.13 — any cost elements I'm missing (e.g. financing cost, rejection allowance, commissioning)?
- **Q5.** Are **Copper/Aluminium prices LME-linked** with a live feed, or manually entered per price-list snapshot?
- **Q6.** Is **conversion/process cost** modelled **per kg**, **per process step**, or a flat **per-km** rate? Do you have existing rate cards I should match?
- **Q7.** Should margin be a **single % on factory cost**, or layered (material margin vs conversion margin)? Per-client price overrides?
- **Q8.** Do you have an **existing Excel costing sheet** I can mirror exactly? (Strongly recommended — it would anchor the whole engine.)

### Theme 3 — Standards master
- **Q9.** Should I **digitise the full IS 7098 / IS 8130 dimension tables** into the Standards Master now (insulation thk, sheath thk, armour dims, resistances), or start with the sizes you actually sell?
- **Q10.** Do you need **multi-standard versioning** (e.g. IS 7098 amendments, or customer-specific specs like the MSEDCL one), or a single current standard set?
- **Q11.** When a customer spec (e.g. MSEDCL Schedule-A) **overrides** the base IS values, should that be a selectable "spec profile" layered on top of IS?

### Theme 4 — Users, workflow, governance
- **Q12.** Keep the 3 roles (Engineer/Approver/Admin) or add **Sales/Costing/Management**? Who is allowed to see **cost & margin** vs only technical particulars?
- **Q13.** Required approval workflow: is `Draft→Pending→Approved` enough, or do you need the `→Production` and quote `Won/Lost` lifecycle too?
- **Q14.** Is **audit/version reproducibility** a hard requirement (regulated/tender environment), or nice-to-have?

### Theme 5 — Inputs/outputs & UX
- **Q15.** Should dimensions be **fully auto-fetched (locked)**, **fetched-but-overridable (audited)**, or **free entry**? (I recommend fetched-but-overridable.)
- **Q16.** Export formats required: **PDF GTP**, **Excel costing**, both? Any mandatory tender template/letterhead to match?
- **Q17.** Multi-size quoting: does one quote contain **many cable sizes** (a tender BOQ), or one SKU per quote?

### Theme 6 — Engineering depth
- **Q18.** Electrical depth for v1: is **R/Iₖ/weight/OD** enough, or are **reactance, capacitance, voltage drop, current rating (IEC 60287/IS 3961)** required for the GTP?
- **Q19.** Do you need the **IS 10462 fictitious-diameter** method for shaped/sector conductors, or is circular approximation acceptable for v1?
- **Q20.** Any **existing reference cable datasheets** (e.g. Polycab/your own) I should validate the engine numbers against to ±1%?

### Theme 7 — Delivery & constraints
- **Q21.** Are we **evolving the current Next.js app** (my assumption) or open to changes?
- **Q22.** Deployment target (on-prem vs cloud), expected **users/concurrent load**, and any data-residency constraints?
- **Q23.** Timeline / phasing expectation — what must be in **v1 (MVP)** vs later?

---

_End of analysis. Once Section 12 is answered, I will write `prd.md` as a full industry-standard PRD (vision, personas, scope, functional + non-functional requirements, parameter spec, formulas, data model, API, UX, KPIs, milestones, risks)._
