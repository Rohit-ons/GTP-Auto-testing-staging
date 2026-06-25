# Data-Flow & Architecture Guide

How the app is wired end-to-end: layers, tabs, the design→GTP loop, field-by-field mapping, and how to add IS standards.

---

## 1. The layered shape (direction of truth)

```
┌──────────────────────────────────────────────────────────────┐
│ BROWSER (React client)                                         │
│   DesignFormClient.tsx  ── holds INPUT knobs + overrides state │
└───────────────┬───────────────────────────────────────────────┘
                │ calls Server Actions (RPC over HTTP, no REST hand-wiring)
┌───────────────▼───────────────────────────────────────────────┐
│ SERVER ACTIONS  (src/app/actions/*.ts, "use server")           │
│   gtp.ts · cables.ts · standards.ts · materials.ts · registry  │
└───────────────┬───────────────────────────────────────────────┘
                │ uses
┌───────────────▼───────────────────────────────────────────────┐
│ DOMAIN ENGINE (pure, src/lib/engine/*)   +   StandardsProvider │
│   geometry.ts · gtp.ts  ◄── data ── lib/standards/dbProvider.ts │
└───────────────┬───────────────────────────────────────────────┘
                │ Prisma
┌───────────────▼───────────────────────────────────────────────┐
│ DATABASE (SQLite dev / Postgres prod)                          │
│   Standard→specs · Material · ParameterDefinition · CableModel  │
└────────────────────────────────────────────────────────────────┘
```

**Truth flows one way:** user changes a few **INPUT** knobs → engine **fetches** the governing IS values by key → computes **CALCULATED** values → assembles the 38-row GTP → snapshot is saved. The engine never invents dimensions; it looks them up.

---

## 2. The tabs (routes) and what each owns

| Route | File | Role | Reads | Writes |
|-------|------|------|-------|--------|
| `/` | `app/page.tsx` | Landing | — | — |
| `/login` | `app/login/*` | NextAuth credentials | User | session (JWT) |
| `/design` | `app/design/page.tsx` + `DesignFormClient.tsx` | **The workbench** | Materials (options) | nothing until "Save" |
| `/admin` | `app/admin/page.tsx` | Dashboard KPIs | counts | — |
| `/admin/standards` | `app/admin/standards/page.tsx` | **Standards Master CRUD** | Standard + specs | spec tables + AuditLog |
| `/admin/registry` | `app/admin/registry/page.tsx` | Parameter Registry viewer | ParameterDefinition | active toggle + AuditLog |
| `/admin/materials` | `app/admin/materials/page.tsx` | Material master CRUD | Material | Material |
| `/admin/cables` | `app/admin/cables/page.tsx` | SKU list | CableModel | — |
| `/admin/cables/[id]` | `app/admin/cables/[id]/page.tsx` | GTP view + audit + export | CableModel + AuditLog | approve → status |
| `/api/export` | `app/api/export/route.ts` | Puppeteer PDF of a GTP | (POST body) | PDF |

Auth gate: `app/admin/layout.tsx` redirects non-logged-in users to `/login`. Role checks live inside the server actions (e.g. only ADMIN/APPROVER/MANAGEMENT can `approveCable`; only ADMIN/COSTING/MANAGEMENT can edit standards).

---

## 3. The core loop, step by step (Design → GTP → Save → View → Export)

### A. Live preview (every keystroke)
1. `DesignFormClient` holds one `CableInput` object (the 16 knobs) + an `overrides` map in React state.
2. On any change, a 250 ms-debounced `useEffect` calls the server action **`previewGtp(input, overrides)`** (`actions/gtp.ts`).
3. `previewGtp` calls **`buildDbProvider(prisma, input.standardEdition)`** (`lib/standards/dbProvider.ts`) — this pre-loads every relevant IS row for that **edition** into memory and returns a synchronous lookup object (`StandardsProvider`).
4. It then calls **`buildGtp(input, provider, overrides)`** (`lib/engine/gtp.ts`) — the pure function that produces the 38-row `GtpSheet`.
5. The sheet is returned to the client and rendered by **`GtpSheetView`**. The ✎ buttons let you override any IS-Std/Calc row.

### B. Save
6. "Save SKU & Generate GTP" calls **`createCable(input, overrides)`** (`actions/cables.ts`).
7. It re-runs `buildGtp` server-side (never trust the client), resolves material **codes → IDs**, and writes a `CableModel` row with:
   - the input columns (queryable),
   - `computedJson` = the full GTP snapshot (reproducible),
   - `overridesJson` = the overrides,
   - plus an `AuditLog` `CREATE` row and one `OVERRIDE` row per override.

