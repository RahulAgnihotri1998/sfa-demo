import { createClient } from "@/lib/supabase/server";
import TeamPageClient from "./TeamPageClient";

export default async function TeamPage() {
  const supabase = await createClient();

  const { data: rawReps } = await supabase
    .from("users")
    .select("*")
    .order("full_name");
    
  const { data: rawVisits } = await supabase
    .from("visits")
    .select("*, customer:customers(*)")
    .order("created_at", { ascending: false });
    
  const { data: rawOrders } = await supabase
    .from("orders")
    .select("*, customer:customers(name), order_items(*)")
    .order("captured_at", { ascending: false });
    
  const { data: rawDiscounts } = await supabase
    .from("discount_requests")
    .select("*, customer:customers(name)")
    .order("created_at", { ascending: false });

  const { data: rawCompetitors } = await supabase
    .from("competitor_intelligence")
    .select("*, customer:customers(name)")
    .order("created_at", { ascending: false });

  const { data: rawAudits } = await supabase
    .from("visit_product_audits")
    .select("*, product:products(*)")
    .order("created_at", { ascending: false });

  const allUsers = (rawReps || []) as any[];
  const reps = allUsers.filter((u: any) => u.role === "sales_rep" || u.role === "rep");
  const visits = (rawVisits || []) as any[];
  const orders = (rawOrders || []) as any[];
  const discounts = (rawDiscounts || []) as any[];
  const competitors = (rawCompetitors || []) as any[];
  const audits = (rawAudits || []) as any[];

  return (
    <TeamPageClient
      reps={reps.length > 0 ? reps : allUsers}
      visits={visits}
      orders={orders}
      discounts={discounts}
      competitors={competitors}
      audits={audits}
    />
  );
}
