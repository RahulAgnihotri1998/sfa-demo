import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MapPin, Clock, AlertTriangle, ChevronRight, TrendingUp, ShoppingCart, Users } from "lucide-react";
import { format } from "date-fns";
import { GamificationBanner } from "@/components/GamificationBanner";
import { PowerBiSalesDashboard } from "@/components/PowerBiSalesDashboard";
import ExportExcelButton from "@/components/ExportExcelButton";

export default async function RepHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, territory")
    .eq("id", user?.id)
    .single();

  const { data: rawFollowUps } = await supabase
    .from("follow_ups")
    .select("id, due_date, description, customer:customers(name)")
    .eq("sales_rep_id", user?.id)
    .eq("is_complete", false)
    .order("due_date", { ascending: true })
    .limit(5);

  const { data: rawCustomers } = await supabase
    .from("customers")
    .select("id, name, status, territory")
    .eq("account_owner_id", user?.id)
    .limit(5);

  const { data: rawOrders } = await supabase
    .from("orders")
    .select(`
      id,
      total_amount,
      status,
      captured_at,
      customer:customers(name, territory),
      order_items(
        quantity,
        product:products(name)
      )
    `)
    .eq("sales_rep_id", user?.id)
    .order("captured_at", { ascending: false })
    .limit(8);

  const followUps = (rawFollowUps || []) as any[];
  const customers = (rawCustomers || []) as any[];
  const orders = (rawOrders || []) as any[];

  const atRiskCount = customers.filter((c: any) => c.status === "at_risk").length;
  const totalCustomers = customers.length;
  const firstName = (profile as any)?.full_name?.split(" ")[0] ?? "there";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">

      {/* Hero greeting band */}
      <div className="hero-gradient rounded-2xl p-5 text-white shadow-brand">
        <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest">{greeting}</p>
        <h1 className="text-2xl font-bold mt-1">Hey, {firstName} 👋</h1>
        <p className="text-blue-100 text-sm mt-1 opacity-80">
          {profile?.territory} · {format(new Date(), "EEEE, d MMM yyyy")}
        </p>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{totalCustomers}</p>
            <p className="text-[10px] text-blue-100 mt-0.5 uppercase tracking-wide">Accounts</p>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{followUps?.length ?? 0}</p>
            <p className="text-[10px] text-blue-100 mt-0.5 uppercase tracking-wide">Follow-ups</p>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
            <p className={`text-2xl font-bold ${atRiskCount > 0 ? "text-red-300" : ""}`}>{atRiskCount}</p>
            <p className="text-[10px] text-blue-100 mt-0.5 uppercase tracking-wide">At risk</p>
          </div>
        </div>
      </div>

      {/* Gamification & Leaderboard Badge */}
      <GamificationBanner repName={profile?.full_name} points={1820} streakDays={7} monthlyRank={2} />

      {/* ── SALES BUDGET VS ACTUAL PERFORMANCE (POWER BI HUB) ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="section-title mb-0">Sales Budget vs Actual Performance (Customer Basis)</p>
          <span className="text-xs text-slate-500 font-medium">Customer-Wise Target vs Actual &amp; Receivables Hub</span>
        </div>
        <PowerBiSalesDashboard defaultTab="customer" repId={user?.id} role="sales_rep" />
      </div>

      {/* Quick actions */}
      <div>
        <p className="section-title">Quick actions</p>
        <div className="grid grid-cols-3 gap-3">
          <Link href="/rep/customers" className="card-hover p-4 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mx-auto">
              <Users size={18} className="text-brand-600" />
            </div>
            <p className="text-xs font-semibold text-gray-700">Customers</p>
          </Link>
          <Link href="/rep/order/new" className="card-hover p-4 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center mx-auto">
              <ShoppingCart size={18} className="text-violet-600" />
            </div>
            <p className="text-xs font-semibold text-gray-700">New Order</p>
          </Link>
          <Link href="/rep/alerts" className="card-hover p-4 text-center space-y-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto ${atRiskCount > 0 ? "bg-red-50" : "bg-emerald-50"}`}>
              <TrendingUp size={18} className={atRiskCount > 0 ? "text-risk" : "text-ok"} />
            </div>
            <p className="text-xs font-semibold text-gray-700">Alerts</p>
          </Link>
        </div>
      </div>

      {/* At-risk alert */}
      {atRiskCount > 0 && (
        <Link href="/rep/alerts" className="block">
          <div className="alert-strip-risk rounded-2xl px-4 py-3.5">
            <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={16} className="text-risk" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                {atRiskCount} customer{atRiskCount > 1 ? "s" : ""} at risk
              </p>
              <p className="text-xs opacity-80 mt-0.5">Declining purchases detected — tap to review</p>
            </div>
            <ChevronRight size={16} className="opacity-50 flex-shrink-0" />
          </div>
        </Link>
      )}

      {/* Follow-ups */}
      <div>
        <p className="section-title">Upcoming follow-ups</p>
        <div className="space-y-2.5">
          {followUps && followUps.length > 0 ? (
            followUps.map((f: any) => (
              <div key={f.id} className="card p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock size={15} className="text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{f.customer?.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{f.description}</p>
                  <p className="text-xs text-brand-500 font-medium mt-1">
                    Due {format(new Date(f.due_date), "EEE, dd MMM")}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="card p-5 text-center">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <TrendingUp size={18} className="text-ok" />
              </div>
              <p className="text-sm font-semibold text-gray-700">All caught up!</p>
              <p className="text-xs text-gray-400 mt-0.5">No pending follow-ups. Great work.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Log */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="section-title mb-0">Recent Orders Log</p>
          <div className="flex items-center gap-2">
            <ExportExcelButton
              data={orders.map((o: any) => ({
                "Order ID": o.id,
                "Customer": o.customer?.name || "Unknown Customer",
                "Territory": o.customer?.territory || "—",
                "Products": o.order_items?.map((item: any) => `${item.product?.name || "Product"} (${item.quantity})`).join(", ") || "—",
                "Total Amount (AED)": o.total_amount,
                "ERP Status": o.status === "sent_to_erp" ? "Sent to Sage" : o.status,
                "Date": format(new Date(o.captured_at || Date.now()), "dd MMM yyyy HH:mm"),
              }))}
              filename="Rep-Recent-Orders-Log"
              sheetName="Orders"
            />
            <Link href="/rep/order/new" className="text-xs text-brand-600 font-semibold">
              + New Order
            </Link>
          </div>
        </div>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Customer &amp; Territory</th>
                  <th className="px-4 py-3">Products Ordered</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">ERP Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {orders && orders.length > 0 ? (
                  orders.map((o: any) => {
                    const statusColors: Record<string, string> = {
                      captured: "bg-gray-100 text-gray-600",
                      validated: "bg-blue-50 text-blue-700",
                      sent_to_erp: "bg-amber-50 text-amber-700",
                      confirmed: "bg-emerald-50 text-emerald-700",
                      failed: "bg-red-50 text-red-700",
                    };
                    const statusLabels: Record<string, string> = {
                      captured: "Captured",
                      validated: "Validated",
                      sent_to_erp: "Sent to Sage",
                      confirmed: "Confirmed",
                      failed: "Failed",
                    };

                    // Summarize items
                    const itemsSummary = o.order_items && o.order_items.length > 0
                      ? o.order_items.map((oi: any) => `${oi.quantity}x ${oi.product?.name || "Product"}`).join(", ")
                      : "No items";

                    return (
                      <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900 leading-tight">
                            {o.customer?.name}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            📍 {o.customer?.territory || "Unassigned"}
                          </p>
                        </td>
                        <td className="px-4 py-3 max-w-[200px] truncate text-xs text-gray-500" title={itemsSummary}>
                          {itemsSummary}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          AED {Number(o.total_amount || 0).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              statusColors[o.status] ?? "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {statusLabels[o.status] ?? o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {format(new Date(o.captured_at), "dd MMM yyyy")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/rep/order/${o.id}/status`}
                            className="text-xs text-brand-600 font-semibold hover:underline"
                          >
                            Track →
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-400">
                      No orders placed yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Customer list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="section-title mb-0">Your accounts</p>
          <Link href="/rep/customers" className="text-xs text-brand-600 font-semibold">
            View all →
          </Link>
        </div>
        <div className="space-y-2.5">
          {customers?.map((c) => (
            <Link
              key={c.id}
              href={`/rep/customers/${c.id}`}
              className="card-hover p-4 flex items-center gap-3"
            >
              <div className="w-9 h-9 avatar flex-shrink-0 text-xs">
                {c.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={11} className="text-gray-400" />
                  <p className="text-xs text-gray-400">{c.territory}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {c.status === "at_risk" && (
                  <span className="badge-risk">At risk</span>
                )}
                {c.status === "active" && (
                  <span className="badge-ok">Active</span>
                )}
                <ChevronRight size={15} className="text-gray-300" />
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