### C. View
8. `/admin/cables/[id]` reads the `CableModel`, `JSON.parse(computedJson)` → `GtpSheet`, renders it with `GtpSheetView`, and shows the **Audit Trail** (AuditLog rows for this SKU).

### D. Export
9. `ExportButton` POSTs the `{ sheet }` JSON to `/api/export`; Puppeteer renders the 38-row table to a PDF.

> **Reproducibility:** because the SKU stores `computedJson` + `standardEdition` + `overridesJson`, the GTP is frozen at save time. Editing a standard later does **not** silently change an already-saved SKU.

---

## 4. The StandardsProvider — the bridge between DB and engine

The engine is **pure** (no DB import). It receives a `StandardsProvider` (interface in `lib/engine/types.ts`) with synchronous lookups:

```ts
resistance(material, area)              // IS 8130 — ohm/km
minWires(material, area)                // IS 8130 — strand count
insulationNominal(type, voltage, area)  // IS 7098 Table 5
innerSheathMin(dia)                     // IS 7098 cl.12  (band lookup by running diameter)
outerSheath(dia)                        // IS 7098 Table 8 → { nominal, min }
armour(type, dia)                       // IS 7098 Table 6
material(code)                          // Material master
```

Two implementations, identical shape:
- **`dbProvider.ts`** (`buildDbProvider`): loads the `Standard` by edition, pulls all `ConductorSpec/InsulationSpec/...` rows, builds `Map`s (exact keys) and sorted **band arrays** (range lookups), returns the sync object. This is what the app uses.
- **`staticProvider.ts`**: same lookups from the constants in `lib/standards/data.ts`. Used by `npm run verify` so tests don't need a DB.

`buildGtp` just calls `std.resistance(...)`, `std.outerSheath(dia)`, etc. — it doesn't know or care where the numbers come from.

---

## 5. Field-by-field mapping (each GTP row ← its source)

Every row is produced in `buildGtp` (`lib/engine/gtp.ts`) and catalogued in the **Parameter Registry** (`/admin/registry`). Three buckets:

| GTP Row | Bucket | Comes from | In code |
|--------|--------|-----------|---------|
| 5 Voltage, 6 Cores, 9 Size, 11 Shape, 8 Conductor mat, 32 Colour | **INPUT** | the design knob you set | `input.voltageGrade`, `input.numberOfCores`, `input.areaMain`, … |
| 10 Strands | MASTER_STD | IS 8130 Table 2 | `std.minWires(material, area)` |
| 12/13 Temp rise | MASTER_STD | insulation rating | `TEMP_RATINGS[insulationCode]` (data.ts) |
| 17 Insulation Nom/Min | MASTER_STD + CALC | IS 7098 Table 5 nominal **+** `min = nom − (0.1·nom + 0.1)` | `std.insulationNominal(...)` + `insulationMinThickness()` |
| 18 Core ID | MASTER_STD | IS 7098 Table 4 | `CORE_COLOURS[cores]` |
| 22 Inner sheath min | MASTER_STD | IS 7098 cl.12 by laid-up dia | `std.innerSheathMin(assemblyDia)` |
| 26 Armour dim | MASTER_STD | IS 7098 Table 6 by dia-under-armour | `std.armour(type, dia)` |
| 30 Outer sheath min | MASTER_STD | IS 7098 Table 8 by dia-under-sheath | `std.outerSheath(dia).min` |
| 31 Overall Diameter | CALCULATED | build-up chain (geometry.ts) | `buildDiameterChain(...)` |
| 36 DC resistance | MASTER_STD | IS 8130 Table 2 (max) | `std.resistance(material, area)` |
| 37 HV test | MASTER_STD | by voltage grade | `HV_TEST_KV[voltage]` |
| 38a-d FRLS/FRLSH tests | MASTER_STD | fire-grade spec constants | `FIRE_TEST_VALUES` (only when grade is FRLS/FRLSH) |
| 1 Cable Type, 16/21/29 Type | CALCULATED | composed text from your selections | `composeDescription`, `"Extruded " + …` |
| 2 Manufacturer, 3 Brand, 23 Colour, 33 Printing, 39 Flammability | MASTER_CONST | company constants | literals in `gtp.ts` |

**The geometry build-up (row 31 and the keys for rows 22/26/30):** `geometry.ts → buildDiameterChain` walks the layers exactly like the factory IPQC SOP:
```
conductorDia = √(4A/π)         → coreDia = +2·insulationNom
→ assemblyDia = coreDia × assemblyFactor(cores, shape)   (shaped cores pack tighter)
→ +2·innerSheathMin            (looked up by assemblyDia)
→ +2·armourDim                 (looked up by dia-under-armour)
→ +2·outerSheathMin            (looked up by dia-under-sheath)  = Overall Diameter
```
Each thickness lookup is keyed by the **running diameter** of the previous layer — that's why the order matters.

