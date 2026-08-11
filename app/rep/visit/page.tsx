import { createClient } from "@/lib/supabase/server";
import VisitsDashboardClient from "./VisitsDashboardClient";

export default async function VisitsPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch rep's visits including customer names
  const { data: rawVisits } = await supabase
    .from("visits")
    .select("*, customer:customers(name)")
    .eq("sales_rep_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch rep's customers so they can start check-ins directly
  const { data: rawCustomers } = await supabase
    .from("customers")
    .select("*")
    .eq("account_owner_id", user.id)
    .order("name");

  const visits = (rawVisits || []) as any[];
  const customers = (rawCustomers || []) as any[];

  return (
    <VisitsDashboardClient
      initialVisits={visits}
      customers={customers}
    />
  );
}
