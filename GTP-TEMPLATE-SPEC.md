# GTP Template & Element-Identity Mapping

> Reverse-engineered from the client's actual GTP sheets (Polyvion Cables / brand POLYCORE):
> `AL_XLPE_AR (GTPs).xls`, `3.5C X 400 (2XFY) (GTP).pdf`, `AL_XL_AR_ARMD (GTPs).pdf`, `CU_FLEX (GTP).pdf`, `CU_XL_AR (GTP).pdf`, `CU_XL_AR_ARMD (GTPs).pdf`, `POWER & CONTROL CABLE GTPs (BOILER SYSTEM).pdf`, plus `IN-PROCESS Testing SOP.xlsx`.
>
> **Purpose:** define (a) the canonical GTP output template the engine must reproduce, and (b) the **identity of every element** — i.e. which of the three buckets it belongs to, its IS source, and the formula/lookup that produces it. This is the spec the Parameter Registry (PRD §4) is populated from.

---

## 1. Sheet anatomy (all variants share this)

**Header block**
- Company name (MASTER const) · "GUARANTEED TECHNICAL PARTICULARS  Rev. NN  Dated DD.MM.YYYY  (TYPE TITLE)" · Description paragraph (composed) · Customer (INPUT) · Project (INPUT).

**Body table** — columns: `S.No | DESCRIPTION | UNIT | <Size col 1> | <Size col 2> …`
- **Comparative / BOQ:** one column per cable size in the quote (seen with 1–4 columns). ➜ engine must support **multi-size columns per GTP**.

**Footer block**
- "* OD is calculated, for reference…" · "Note: values subject to tolerances…" · "FOR: M/s …" signatory.

**Variant switches (drive which rows render):**
- `outerSheathGrade ∈ {PVC ST-2, FRLS, FRLSH}` → if FRLS/FRLSH, append **row 38 TESTS ON FRLS/FRLSH** (Oxygen Index / Temp Index / Smoke Density / Acid Gas).
- `armoured ∈ {true,false}` → if false, armour rows (24–26) = "N/A".
- `insulation thickness display ∈ {Nom./Min., Nom.}` → governed by customer requirement.
- `conductorClass` (2 stranded vs 5 flexible) and `insulationMaterial` (XLPE vs PVC Type-D) flip temp-rise + standards.

---

## 2. Canonical row map — every element's identity

Legend — **Bucket:** `IN`=user input · `CALC`=calculated (formula) · `MAS-S`=standards master · `MAS-C`=company/const master.

