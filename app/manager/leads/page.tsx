import { createClient } from "@/lib/supabase/server";
import LeadsDashboardClient from "./LeadsDashboardClient";

export default async function ManagerLeadsPage() {
  const supabase = await createClient();

  // Fetch all leads generated in the system
  const { data: rawLeads } = await supabase
    .from("leads")
    .select("*, owner:users(full_name)")
    .order("created_at", { ascending: false });

  const leads = (rawLeads || []) as any[];

  return <LeadsDashboardClient initialLeads={leads} />;
}
