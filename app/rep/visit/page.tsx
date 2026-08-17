import { createClient } from "@/lib/supabase/server";
import VisitsDashboardClient from "./VisitsDashboardClient";

export default async function VisitsPage() {
  const supabase = await createClient();
  
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const userId = authUser?.id || "22222222-2222-2222-2222-222222222222";

  // Fetch rep's visits including customer names
  const { data: rawVisits } = await supabase
    .from("visits")
    .select("*, customer:customers(name)")
    .order("created_at", { ascending: false });

  // Fetch all customers so they can plan visits and start check-ins directly
  const { data: rawCustomers } = await supabase
    .from("customers")
    .select("*")
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
