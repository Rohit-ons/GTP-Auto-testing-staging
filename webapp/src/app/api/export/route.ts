import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import type { GtpSheet } from "@/lib/engine/types";

function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function POST(req: Request) {
  try {
    const { sheet, fileName } = (await req.json()) as { sheet: GtpSheet; fileName?: string };
    if (!sheet?.rows) return NextResponse.json({ error: "No sheet provided" }, { status: 400 });

    const rowsHtml = sheet.rows
      .map((r) =>
        r.section
          ? `<tr class="section"><td>${esc(r.rowNo)}</td><td colspan="3">${esc(r.label)}</td></tr>`
          : `<tr><td>${esc(r.rowNo)}</td><td>${esc(r.label)}</td><td>${esc(r.unit ?? "")}</td><td>${esc(r.value)}</td></tr>`,
      )
      .join("");

    const html = `
      <html><head><style>
        body { font-family: 'Inter', Arial, sans-serif; color: #1e293b; padding: 32px; font-size: 12px; }
        .head { text-align:center; margin-bottom: 16px; }
        .head h1 { font-size: 15px; margin: 0; }
        .head .sub { font-size: 11px; color:#475569; }
        .meta { font-size: 11px; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #cbd5e1; padding: 5px 7px; text-align: left; vertical-align: top; }
        th { background:#f1f5f9; }
        tr.section td { background:#e2e8f0; font-weight: 700; }
        .foot { margin-top: 24px; font-size: 10.5px; }
        .foot .notes div { margin-bottom: 3px; }
        .foot .sig { margin-top: 14px; text-align: right; font-weight: 600; }
      </style></head>
      <body>
        <div class="head">
          <h1>${esc(sheet.header.manufacturer)} — ${esc(sheet.header.brand)}</h1>
          <div class="sub">GUARANTEED TECHNICAL PARTICULARS</div>
          <div class="sub">${esc(sheet.header.title)}</div>
        </div>
        <div class="meta">
          ${sheet.header.customer ? `<div>Customer: ${esc(sheet.header.customer)}</div>` : ""}
          ${sheet.header.project ? `<div>Project: ${esc(sheet.header.project)}</div>` : ""}
          <div>Applicable Standards: ${esc(sheet.header.applicableStandards)}</div>
        </div>
        <table>
          <thead><tr><th style="width:40px">S.No</th><th>Description</th><th style="width:70px">Unit</th><th>Value</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div class="foot">
          <div class="notes">
            ${(sheet.footer?.notes ?? ["* OD is calculated for reference; actual OD varies per tolerance."]).map((n) => `<div>${esc(n)}</div>`).join("")}
          </div>
          <div class="sig">${esc(sheet.footer?.signatory ?? `FOR: ${sheet.header.manufacturer}`)}</div>
        </div>
      </body></html>`;

    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ format: "A4", printBackground: true, margin: { top: "16px", bottom: "16px", left: "16px", right: "16px" } });
    await browser.close();

    const safeName = (fileName ?? "GTP").replace(/[^a-zA-Z0-9]+/g, "_");
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="GTP_${safeName}.pdf"`,
      },
    });
  } catch (error: unknown) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
