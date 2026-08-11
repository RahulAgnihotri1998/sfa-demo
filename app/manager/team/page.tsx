import { createClient } from "@/lib/supabase/server";
import TeamPageClient from "./TeamPageClient";

export default async function TeamPage() {
  const supabase = await createClient();

  const { data: rawReps } = await supabase
    .from("users")
    .select("*")
    .eq("role", "sales_rep")
    .order("full_name");
    
  const { data: rawVisits } = await supabase
    .from("visits")
    .select("*, customer:customers(name)")
    .order("planned_date", { ascending: false });
    
  const { data: rawOrders } = await supabase
    .from("orders")
    .select("*, customer:customers(name), order_items(*)")
    .order("captured_at", { ascending: false });
    
  const { data: rawDiscounts } = await supabase
    .from("discount_requests")
    .select("*, customer:customers(name)")
    .order("created_at", { ascending: false });

  const reps = (rawReps || []) as any[];
  const visits = (rawVisits || []) as any[];
  const orders = (rawOrders || []) as any[];
  const discounts = (rawDiscounts || []) as any[];

  return (
    <TeamPageClient
      reps={reps}
      visits={visits}
      orders={orders}
      discounts={discounts}
    />
  );
}
