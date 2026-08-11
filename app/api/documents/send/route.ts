import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

// Gmail SMTP transporter
const rawPassword = process.env.SMTP_PASSWORD ?? "";
const sanitizedPassword = rawPassword.replace(/\s+/g, "");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // TLS (STARTTLS) on port 587
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: sanitizedPassword,
  },
});

export async function POST(request: Request) {
  const { documentId, customerId, message } = await request.json();

  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: document } = await admin.from("documents").select("*").eq("id", documentId).single();
  const { data: customer } = await admin.from("customers").select("*").eq("id", customerId).single();

  const recipientEmail = customer?.contact_email || `${customer?.name.toLowerCase().replace(/[\s\W]+/g, "")}@demo-client.com`;

  if (!document) {
    return NextResponse.json({ error: "Missing document record" }, { status: 400 });
  }

  const hasSMTP = process.env.SMTP_USERNAME && process.env.SMTP_PASSWORD;

  try {
    if (hasSMTP) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `Master Baker <${process.env.SMTP_USERNAME}>`,
        to: recipientEmail,
        subject: `${document.title} — Master Baker Portal`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0f172a;">
            <div style="background: linear-gradient(135deg, #1a34a0, #2952e3, #5b21b6); border-radius: 14px; padding: 24px; margin-bottom: 24px;">
              <h1 style="color: white; margin: 0; font-size: 20px;">Master Baker Portal</h1>
              <p style="color: rgba(255,255,255,0.75); margin: 4px 0 0; font-size: 13px;">Document Sharing</p>
            </div>
            
            <p style="margin-top: 0;">Dear <strong>${customer.contact_name ?? customer.name}</strong>,</p>
            
            <p>${message || `Please find the following document from our team:`}</p>
            
            <div style="background: #f8faff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; font-weight: 600; color: #1e3a8a;">📄 ${document.title}</p>
              <p style="margin: 6px 0 0; font-size: 13px; color: #64748b; text-transform: capitalize;">${document.type}</p>
              ${document.file_url ? `<a href="${document.file_url}" style="display: inline-block; margin-top: 12px; background: #2952e3; color: white; text-decoration: none; padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 600;">View Document →</a>` : ""}
            </div>
            
            <p style="color: #64748b; font-size: 13px;">Regards,<br/><strong>${user?.email ?? "Master Baker Team"}</strong></p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #94a3b8; font-size: 11px; margin: 0;">Sent via Master Baker Portal</p>
          </div>
        `,
      });

      console.log(`[EMAIL SENT] To: ${recipientEmail} | Doc: ${document.title}`);
    } else {
      // Fallback: log to console if SMTP not configured
      console.log(`[MOCK EMAIL — no SMTP configured]
=========================================
TO: ${recipientEmail}
SUBJECT: ${document.title}
MESSAGE: ${message || `Please find attached: ${document.title}`}
DOCUMENT URL: ${document.file_url}
SENDER: ${user?.email}
=========================================`);
    }

    // Log the share in the database
    await admin.from("document_shares").insert({
      document_id: documentId,
      customer_id: customerId,
      sales_rep_id: user?.id,
      channel: "email",
      recipient: recipientEmail,
      message,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[EMAIL ERROR]", err?.message ?? err);
    return NextResponse.json(
      { error: "Send failed", detail: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
