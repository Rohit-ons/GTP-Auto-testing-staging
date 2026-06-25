# Gap Analysis & Action Plan — Client GTP vs Platform Output

**SKU under test:** 3 Core × 185 mm² Aluminium, XLPE, Armoured (LT 1100 V), IS 7098-1 : 2025

**Sources compared:**
1. **CLIENT** — `AL_XL_AR_ARMD (GTPs).pdf` p.5 (Polyvion's real GTP for 3C×185, Rev.00 21.02.2026)
2. **PLATFORM** — `GTP_3C_x_185mm_Aluminium_XLPE_Armd_FRLSH.pdf` (exported from the app)
3. **SCREENSHOT** — the live workbench (same config as the export)

> ⚠️ Note: the inputs entered in the platform did **not** exactly match the client SKU (you selected *Circular* + *FRLSH* + entered a *neutral*; the client SKU is *Sector Shaped* + *plain PVC ST-2* + *no neutral*). The table separates **platform bugs** from **input mismatches** from **IS-vs-house policy**.

---

## 1. Three-way itemized comparison

| # | Parameter | CLIENT (real SKU) | PLATFORM output | Match | Category |
|---|-----------|-------------------|-----------------|:-----:|----------|
| 5 | Voltage Grade | 1100 V | 1100 V | ✅ | OK |
| 6 | No. of Cores | 3 Core | 3 Core | ✅ | OK |
| 8 | Conductor Material | EC H2/H4 **Sector Shaped** Al | EC H2/H4 Al (no "sector") | 🟡 | INPUT |
| 9 | **Size** | **185** (no neutral) | **M-185 & N-95** | ❌ | **BUG B1** |
| 10 | **No. of Strands** | **37** | **M-30 & N-15** | ❌ | **POLICY P1 + BUG B1** |
| 11 | Shape of Conductor | **Sector Shaped** | **Round** | 🟡 | INPUT |
| 12 | Temp Rise Normal | 90 °C | 90 °C | ✅ | OK |
| 13 | Temp Rise Short-ckt | 250 °C | 250 °C | ✅ | OK |
| 15 | **Insulation Material** | XLPE …(Part-1)/**2025** | XLPE …(Part-1) **1988** | ❌ | **BUG B2** |
| 16 | Insulation Type | Extruded XLPE | Extruded XLPE | ✅ | OK |
| 17 | Insulation Thickness | **1.60** (Nom. only) | 1.60 / 1.34 (Nom./Min.) | 🟡 | TEMPLATE T1 |
| 18 | Core Identification | Red, Yellow & Blue | Red, Yellow & Blue | ✅ | OK |
| 22 | **Inner Sheath (Min.)** | **0.50** | **0.50** | ✅ | **OK (IS 10462)** |
| 25 | Armour Material | GS Flat Strip | GS Flat Strip | ✅ | OK |
| 26 | **Armour Dimension** | **4.00 × 0.80** | **4.00 × 1.40** | ❌ | **POLICY P2** |
| 28 | Outer Sheath Material | PVC ST-2 | PVC ST-2 (grade FRLSH not shown) | ❌ | BUG B3 + INPUT |
| 29 | Outer Sheath Type | Extruded PVC | Extruded FRLSH PVC | 🟡 | INPUT |
| 30 | **Outer Sheath (Min.)** | **1.88** | **1.88** | ✅ | **OK (IS 10462→Table 8)** |
| 31 | **Overall Diameter** | **42.00** | **49** | ❌ | **FORMULA F1** |
| 34 | Standard Drum Length | 1000 m +2% | 250 m ±5% | ❌ | DATA B4 |
| 36 | DC Resistance @20°C | **0.164** (no neutral) | M-0.164 & N-0.320 | ❌ | BUG B1 (value ok) |
| 37 | High Voltage Test | 3.0 kV, 5 min | 3.0 kV, 5 min | ✅ | OK |
| 38 | FRLS/FRLSH tests | (none — plain ST-2) | present | 🟡 | INPUT |
| 39 | Flammability Test | present | present | ✅ | OK |

Legend: ✅ correct · 🟡 differs because of input choice · ❌ wrong output

---

## 2. Root-cause analysis (the "why")

### 🔴 Platform BUGS (wrong regardless of input — must fix)

**B1 — A whole-number-core cable wrongly shows a neutral.**
- *Symptom:* rows 9/10/36 show `M-185 & N-95`, `M-30 & N-15`, `M-0.164 & N-0.320`, **but** row 18 (Core ID) correctly shows only 3 colours → the sheet contradicts itself.
- *Cause:* `hasNeutral()` in `gtp.ts` returns true whenever `areaNeutral` is set **and** it differs from main — even for a true 3-core. A separate (reduced) neutral only exists for **3.5-core** (and optionally 4/5-core), never plain 3-core.
- *Correct logic:* a neutral core exists only when `numberOfCores` is fractional (3.5, 4.5) — i.e. `numberOfCores % 1 !== 0`. For whole-number cores, ignore `areaNeutral` entirely.

**B2 — Insulation material text is frozen to "1988" while the sheet is 2025.**
- *Symptom:* row 4 says "IS 7098 (Part-1) **2025**" but row 15 says "XLPE Compound Conf. To IS 7098 (Part-1) **1988**".
- *Cause:* `MATERIALS.XLPE.gtpText` in `data.ts` hard-codes the string `"…(Part-1) 1988"`.
- *Correct logic:* the insulation material descriptor must be built from the **selected `standardEdition`**, not a fixed literal.

**B3 — Outer-sheath material doesn't reflect the FR/FRLS/FRLSH grade.**
- *Symptom:* with grade = FRLSH, row 29 says "Extruded **FRLSH** PVC" but row 28 (Material) still says plain "PVC TYPE ST-2".
- *Cause:* row 28 uses `outerMat.gtpText` (the base PVC_ST2 text) instead of a grade-aware label.
- *Correct logic:* row 28 must compose "Extruded **{grade}** PVC TYPE ST-2 Conf. to IS : 5831/84".

**B4 — Standard drum length rule is wrong.**
- *Symptom:* platform 250 m for 185 mm²; client uses 1000 m.
- *Cause:* `STANDARD_DRUM_LENGTHS` uses 500 (≤120) / 250 (>120) — a generic guess, not the client's packing rule.
- *Correct logic:* drum length is a manufacturer packing standard; it should be a master value (and the client's is 1000 m for this size). Make it editable / per-spec.

### 🟠 IS-strict vs Polyvion house policy (a decision, not a bug)

**P1 — Strand count: IS says 30, client uses 37.**
- IS 8130 Table 2 min wires for 185 mm² Class-2 **aluminium** = **30**. The client's GTP states **37** (the value IS 8130 assigns to **copper** 185 / round construction). Polyvion applies the denser count to sector Al as a house practice.
- The platform is currently **IS-strict (30)**. To match the client, sector-Al strands would use **37**.

**P2 — Armour strip thickness: IS says 1.40, client uses 0.80.**
- IS 7098 Table 6: for calculated dia under armour > 40 mm → strip **1.40 mm**. The client uses **4.0×0.80** for all sizes (house deviation).
- The platform is currently **IS-strict (1.40)**.

### 🔵 Formula method (OD)

**F1 — OD is the IS 10462 *fictitious* value (49), client shows the *actual* value (42).**
- IS 10462-1 cl.0.4 states the fictitious diameter is **only** for determining covering thicknesses, **not** the real OD; the actual OD is "calculated separately for practical purposes." The fictitious method (with round-core assembly coefficient k=2.16) over-estimates a compact sector cable.
- The platform currently shows only the fictitious OD. The client shows a **practical/actual** OD (42 mm).
- *Correct logic:* keep the fictitious chain to **key the thickness tables** (already correct), but compute and display a **separate practical OD** using actual sector-compacted diameters.

### 🟢 Input mismatches (not platform faults — operator entered a different SKU)
- Shape: you chose *Circular*; client SKU is *Sector Shaped*.
- Outer grade: you chose *FRLSH*; client SKU is *plain PVC ST-2* (hence the extra FRLSH test rows).
- Neutral: you entered 95 for a 3-core; the client SKU has none.

### ⚪ Template variance
**T1 — Insulation thickness label.** This client sheet shows "Thickness (**Nom.**)" = 1.60 only. The FRLSH sheets show "Thickness (Nom./Min.)". The platform always shows Nom./Min. → make the display style a per-template option.

---

## 3. What is ALREADY CORRECT (verified, keep)

| Area | Status |
|------|--------|
| Insulation nominal (IS 7098 Table 3) + min rule (cl.9.3) | ✅ 1.60 / 1.34 exact |
| Inner sheath (IS 10462 Df → IS 7098 Table 5) | ✅ 0.50 exact match to client |
| Outer sheath min (IS 10462 Dx → IS 7098 Table 8) | ✅ 1.88 exact match to client |
| DC resistance (IS 8130 Table 2) | ✅ 0.164 exact |
| Temp ratings, HV test, core ID, flammability text | ✅ all match |
| IS 10462 fictitious chain (Table 1, cl.3.2/3.3/3.4/3.5) | ✅ correctly implemented |
| Insulation min formula | ✅ ti − (0.1 + 0.1·ti) |

---

## 4. ACTION PLAN — clean implementation (replace old logic)

Ordered, each step isolated and testable. Old code is replaced, not patched around.

### Phase A — Fix the unambiguous bugs (no decision needed)
1. **B1 neutral logic** — rewrite `hasNeutral()` and the diameter chain's 3.5-core branch so a separate neutral exists **only** when `numberOfCores % 1 !== 0`. Whole-number cores ignore `areaNeutral` for size/strands/resistance. *(files: `gtp.ts`, `geometry.ts`; also disable the Neutral input in `DesignFormClient` unless cores is fractional.)*
2. **B2 edition in material text** — remove the hard-coded year from `MATERIALS.XLPE.gtpText`; build the insulation descriptor in `gtp.ts` from `input.standardEdition`. *(files: `data.ts`, `gtp.ts`.)*
3. **B3 sheath grade in material** — compose row 28 with the grade prefix (FRLS/FRLSH). *(file: `gtp.ts`.)*
4. **B4 drum length** — move drum length to an editable master / spec value; seed the client's real bands (e.g. 1000 m for this range). *(files: `data.ts`, optionally schema + standards admin.)*

### Phase B — Standards profile (resolve P1 + P2 without losing either)
5. Add a **`standardsProfile` switch — `IS_STRICT` | `POLYVION_HOUSE`** on the SKU (default selectable in the workbench).
   - `IS_STRICT`: armour 1.40 (>40 mm), Al strands per IS 8130 (185→30). *(current behaviour)*
   - `POLYVION_HOUSE`: armour 4.0×0.80 all sizes, sector-Al strands per the client's house table (185→37).
   - Implement as an alternate lookup layer the `StandardsProvider` consults based on profile — **no destructive change** to the IS data. *(files: `data.ts` house tables, `dbProvider.ts`/`staticProvider.ts`, `types.ts`, `gtp.ts`, `geometry.ts`, workbench select.)*

### Phase C — Practical OD (resolve F1)
6. Add a **practical OD** alongside the fictitious one: real conductor diameter × sector-compaction × sector-assembly factor + looked-up thicknesses. Display the practical OD in row 31 (label "Approx. OD"), keep the fictitious chain internal for table keying. Calibrate sector factors against the client OD set (42 / 55 / 62…). *(file: `geometry.ts`.)*

### Phase D — Template options (T1)
7. Make the insulation-thickness display style (`Nom.` vs `Nom./Min.`) and the presence of FRLS/FRLSH test rows a **per-SKU/template flag**, so the generated sheet can match either client layout exactly.

### Phase E — Verify & lock
8. Re-run `npm run verify`, add regression cases for **3C×185 sector Al house-profile** asserting: size=185 (no N), strands=37, armour 4.0×0.80, OD≈42, outer 1.88, inner 0.50.
9. `tsc --noEmit` + `next build`; re-seed; click-through the workbench.

---

## 5. Decision needed before Phase B/C
The bugs in **Phase A** are unambiguous and will be fixed regardless. But **P1 (strands), P2 (armour), F1 (OD)** depend on one product question:

> **Should the platform's default output match the literal IS standard, or match Polyvion's actual production sheets?**

The recommended answer (and what Phase B builds) is **both — a selectable profile**, so engineers get IS-strict compliance by default and can switch to "Polyvion house" to reproduce the existing sheets 1:1.
