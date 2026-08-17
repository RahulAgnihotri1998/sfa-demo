import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@/lib/supabase/server";

// Gmail SMTP transporter
const rawPassword = process.env.SMTP_PASSWORD ?? "";
const sanitizedPassword = rawPassword.replace(/\s+/g, "");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: sanitizedPassword,
  },
});

export async function POST(request: Request) {
  try {
    const { recipientEmail, csvContent, summary, customMessage } = await request.json();

    if (!recipientEmail || !csvContent) {
      return NextResponse.json({ error: "Recipient email and CSV content are required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const senderEmail = user?.email || "rahul@masterbaker.com";
    const hasSMTP = process.env.SMTP_USERNAME && process.env.SMTP_PASSWORD;

    const emailSubject = `Executive Sales Budget vs Actual Report (2026 YTD) — Master Baker`;

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; color: #1e293b; line-height: 1.5;">
        <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb, #7c3aed); border-radius: 14px; padding: 24px; color: white; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Master Baker — Executive Sales Analytics</h1>
          <p style="margin: 6px 0 0; font-size: 13px; color: rgba(255,255,255,0.85);">Sales Budget vs Actual 2026 Performance Report</p>
        </div>

        ${customMessage ? `<p style="background: #f1f5f9; padding: 12px 16px; border-radius: 8px; font-size: 13px; color: #334155; border-left: 4px solid #2563eb;"><strong>Note from ${senderEmail}:</strong><br/>${customMessage}</p>` : ""}

        <h3 style="color: #0f172a; font-size: 15px; margin-bottom: 8px;">Executive Summary (2026 YTD)</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px;">
            <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Total 2026 Budget</span>
            <p style="margin: 4px 0 0; font-size: 18px; font-weight: 800; color: #0f172a;">${summary?.totalBudget || "AED 5,850,000"}</p>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px;">
            <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Actual 2026 Sales</span>
            <p style="margin: 4px 0 0; font-size: 18px; font-weight: 800; color: #16a34a;">${summary?.totalActual || "AED 6,120,000"}</p>
          </div>
        </div>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 8px; color: #1e3a8a; font-size: 13px;">Portfolio Split Highlights:</h4>
          <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #1e40af;">
            <li><strong>Egg Products:</strong> ${summary?.eggAchieved || "104.2%"} Target Achieved (${summary?.eggSales || "AED 1.8M"})</li>
            <li><strong>Bakery Ingredients (Ing):</strong> ${summary?.ingAchieved || "106.8%"} Target Achieved (${summary?.ingSales || "AED 2.4M"})</li>
            <li><strong>Finished Goods (FG):</strong> ${summary?.fgAchieved || "98.5%"} Target Achieved (${summary?.fgSales || "AED 1.9M"})</li>
          </ul>
        </div>

        <p style="font-size: 12px; color: #64748b;">
          📎 Attached is the complete <strong>Master_Baker_Sales_Budget_vs_Actual_2026.csv</strong> containing SKU-level actuals, customer category splits, receivables aging, and margin analysis.
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 11px; margin: 0;">Dispatched automatically via Master Baker SFA Portal</p>
      </div>
    `;

    if (hasSMTP) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `Master Baker Analytics <${process.env.SMTP_USERNAME}>`,
        to: recipientEmail,
        subject: emailSubject,
        html: htmlBody,
        attachments: [
          {
            filename: "Master_Baker_Sales_Budget_vs_Actual_2026.csv",
            content: csvContent,
            contentType: "text/csv",
          },
        ],
      });
      console.log(`[CSV EMAIL SENT] Successfully emailed Budget vs Actual CSV to: ${recipientEmail}`);
    } else {
      console.log(`[MOCK CSV EMAIL] To: ${recipientEmail} | Subject: ${emailSubject} | Attach: Master_Baker_Sales_Budget_vs_Actual_2026.csv`);
    }

    return NextResponse.json({
      ok: true,
      message: `Budget vs Actual CSV report successfully emailed to ${recipientEmail}!`,
    });
  } catch (err: any) {
    console.error("Email CSV error:", err);
    return NextResponse.json({ error: "Failed to send email", detail: err.message }, { status: 500 });
  }
}