**Overrides:** after the rows are built, `buildGtp` applies your `overrides` map (keyed by row number). An overridden row keeps `standardValue` (the IS value) and is flagged `overridden:true`, so the sheet shows "1.50 (was 1.88)" and the deviation is audited on save.

---

## 6. Connections (foreign keys) at a glance

```
Standard 1───* ConductorSpec / InsulationSpec / InnerSheathSpec / OuterSheathSpec / ArmourSpec
                       (onDelete: Cascade — delete a Standard, its specs go too)

CableModel *───1 Material   (conductorMaterialId, insulationMaterialId,
                             innerSheathMaterialId?, outerSheathMaterialId)
CableModel *───1 User       (createdById, approvedById?)
AuditLog   *───1 User       (userId?)   + (entity, entityId) points at any row

ParameterDefinition          — standalone registry (no FK; keyed by `key`)
```

`Material` is referenced by **code** in the engine (`input.conductorMaterial = "AL"`) and resolved to its **id** for the FK at save time in `createCable`.

---

## 7. HOW TO ADD MORE IS STANDARDS

There are three levels depending on what you mean. Pick the one that fits.

### Level 1 — Add/edit rows in an existing table (no code)
*Use when:* a new conductor size, a corrected resistance, a new sheath band, etc.

- Go to **`/admin/standards`** (login as admin).
- Conductor table: edit `R Ω/km` / `Wires` inline and **Save**, or use **Add Spec** (material, area, R, wires). Insulation & outer-sheath are editable too.
- Every edit writes an `AuditLog` row. New saved SKUs immediately use the new value (existing snapshots stay frozen).

### Level 2 — Add a new EDITION of an existing standard (seed)
*Use when:* e.g. IS 7098-1 : 2030 with revised thickness tables, switchable from the workbench's "Standard Edition" dropdown.

1. Open `webapp/prisma/seed.ts`, add the edition to the `editions` array (currently `["1988","2025"]`) — or add a focused block that creates a new `Standard` and its spec rows.
2. Put the new numbers in `webapp/src/lib/standards/data.ts` (the single source of truth) — e.g. a new `XLPE_INSULATION_NOMINAL_2030`.
3. `npm run db:seed` (or `npm run db:reset`).
4. Add the option to the dropdown in `DesignFormClient.tsx` (`standardEdition` select). The engine already pins by edition via `buildDbProvider(prisma, edition)`.

### Level 3 — Add a NEW standard / parameter / layer type (full change)
*Use when:* a parameter the model doesn't track yet — e.g. a water-blocking tape layer, a screen, a new test, or a standard like IS 3975 armour detail.

Five touch-points, in order:
1. **Schema** (`prisma/schema.prisma`): add a spec model (or columns), e.g. `model ScreenSpec { standardId, diaMin, diaMax, thickness }`, relate it to `Standard`. Run `npm run db:push`.
2. **Canonical data** (`lib/standards/data.ts`): add the constant table.
3. **Provider** (`lib/standards/dbProvider.ts` **and** `staticProvider.ts`): load it and expose a new lookup method; add that method to the `StandardsProvider` interface in `lib/engine/types.ts`.
4. **Engine** (`lib/engine/gtp.ts` and/or `geometry.ts`): call the new lookup and `push({...})` a new GTP row (and fold its thickness into the diameter build-up if it's a physical layer).
5. **Registry** (`prisma/seed.ts` `REGISTRY` array): add a `ParameterDefinition` row so it appears in `/admin/registry` with its IS reference + formula key.
6. `npm run db:reset && npm run verify` to re-seed and re-check.

> Rule of thumb: **Level 1** for data you already model, **Level 2** for new versions of the same tables, **Level 3** when you need a brand-new field/row on the GTP. The metadata-driven design means most real-world growth is Level 1/2 (data only, no deploy).

---

## 8. Quick file map

```
src/lib/engine/        types.ts · geometry.ts · gtp.ts          (pure domain)
src/lib/standards/     data.ts · dbProvider.ts · staticProvider (IS data + bridge)
src/app/actions/       gtp.ts · cables.ts · standards.ts · materials.ts · registry.ts
src/app/design/        page.tsx · DesignFormClient.tsx          (workbench)
src/app/admin/         standards · registry · materials · cables · cables/[id]
src/components/        GtpSheetView.tsx · ExportButton.tsx
prisma/                schema.prisma · seed.ts
scripts/               verify-engine.ts   (npm run verify)
```
