import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  TrendingDown,
  AlertTriangle,
  Calendar,
  MessageSquare,
  Percent,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import ExportExcelButton from "@/components/ExportExcelButton";

export default async function AlertsPage() {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("purchase_history")
    .select("customer_id, product_id, quantity, amount, order_month, customer:customers(name), product:products(name)")
    .order("order_month", { ascending: true });

  const grouped: Record<string, any[]> = {};
  rows?.forEach((r: any) => {
    const key = `${r.customer_id}_${r.product_id}`;
    grouped[key] = [...(grouped[key] ?? []), r];
  });

  const alerts = Object.values(grouped)
    .map((series) => {
      if (series.length < 2) return null;
      const latest = series[series.length - 1];
      const prior = series.slice(0, -1);
      const priorAvg = prior.reduce((s, r) => s + r.amount, 0) / prior.length;
      const dropPct = ((priorAvg - latest.amount) / priorAvg) * 100;

      if (dropPct >= 40) {
        // Calculate max amount in series for sparkline scaling
        const maxAmount = Math.max(...series.map((s) => s.amount), 1);
        
        return {
          customer: latest.customer?.name,
          product: latest.product?.name,
          dropPct: Math.round(dropPct),
          priorAvg: Math.round(priorAvg),
          latest: latest.amount,
          customerId: latest.customer_id,
          loss: Math.round(priorAvg - latest.amount),
          series: series.map((s) => ({
            month: new Date(s.order_month).toLocaleDateString("en", { month: "short" }),
            amount: s.amount
          })),
          maxAmount
        };
      }
      return null;
    })
    .filter(Boolean) as any[];

  // Calculate metrics
  const totalLoss = alerts.reduce((sum, a) => sum + a.loss, 0);
  const avgDecline = alerts.length > 0 
    ? Math.round(alerts.reduce((sum, a) => sum + a.dropPct, 0) / alerts.length) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Purchase Decline Alerts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Proactive account monitoring flagging drop-offs in customer order volume.
          </p>
        </div>
        <ExportExcelButton
          data={alerts.map((a) => ({
            "Customer Name": a.customer,
            "Product": a.product,
            "Drop %": `-${a.dropPct}%`,
            "Prior Monthly Avg (AED)": a.priorAvg,
            "Latest Month Amount (AED)": a.latest,
            "Estimated Loss (AED)": a.loss,
          }))}
          filename="Customer-Purchase-Decline-Alerts"
          sheetName="Decline Alerts"
          label="Export Alerts"
        />
      </div>

      {/* KPI Summary Block */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 border border-red-100 bg-white">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">At-Risk Accounts</p>
          <p className="text-2xl font-bold text-red-600 mt-1.5">{alerts.length}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Requires immediate attention</p>
        </div>
        <div className="card p-4 border border-amber-100 bg-white">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Avg. Drop %</p>
          <p className="text-2xl font-bold text-amber-600 mt-1.5">-{avgDecline}%</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Compared to 3mo avg</p>
        </div>
        <div className="card p-4 border border-gray-100 bg-white">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Est. Deficit / Mo</p>
          <p className="text-2xl font-bold text-gray-900 mt-1.5">AED {totalLoss.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Potential revenue loss</p>
        </div>
      </div>

      {/* Alert Feed */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="card p-8 text-center text-sm text-gray-400">
            No customer purchase declines detected. All accounts stable.
          </div>
        ) : (
          alerts.map((a, i) => {
            // Generate SVG line coordinates for sparkline
            const svgWidth = 140;
            const svgHeight = 44;
            const paddingX = 10;
            const paddingY = 6;
            
            const points = a.series.map((s: any, idx: number) => {
              const x = paddingX + (idx / (a.series.length - 1)) * (svgWidth - paddingX * 2);
              const y = svgHeight - paddingY - (s.amount / a.maxAmount) * (svgHeight - paddingY * 2);
              return `${x},${y}`;
            }).join(" ");

            return (
              <div key={i} className="card p-5 border border-gray-100 bg-white space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                      <h2 className="font-bold text-base text-gray-900 truncate">{a.customer}</h2>
                    </div>
                    <p className="text-sm text-gray-600">
                      Decline in <strong className="text-gray-900 font-semibold">{a.product}</strong>
                    </p>
                    <p className="text-xs text-gray-400">
                      Monthly average dropped from <span className="font-semibold text-gray-700">AED {a.priorAvg}</span> to <span className="font-semibold text-red-600">AED {a.latest}</span>
                    </p>
                  </div>

                  {/* Sparkline Visualizer */}
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className="badge bg-red-50 text-red-700 border border-red-100 font-bold">
                      -{a.dropPct}% Drop
                    </span>
                    <div className="bg-red-50/30 rounded-lg p-1 border border-red-100/50">
                      <svg width={svgWidth} height={svgHeight} className="overflow-visible">
                        {/* Glowing stroke shadow */}
                        <polyline
                          fill="none"
                          stroke="#f87171"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={points}
                          className="opacity-20"
                        />
                        {/* Main line */}
                        <polyline
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={points}
                        />
                        {/* Dot markers on nodes */}
                        {a.series.map((s: any, idx: number) => {
                          const x = paddingX + (idx / (a.series.length - 1)) * (svgWidth - paddingX * 2);
                          const y = svgHeight - paddingY - (s.amount / a.maxAmount) * (svgHeight - paddingY * 2);
                          return (
                            <circle
                              key={idx}
                              cx={x}
                              cy={y}
                              r="3.5"
                              fill={idx === a.series.length - 1 ? "#ef4444" : "#ffffff"}
                              stroke="#ef4444"
                              strokeWidth="1.5"
                            />
                          );
                        })}
                      </svg>
                      <div className="flex justify-between text-[9px] text-gray-400 px-2 mt-0.5">
                        <span>{a.series[0].month}</span>
                        <span>{a.series[a.series.length - 1].month}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Suggested Action Playbook Block */}
                <div className="bg-amber-50/50 rounded-xl p-3.5 border border-amber-100/60 space-y-2.5">
                  <p className="text-xs font-semibold text-amber-800 flex items-center gap-1">
                    <Sparkles size={13} /> Suggested Account Recovery Actions
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Link
                      href={`/rep/visit/${a.customerId}`}
                      className="flex items-center justify-between text-xs bg-white hover:bg-amber-50 text-gray-700 hover:text-amber-800 border border-gray-100 hover:border-amber-200 rounded-lg p-2.5 transition-all font-medium"
                    >
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-amber-600" />
                        Schedule Recovery Visit
                      </span>
                      <ArrowRight size={12} className="opacity-60" />
                    </Link>
                    <Link
                      href={`/rep/documents?customer=${a.customerId}`}
                      className="flex items-center justify-between text-xs bg-white hover:bg-amber-50 text-gray-700 hover:text-amber-800 border border-gray-100 hover:border-amber-200 rounded-lg p-2.5 transition-all font-medium"
                    >
                      <span className="flex items-center gap-1.5">
                        <MessageSquare size={13} className="text-amber-600" />
                        Send Promotional Offer
                      </span>
                      <ArrowRight size={12} className="opacity-60" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
