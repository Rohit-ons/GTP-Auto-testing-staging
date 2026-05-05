# Parametric Cable Model Generator

A comprehensive engineering tool designed to generate parametric cable models based on international standards (IS:7098, IS:8130). This software streamlines the design, calculation, and approval workflow for industrial cable manufacturing.

## 🚀 Features

- **Parametric Design Engine**: Generate cable specifications based on material properties, voltage ratings, and core configurations.
- **Admin Dashboard**: Real-time analytics and KPIs for design throughput and material usage.
- **Rule-Based Validation**: Automated checks against engineering standards to ensure compliance.
- **Bulk Data Management**: Import materials and SKUs via Excel for high-volume operations.
- **Approval Workflow**: Integrated system for reviewing and approving new cable designs.
- **Technical Library**: Includes reference documentation and PDF standards for engineering verification.

## 📁 Project Structure

- `/webapp`: The core Next.js application (Frontend & Backend).
- `/scripts`: Utility scripts for data processing.
- `/*.pdf`: Technical standards and reference materials used by the generator.
- `deep-research-report.md`: Technical research and design rationale.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TailwindCSS, Lucide React (Icons).
- **Backend**: Next.js API Routes, Server Actions.
- **Database**: PostgreSQL / SQLite (via Prisma ORM).
- **Charts**: Recharts for data visualization.
- **Auth**: NextAuth.js.

## 🏁 Getting Started

### Prerequisites

- Node.js 18+ 
- npm / pnpm / yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd "Parametric Cable Model Generator"
   ```

2. Setup the webapp:
   ```bash
   cd webapp
   npm install
   ```

3. Configure Environment Variables:
   - Copy `.env.example` to `.env`
   - Update the `DATABASE_URL` and `NEXTAUTH_SECRET`.

4. Initialize the Database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📜 Technical Standards

This project is built upon and references the following standards:
- **IS 7098 (Part 1)**: XLPE Insulated PVC Sheathed Cables.
- **IS 8130**: Conductors for Insulated Electric Cables and Flexible Cords.
- Refer to the PDF files in the root directory for detailed specifications.

## 📄 License

Internal Use / Proprietary (Update as needed)
