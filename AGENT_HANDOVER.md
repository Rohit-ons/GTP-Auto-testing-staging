# Project Handover: Parametric Cable Model Generator

## 📌 Project Overview
The **Parametric Cable Model Generator** is an industrial-grade engineering application designed to automate the specification, calculation, and design of electrical cables. It translates complex international standards (IS:7098 and IS:8130) into a digital design engine.

## 🏗️ Technical Architecture

### 1. Core Framework
- **Frontend/Backend**: Next.js 15 (App Router) with TypeScript.
- **Styling**: TailwindCSS for a premium, responsive UI.
- **Database**: Prisma ORM with PostgreSQL (configured for SQLite in development).
- **Authentication**: NextAuth.js (implemented in `src/lib/authOptions.ts`).
- **Visualization**: Recharts for administrative dashboards and KPI tracking.

### 2. Engineering Engines (`webapp/src/lib/engines/`)
- **`calculation.ts`**: Handles the physics and material science calculations. It computes resistivity, weight, diameter, and electrical properties based on input parameters (voltage, core count, cross-section area).
- **`rules.ts`**: The "Brain" of the software. It contains the validation logic derived from IS standards. It ensures that any design generated meets safety and industry requirements.

### 3. Design System (`webapp/src/app/design/`)
- **`page.tsx` & `DesignFormClient.tsx`**: A complex multi-step form that allows engineers to input cable parameters. It features real-time validation and calculation previews.
- **Nuance**: The form is highly reactive; changing a "Voltage Grade" or "Material Type" dynamically updates the available insulation and sheathing options based on the `rules.ts` engine.

### 4. Administrative Controls
- **Rule Management (`webapp/src/app/admin/rules/`)**: Allows senior engineers to update the constants and thresholds used by the engine without touching the code.
- **Bulk Import (`webapp/src/components/BulkImport...`)**: Implements Excel/CSV parsing to allow mass creation of material master data and cable SKUs.
- **Dashboard (`webapp/src/components/DashboardCharts.tsx`)**: Provides analytics on design history, material costs, and approval throughput.

## ⚖️ Standards & Compliance
The software is strictly tied to the following PDF documents (found in the root directory):
- **IS 7098 (Part 1)**: Specification for XLPE insulated PVC sheathed cables.
- **IS 8130**: Specification for conductors in insulated cables.
- **Nuance**: Any agent MUST cross-reference logic changes with these standards. The "Rules" engine is a digital representation of these specific clauses.

## 🛠️ Work Completed to Date
1.  **Full Auth System**: Secured admin and user roles.
2.  **Parametric Design Engine**: Functional UI for generating cable spec sheets.
3.  **Data Persistence**: Prisma schema fully mapped to cable design attributes.
4.  **Admin Dashboard**: KPIs and charts for management overview.
5.  **Bulk Management**: Integrated system for material and SKU imports.
6.  **Repository Setup**: Consolidated project with proper `.gitignore`, `.env.example`, and premium `README.md`.

## 🚀 Scope for the Next Agent
- **Approval Workflow Enhancement**: Currently, designs can be generated; the next phase involves a multi-tier approval system (Draft -> Pending -> Approved -> Production).
- **Costing Module**: Integration of real-time material pricing (Copper/Aluminum/PVC) to provide estimated manufacturing costs.
- **PDF Generation**: Automating the export of technical "Spec Sheets" in a formatted PDF for clients.
- **Advanced Validations**: Implementing IS:7098 Part 2 (Higher voltages) logic.

## ⚠️ Important Nuances for the Agent
- **Standard Over Code**: If there is a conflict between a code comment and the IS PDF standards, **trust the PDF standards**.
- **Performance**: The calculation engine runs on the client for speed but must be validated on the server before database persistence.
- **Database**: The `dev.db` is local; ensure `npx prisma db push` is run after any schema changes in `prisma/schema.prisma`.
