import { createClient } from "@/lib/supabase/server";
import DashboardCharts from "./charts";
import {
  TrendingUp,
  ShoppingCart,
  MapPin,
  AlertCircle,
  Users,
  CheckCircle2,
  Clock,
  Package,
} from "lucide-react";
import { format } from "date-fns";

const STATUS_BADGE: Record<string, string> = {
  captured:    "bg-gray-100 text-gray-600",
  validated:   "bg-blue-50 text-blue-700",
  sent_to_erp: "bg-amber-50 text-amber-700",
  confirmed:   "bg-emerald-50 text-emerald-700",
  failed:      "bg-red-50 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  captured:    "Captured",
  validated:   "Validated",
  sent_to_erp: "Sent to Sage",
  confirmed:   "Confirmed",
  failed:      "Failed",
};

export default async function ManagerDashboard() {
  const supabase = await createClient();

  const { data: rawOrders }    = await supabase.from("orders").select("id, total_amount, status, captured_at, customer:customers(name), sales_rep:users!orders_sales_rep_id_fkey(full_name)");
  const { data: rawVisits }    = await supabase.from("visits").select("status, customer_id");
  const { data: rawFollowUps } = await supabase.from("follow_ups").select("is_complete, due_date");
  const { data: rawCustomers } = await supabase.from("customers").select("territory, status");
  const { data: rawDiscounts } = await supabase.from("discount_requests").select("status");

  const orders    = (rawOrders    || []) as any[];
  const visits    = (rawVisits    || []) as any[];
  const followUps = (rawFollowUps || []) as any[];
  const customers = (rawCustomers || []) as any[];
  const discounts = (rawDiscounts || []) as any[];

  // — KPI calculations —
  const totalOrderValue  = orders.reduce((s: number, o: any) => s + (o.total_amount ?? 0), 0);
  const confirmedOrders  = orders.filter((o: any) => o.status === "confirmed").length;
  const closedVisits     = visits.filter((v: any) => v.status === "closed").length;
  const overdueFollowUps = followUps.filter((f: any) => !f.is_complete && new Date(f.due_date) < new Date()).length;
  const atRiskCustomers  = customers.filter((c: any) => c.status === "at_risk").length;
  const pendingApprovals = discounts.filter((d: any) => d.status === "pending").length;
  const totalCustomers   = customers.length;
  const totalOrders      = orders.length;

  // Recent 8 orders
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime())
    .slice(0, 8);

  // Territory breakdown for chart
  const territoryTotals: Record<string, number> = {};
  customers.forEach((c: any) => {
    const t = c.territory ?? "Unassigned";
    territoryTotals[t] = (territoryTotals[t] ?? 0) + 1;
  });
  const territoryData = Object.entries(territoryTotals).map(([territory, count]) => ({ territory, count }));

  // Top-3 KPIs for the demo scope (Total Customers / Orders Created / Order Value)
  const topKpis = [
    {
      label: "Total Customers",
      value: totalCustomers,
      sub: `${atRiskCustomers} at risk`,
      icon: Users,
      color: "text-brand-600",
      bg: "bg-brand-50",
      border: "border-brand-100",
    },
    {
      label: "Orders Created",
      value: totalOrders,
      sub: `${confirmedOrders} confirmed`,
      icon: ShoppingCart,
      color: "text-ok",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      label: "Total Order Value",
      value: `AED ${totalOrderValue.toLocaleString("en-AE", { maximumFractionDigits: 0 })}`,
      sub: "All time",
      icon: TrendingUp,
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-100",
    },
  ];

  const secondaryStats = [
    {
      label: "Visits Closed",
      value: closedVisits,
      sub: `${visits?.length ?? 0} total`,
      icon: MapPin,
      color: "text-brand-600",
      bg: "bg-brand-50",
      border: "border-brand-100",
    },
    {
      label: "Overdue Follow-ups",
      value: overdueFollowUps,
      sub: overdueFollowUps > 0 ? "Needs attention" : "All on track",
      icon: AlertCircle,
      color: overdueFollowUps > 0 ? "text-risk" : "text-ok",
      bg: overdueFollowUps > 0 ? "bg-red-50" : "bg-emerald-50",
      border: overdueFollowUps > 0 ? "border-red-100" : "border-emerald-100",
    },
    {
      label: "Pending Approvals",
      value: pendingApprovals,
      sub: pendingApprovals > 0 ? "Requires review" : "None pending",
      icon: CheckCircle2,
      color: pendingApprovals > 0 ? "text-brand-600" : "text-gray-400",
      bg: pendingApprovals > 0 ? "bg-brand-50" : "bg-gray-50",
      border: pendingApprovals > 0 ? "border-brand-100" : "border-gray-100",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">{format(new Date(), "EEEE, d MMMM yyyy")}</p>
        </div>
        <div className="hero-gradient text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-brand">
          Manager View
        </div>
      </div>

      {/* ── PRIMARY KPIs (demo scope: Total Customers / Orders Created / Order Value) ── */}
      <div>
        <p className="section-title">Key Metrics</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {topKpis.map((s) => (
            <div key={s.label} className={`card p-5 border ${s.border}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{s.label}</p>
                  <p className={`text-3xl font-bold mt-2 ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                  <s.icon size={18} className={s.color} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RECENT ORDERS TABLE ── */}
      <div>
        <p className="section-title">Recent Orders</p>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rep</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-400">
                      No orders yet.
                    </td>
                  </tr>
                )}
                {recentOrders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {o.customer?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {o.sales_rep?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      AED {Number(o.total_amount ?? 0).toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                          STATUS_BADGE[o.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {o.captured_at
                        ? format(new Date(o.captured_at), "d MMM yyyy")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── SECONDARY KPIs ── */}
      <div>
        <p className="section-title">Activity Overview</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {secondaryStats.map((s) => (
            <div key={s.label} className={`card p-5 border ${s.border}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{s.label}</p>
                  <p className={`text-3xl font-bold mt-2 ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                  <s.icon size={18} className={s.color} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TERRITORY CHART ── */}
      <div>
        <p className="section-title">Territory breakdown</p>
        <DashboardCharts territoryData={territoryData} />
      </div>
    </div>
  );
}
