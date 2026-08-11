import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Simulates the round-trip to Sage X3. In production this route would:
//   1. Map the order + line items to Sage X3's Sales Order Web Service payload
//   2. POST to Sage X3 (SOAP or Syracuse REST/OData endpoint)
//   3. Read back the generated Sage order number and any validation errors
//   4. Write the result back here, with retries + an audit_log entry on failure
//
// For the demo, we advance the status through the pipeline with short delays
// so the UI's status screen can visibly show the progression.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  await supabase
    .from("orders")
    .update({ status: "validated", validated_at: new Date().toISOString() })
    .eq("id", id);
  await sleep(1200);

  await supabase
    .from("orders")
    .update({ status: "sent_to_erp", sent_to_erp_at: new Date().toISOString() })
    .eq("id", id);
  await sleep(1500);

  const sageOrderNumber = `SO-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 89999)}`;

  await supabase
    .from("orders")
    .update({
      status: "confirmed",
      sage_order_number: sageOrderNumber,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", id);

  await supabase.from("audit_log").insert({
    entity_type: "order",
    entity_id: id,
    action: "confirmed_by_sage_x3",
    details: { sage_order_number: sageOrderNumber },
  });

  return NextResponse.json({ ok: true, sage_order_number: sageOrderNumber });
}