| Row | Description | Unit | Bucket | Source / Formula | Verified example |
|----:|-------------|------|--------|------------------|------------------|
| — | Rev / Date | — | IN | quote metadata | Rev.00 09.01.2025 |
| — | Customer / Project | — | IN | quote metadata | DELHI ELECTRIC CO. |
| 1 | Cable Type (description) | — | CALC(text) | composed from material+shape+class+insulation+armour+sheath tokens | "…Class-2, XLPE Insulated, Armoured, FRLSH ST-2…" |
| 2 | Manufacturer | — | MAS-C | company constant | M/s POLYVION |
| 3 | Brand | — | MAS-C | company constant | POLYCORE |
| 4 | Applicable Standards | — | MAS-S | from selected standard **version** | IS 7098-1/1988 vs /2025 |
| 5 | Voltage Grade | V | IN | knob | 1100 V |
| 6 | No. of Cores | nos | IN | knob | 3.5 Core |
| 7 | **CONDUCTOR** (header) | — | — | — | — |
| 8 | Material | — | IN→text | knob (Al/Cu) → descriptive template | EC H2/H4 Al / Electrolytic Cu |
| 9 | Size (main & neutral) | mm² | IN | knob; neutral auto-suggested for 3.5C | M-185 & N-95 |
| 10 | No. of Strands | nos | **MAS-S** | IS 8130 Table 2 by {area, material, class, shape} | 185→37, 95→19, 400→61 ✓ |
| 11 | Shape of Conductor | — | IN | knob (Circular / Sector-shaped / Compacted) | Sector shaped |
| 12 | Temp rise — normal | °C | MAS-S | by insulation (XLPE 90 / PVC 70) | 90 °C ✓ |
| 13 | Temp rise — short circuit | °C | MAS-S | by insulation (XLPE 250 / PVC 160) | 250 °C ✓ |
| 14 | **INSULATION** (header) | — | — | — | — |
| 15 | Material | — | IN→text | knob (XLPE / PVC Type-D) | XLPE conf. IS 7098 |
| 16 | Type | — | CALC(text) | "Extruded " + material | Extruded XLPE |
| 17 | Thickness Nom. / Min. | mm | **MAS-S** + **CALC** | nom = IS 7098 Table 5 by {area, voltage}; **min = nom − (0.1·nom + 0.1)** | 1.60/1.34, 1.10/0.89, 1.80/1.52, 2.00/1.70 ✓ |
| 18 | Core Identification | — | MAS-S | by core count (IS 7098 Table 4 colours/numbering) | R,Y,B,Black (3.5C) |
| 19 | **INNER SHEATH** (header) | — | — | — | — |
| 20 | Material | — | IN/MAS-C | PVC ST-2 default | PVC ST-2 |
| 21 | Type | — | CALC(text) | Extruded PVC | Extruded PVC |
| 22 | Thickness (Min.) | mm | **MAS-S** | IS 7098 (cl.12 / Table 5) by laid-up diameter | 0.30 / 0.50 / 0.60 / 0.70 |
| 23 | Colour | — | MAS-C | Black | Black |
| 24 | **ARMOURING** (header / N/A if unarmoured) | — | — | — | — |
| 25 | Material | — | IN | knob (GS Flat Strip / Round Wire / Formed Wire) — N/A if none | GS Flat Strip |
| 26 | Dimension | mm | **MAS-S** | IS 7098 Table 6 by calculated diameter under armour | 4.00×0.80, Ø1.40 ✓ |
| 27 | **OUTER SHEATH** (header) | — | — | — | — |
| 28 | Material | — | IN | knob (PVC ST-2 / FRLS / FRLSH / ST-3) | FRLSH PVC ST-2 |
| 29 | Type | — | CALC(text) | "Extruded " + grade | Extruded FRLSH PVC |
| 30 | Thickness (Min.) | mm | **MAS-S** | IS 7098 Table 8 by calculated diameter under sheath | 1.24,1.40,1.56,1.88,2.20,2.52 ✓ |
| 31 | Overall Diameter * | mm | **CALC** | diameter build-up (§ engine) | 46, 55, 62, 17 … |
| 32 | OD Tolerance * | mm/% | CALC/MAS-C | ±3 mm or "10–15%" per policy | ±3.00 mm |
| 33 | Colour of Outer Sheath | — | IN/MAS-C | Black default | Black |
| 34 | Marking / Printing | — | MAS-C(text) | standard embossing template (+FRLS/FRLSH variant) | mfr, year, grade, size, SLM @1m |
| 35 | Standard Drum Length | m | IN/MAS-S | by size band (e.g. ≤120→500, >120→250/300, flex→100 coil) | 500 ±5% |
| 36 | **ELECTRICAL PARAMETERS** (header) | — | — | — | — |
| 37 | Max DC resistance @20°C | Ω/km | **MAS-S** | **IS 8130 Table 2 max (authoritative)** — main & neutral | 0.164/0.320, 0.100/0.206, 0.047/0.099, 7.41, 12.10 ✓ |
| 38 | High Voltage Test | kV rms | MAS-S | by voltage grade (3.0/3.5 kV, 5 min) | 3.0 kV 5 min ✓ |
| 38a | TESTS ON FRLS/FRLSH → Oxygen Index (min) | % | MAS-S | FRLS/FRLSH spec constant | ≥29 |
| 38b | → Temperature Index (min) | °C | MAS-S | spec constant | ≥250 |
| 38c | → Smoke Density Rating (max) | % | MAS-S | spec constant | ≤60 |
| 38d | → Acid Gas Emission (max) | % | MAS-S | spec constant | ≤20 |
| 39 | Flammability Test (IS 10810 Pt-53) | s/mm | MAS-C(text) | standard clause text | burn ≤60s, unaffected ≥50mm |

> Every **MAS-S** cell is a registry lookup keyed by area or running diameter; every **CALC** cell is a registry formula; **IN** cells are the only things a user touches. This is the literal realization of D1 + D3.

---

## 3. Cable-family matrix the engine must cover (v1 observed)

| Conductor | Insulation | Class/Shape | Armour | Sheath grade | Use |
|-----------|-----------|-------------|--------|--------------|-----|
| Al | XLPE | Class-2 round & sector | Strip / Round / none | PVC ST-2 / FRLS / FRLSH | Power |
| Cu | XLPE | Class-2 round & sector | Strip / Round | PVC ST-2 / FRLS / FRLSH | Power & Control |
| Cu | PVC Type-D | Class-5 flexible | none | PVC ST-3 | Flexible |

Cores seen: 1, 2, 3, 3.5, 4, 5, 7, 14, 16, 24. Sizes: 1.5 → 400 mm². Voltage: 1100 V (LV) throughout.

---

## 4. Engineering implications (feeds PRD)

1. **GTP template engine** = render the registry rows above into the exact 38-row layout, with variant row toggles, N columns (one per quoted size). Output PDF + Excel mirroring the source files.
2. **Diameter build-up chain** matches the IPQC SOP stages exactly: dia-over-conductor → over-insulation → over-laid-up → over-inner-sheath → over-armour → over-outer-sheath = OD (row 31). Each MAS-S thickness lookup is keyed by the *running* diameter from the previous stage.
3. **Standard versioning is mandatory** (1988 vs 2025 on real sheets) → `StandardTable.version` + per-quote pin.
4. **Comparative/BOQ columns** → a GTP/quote holds an ordered list of sizes, not one SKU.
5. **No costing rows exist in any provided sheet.** ➜ See blocker note below.

---

## 5. ⚠️ Costing gap

All eight client files are **purely technical GTPs** — none contain pricing, BOM, weight-cost, or margin. The earlier brief said "generate a GTP **costing** sheet." To build the costing engine to an exact template (per decision D2) we still need either:
- (a) the company's **costing/quotation Excel** (material build-up, conversion rates, margin), **or**
- (b) confirmation that **v1 ships the technical GTP only** and costing is a later phase.

Until one of these is provided, the costing engine remains specified at the formula level (PRD §7) but cannot be matched to a real template.
