import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user?.id)
    .single();

  const initials = profile?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "MG";

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar
        role="Manager"
        userName={profile?.full_name ?? user?.email ?? "Manager"}
        initials={initials}
        signOutAction={signOut}
      />
      {/* Main content offset by sidebar */}
      <div className="sidebar-page w-full">
        <main className="sidebar-content animate-in">{children}</main>
      </div>
    </div>
  );
}
