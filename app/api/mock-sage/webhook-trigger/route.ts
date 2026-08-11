import { NextResponse } from "next/server";
import { MockSageX3Service, SageWebhookPayload } from "@/lib/erp";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Simulates an inbound Sage X3 Webhook and performs the status write-back to SFA database.
 * Usage: POST /api/mock-sage/webhook-trigger
 * Body: { entityType: "discount_request" | "order", entityId: "uuid", action: "approve" | "reject" | "dispatch" | "invoice" }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { entityType, entityId, action } = body;

    if (!entityType || !entityId || !action) {
      return NextResponse.json(
        { error: "Missing required fields: entityType, entityId, action" },
        { status: 400 }
      );
    }

    const payload: SageWebhookPayload = MockSageX3Service.createMockWebhookPayload(
      entityType,
      entityId,
      action
    );

    const supabase = createAdminClient();

    // Perform the status write-back
    if (entityType === "discount_request") {
      const updateData: Record<string, any> = {
        status: payload.status,
        updated_at: new Date().toISOString(),
      };
      if (payload.status === "approved") {
        updateData.approved_at = new Date().toISOString();
      } else {
        updateData.rejection_reason = payload.rejection_reason;
      }

      await supabase
        .from("discount_requests")
        .update(updateData)
        .eq("id", entityId);

    } else if (entityType === "order") {
      await supabase
        .from("orders")
        .update({
          status: payload.status,
          sage_order_number: payload.sage_reference_no,
          updated_at: new Date().toISOString(),
        })
        .eq("id", entityId);
    }

    // Log the event in audit log / webhook logs
    await supabase.from("audit_log").insert({
      entity_type: entityType,
      entity_id: entityId,
      action: `sage_webhook_${payload.event_type}`,
      details: payload,
    });

    return NextResponse.json({
      success: true,
      message: `Simulated Sage X3 webhook processed successfully for ${entityType} ${entityId}`,
      webhook_payload: payload,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process simulated ERP webhook" },
      { status: 500 }
    );
  }
}
