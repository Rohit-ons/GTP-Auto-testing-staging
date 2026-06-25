# The Platform, Explained Like a Story

No jargon. This is how the whole thing actually works, using a simple picture you can hold in your head.

---

## The one analogy that explains everything

Imagine you hire a **tireless master cable engineer** who has *memorised every IS standard rulebook* (IS 7098, IS 8130, and the rest).

You don't do the hard work. You just tell this expert the **handful of choices that actually matter** — "Aluminium, 3.5 cores, 185 sq.mm, armoured, FRLSH sheath." The expert instantly:

1. Opens the right rulebook,
2. Looks up every dimension, resistance and thickness the rules demand,
3. Does all the geometry and electrical maths,
4. Hands you a **finished, stamped Guaranteed Technical Particulars (GTP) sheet** — the exact document your customer's tender asks for.

**That expert is this software.** Everything below is just *who does what* inside that expert's head.

---

## The old way vs. the new way

```
   OLD WAY                                 NEW WAY
   ┌───────────────────────┐               ┌───────────────────────┐
   │  Engineer + Excel      │               │  Pick 16 things        │
   │  - copy last sheet     │               │  - software fills the  │
   │  - hunt rulebook tables │      ──►       │    other 22 by the     │
   │  - retype numbers      │               │    rulebook, instantly │
   │  - hope nothing's wrong │               │  - stamped & filed     │
   │  - 30–60 min, error-prone│             │  - under 5 minutes     │
   └───────────────────────┘               └───────────────────────┘
```

---

## Storyboard: a day with the app

**Meet Ravi, a design engineer.** A customer wants a price + spec for a power cable. Here's his screen-by-screen story, with what happens *behind the curtain* explained in plain words.

---

### PANEL 1 — Ravi opens the Workbench (`/design`)

```
 ┌──────────────── DESIGN WORKBENCH ────────────────┐
 │  INPUTS (left)            LIVE GTP SHEET (right)  │
 │  ─────────────            ─────────────────────   │
 │  Standard: IS 7098 1988   (empty until he picks)  │
 │  Cores:    [ 3.5 ▾]                               │
 │  Material: [ AL  ▾]                               │
 │  Size:     [ 185 ]                                │
 │  Armour:   [ Yes ▾]                               │
 │  Sheath:   [ FRLSH ▾]                             │
 └───────────────────────────────────────────────────┘
```
The left side is a short form — **only the things a human should decide.** The right side is the spec sheet that will fill itself in.

---

### PANEL 2 — He picks his options, and the sheet writes itself

The moment Ravi chooses "Aluminium, 185 sq.mm," the right side springs to life:

```
 #   Description                  Value             Type
 9   Size                         185 / 95          ← YOUR CHOICE
 10  No. of Strands               30 / 15           ← RULEBOOK
 17  Insulation Thickness         1.60 / 1.34 mm    ← RULEBOOK + MATH
 30  Outer Sheath Thickness       1.88 mm           ← RULEBOOK
 31  Overall Diameter             45.3 mm           ← CALCULATED
 36  DC Resistance @20°C          0.164 ohm/km      ← RULEBOOK
```

He typed **one number** (185). The software filled in the **other 37 lines** by the rules. That's the magic moment.

---

### PANEL 3 — Behind the curtain: who did the work?

When Ravi changed that number, a tiny relay race happened in under a second:

```
  Ravi's screen                the back office
  ┌─────────────┐   "185!"   ┌──────────────────────────────────────┐
  │ Receptionist │ ─────────► │  Runner → Librarian → Master Engineer │
  │ (the form)   │ ◄───────── │  hands back the finished sheet        │
  └─────────────┘  finished   └──────────────────────────────────────┘
```

Four characters, each with one job:

- **The Receptionist** (the on-screen form) — takes Ravi's choices. Does no thinking.
- **The Runner** (a "server action") — sprints Ravi's choices to the back office and brings the answer back.
- **The Librarian** (the "standards provider") — pulls the **correct rulebook for the chosen year** off the shelf and reads out the exact values asked for ("185 Aluminium? Resistance is 0.164. Strands: 30.").
- **The Master Engineer** (the "engine") — takes Ravi's choices + the Librarian's rulebook values, does the geometry/maths, and writes the finished 38-line sheet.

The **Filing Cabinet** (the database) is the room where the rulebooks, the material list, and all saved sheets live.

> Why split it up? So the Master Engineer only ever does maths and never has to remember rulebook numbers — and so we can swap the 1988 rulebook for the 2025 one just by telling the Librarian "use the other shelf," without retraining the engineer.

---

### PANEL 4 — The three kinds of fields (this is the heart of it)

Every one of the 38 lines on the sheet is one of three colours. Once you see this, the whole app makes sense:

```
  🟦 YOUR CHOICES          things only a human decides
     (Cores, Material, Size, Armoured?, Sheath grade, Colour…)

  🟦 THE RULEBOOK'S ANSWER  the software looks these up — you never type them
     (Strands, Insulation thickness, Sheath thickness, Resistance, Fire tests…)
     → these come straight out of IS 8130 / IS 7098 tables

  🟪 THE ENGINEER'S MATHS   worked out from your choices + the rulebook
     (Overall Diameter, the cable's full description sentence…)

  ⬜ FIXED LABELS           always the same (Manufacturer name, brand, printing text)
```

**The big idea:** in the old Excel world, a human typed *all* of these and could get any of them wrong. Here, you only ever touch the 🟦 blue "your choices." The rest are guaranteed-correct because they're read from the rulebook or calculated.

---

### PANEL 5 — How the "Overall Diameter" is built (the cable, layer by layer)

The software builds the cable in its head the same way the factory builds it for real — one layer at a time, each layer sitting on the one below:

```
        ((( bare conductor )))           start: √(area) → diameter
      + insulation around it             rulebook thickness
      + cores twisted together           they pack into a circle
      + inner sheath wrap                rulebook thickness
      + steel armour                     rulebook thickness
      + outer sheath jacket              rulebook thickness
      ─────────────────────────
      = OVERALL DIAMETER
```

Crucially, **each layer's thickness depends on how thick the cable already is.** A fatter cable gets a thicker outer jacket. So the software measures the cable after each layer and asks the Librarian "for *this* thickness, what does the rulebook say the next layer should be?" That's why the order matters.

---

### PANEL 6 — Ravi disagrees with one number (the "Override")

The customer's tender insists the outer sheath be exactly **1.50 mm**, even though IS says 1.88. Ravi clicks the little ✎ next to that line, types `1.50`, and gives a reason: *"Customer spec PO-4471."*

```
 30  Outer Sheath Thickness   1.50 mm  (was 1.88)   ⚠ overridden
```

The software **keeps both numbers** — your 1.50 *and* the rulebook's 1.88 — shows them side by side, and writes a permanent signed note: *who* changed it, *to what*, and *why*. Nothing is ever quietly faked; every deviation is on the record. Think of it as **writing in the margin and initialling it.**

---

### PANEL 7 — He saves it (the "snapshot")

Ravi clicks **Save**. The software takes a **photograph of the entire finished sheet** — every value, the rulebook year used, and his override note — and files it in the cabinet as a permanent record (a "SKU").

```
  📷  CABLE SKU #a1b2
      • all 38 lines, frozen
      • rulebook: IS 7098 : 1988
      • override: row 30 → 1.50 (Customer spec PO-4471), by Ravi
      • status: PENDING approval
```

**Why a photograph?** Because tenders are legal documents. If someone updates the rulebook *next year*, Ravi's already-saved sheet must **not** change. The photo guarantees that what he promised the customer stays exactly as it was. (A fresh design started tomorrow would use the new rulebook — but this frozen one never moves.)

---

### PANEL 8 — The boss approves, the PDF goes out

```
   Ravi (Engineer) ──► PENDING ──► Manager clicks "Approve" ──► APPROVED ──► Export PDF ──► Customer
```

The manager opens the saved sheet (`/admin/cables/…`), sees the full GTP **plus the audit trail** (the history of who did what), and clicks **Approve**. Then **Export PDF** turns it into the clean, printable tender document. Different people have different powers: an engineer can design and save, but only a manager/approver can stamp it "approved."

---

### PANEL 9 — Updating the rulebook (Admin)

Standards change. When IS revises a thickness, the admin doesn't call a programmer — they open **`/admin/standards`**, edit the number in the table, and save. Every future sheet uses it instantly (old photos stay frozen). Every edit is logged.

There's also **`/admin/registry`** — a "table of contents" that lists all 38 lines and, for each, shows *which bucket it is* (your choice / rulebook / maths) and *which IS clause governs it.* It's the map of the whole sheet.

---

## The whole platform on one page

```
        ┌─────────────────────────── YOU ────────────────────────────┐
        │  1. /design        Pick 16 things → watch the sheet fill    │
        │  2. ✎ override     Disagree with a rulebook value (signed)  │
        │  3. Save           Freeze a photograph of the sheet         │
        │  4. /admin/cables  Approve · view audit · export PDF        │
        │  5. /admin/standards  Edit the rulebook (admins)            │
        │  6. /admin/registry   See the map of all 38 lines           │
        └─────────────────────────────────────────────────────────────┘

        Behind the curtain, every time you touch an input:
        Receptionist → Runner → Librarian (right rulebook) → Master Engineer → finished sheet
```

---

## Adding more IS standards — in plain words

Think of it like a library of rulebooks.

- **Easiest — fix a number in a rulebook you already own.**
  Example: a resistance value is wrong, or you sell a new cable size.
  → Open **`/admin/standards`**, edit the cell, save. No programmer. Done in seconds.

- **Medium — add a *new edition* of a rulebook you already own.**
  Example: IS 7098 releases a 2030 revision with new thickness tables, and you want to switch between 1988/2025/2030 from the dropdown.
  → A one-time setup: type the new edition's numbers into the master list and re-load. After that it's a dropdown choice forever.

- **Bigger — invent a *new kind of measurement* the sheet never had.**
  Example: you start adding a water-blocking tape layer, or a metallic screen, or a brand-new test line that no current cable tracks.
  → This needs a developer to add the new "slot" (because it's genuinely a new thing the cable now has), then it behaves like all the others.

Rule of thumb: **most real changes are the easy kind** — just editing rulebook numbers in the admin screen. You only need a developer when you're adding a *physically new part of the cable* that the system has never seen before.

---

## If you remember only five things

1. **You make ~16 choices; the software fills the other ~22 lines by the rulebook.**
2. **Every line is one of three things:** your choice, a rulebook lookup, or a calculation.
3. **The cable's diameter is built layer-by-layer**, each layer's thickness decided by the rulebook based on the thickness so far.
4. **Saving takes a permanent photo** so a promised spec never silently changes later; **overrides are always signed and logged.**
5. **Updating standards is just editing a table** in the admin screen — no programming for the everyday cases.
```
