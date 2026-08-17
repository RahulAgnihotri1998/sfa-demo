"use client";

import { useState, useEffect } from "react";
import { 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  TrendingDown, 
  Package, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  ChevronRight,
  Flame,
  ShieldAlert,
  ArrowUpRight
} from "lucide-react";
import { Customer360MockData, MockSageX3Service } from "@/lib/erp";

function formatAED(value: number) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function Customer360Panel({ 
  customerId, 
  customerName = "Customer" 
}: { 
  customerId: string; 
  customerName?: string;
}) {
  const [activeTab, setActiveTab] = useState<"ar" | "slow_moving" | "expiry" | "reorder">("ar");
  const [data, setData] = useState<Customer360MockData | null>(null);

  useEffect(() => {
    // Load deterministic mock data instantly
    const insights = MockSageX3Service.getCustomer360(customerId, customerName);
    setData(insights);
  }, [customerId, customerName]);

  if (!data) return null;

  const { ar_aging, slow_moving_stock, batch_expiry_alerts, frequent_products } = data;
  const isHighUtilization = ar_aging.credit_utilization_pct > 80;
  const hasOverdue = (ar_aging.aging.overdue_30 + ar_aging.aging.overdue_60 + ar_aging.aging.overdue_90_plus) > 0;

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/80 overflow-hidden">
      {/* Header with ERP Source Badge */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Customer 360 Insights</h2>
              <p className="text-[11px] text-slate-300">Sage X3 ERP Synced Analytics</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
            <CheckCircle2 size={11} /> Mock ERP Live
          </span>
        </div>

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10 text-center">
          <div className="bg-white/5 rounded-xl p-2">
            <p className="text-[10px] text-slate-300 uppercase font-medium">Outstanding</p>
            <p className="text-xs font-bold text-white mt-0.5">{formatAED(ar_aging.total_outstanding)}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-2">
            <p className="text-[10px] text-slate-300 uppercase font-medium">Credit Limit</p>
            <p className="text-xs font-bold text-white mt-0.5">{formatAED(ar_aging.credit_limit)}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-2">
            <p className="text-[10px] text-slate-300 uppercase font-medium">DSO (Days)</p>
            <p className="text-xs font-bold text-white mt-0.5">{ar_aging.dso_days} days</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 bg-gray-50/70 p-1 gap-1">
        <button
          onClick={() => setActiveTab("ar")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "ar"
              ? "bg-white text-indigo-700 shadow-sm ring-1 ring-gray-200"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          AR Aging
        </button>
        <button
          onClick={() => setActiveTab("slow_moving")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "slow_moving"
              ? "bg-white text-indigo-700 shadow-sm ring-1 ring-gray-200"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Slow Stock ({slow_moving_stock.length})
        </button>
        <button
          onClick={() => setActiveTab("expiry")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "expiry"
              ? "bg-white text-indigo-700 shadow-sm ring-1 ring-gray-200"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Lot Expiry ({batch_expiry_alerts.length})
        </button>
        <button
          onClick={() => setActiveTab("reorder")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "reorder"
              ? "bg-white text-indigo-700 shadow-sm ring-1 ring-gray-200"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Reorders
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4 space-y-3">
        {/* 1. AR Aging Tab */}
        {activeTab === "ar" && (
          <div className="space-y-4">
            {/* Credit Utilization Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-600 font-medium">Credit Limit Utilization</span>
                <span className={`font-bold ${isHighUtilization ? "text-red-600" : "text-gray-900"}`}>
                  {ar_aging.credit_utilization_pct}% utilized
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className={`h-full transition-all rounded-full ${
                    isHighUtilization ? "bg-red-500" : ar_aging.credit_utilization_pct > 60 ? "bg-amber-500" : "bg-indigo-600"
                  }`}
                  style={{ width: `${Math.min(100, ar_aging.credit_utilization_pct)}%` }}
                />
              </div>
            </div>

            {/* Overdue Aging Matrix */}
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Aging Breakdown</p>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2">
                  <p className="text-[10px] text-gray-500 font-medium">0 - 30d</p>
                  <p className="text-xs font-bold text-gray-800 mt-0.5">{formatAED(ar_aging.aging.current)}</p>
                </div>
                <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-2">
                  <p className="text-[10px] text-amber-700 font-medium">31 - 60d</p>
                  <p className="text-xs font-bold text-amber-900 mt-0.5">{formatAED(ar_aging.aging.overdue_30)}</p>
                </div>
                <div className="bg-orange-50/70 border border-orange-100 rounded-xl p-2">
                  <p className="text-[10px] text-orange-700 font-medium">61 - 90d</p>
                  <p className="text-xs font-bold text-orange-900 mt-0.5">{formatAED(ar_aging.aging.overdue_60)}</p>
                </div>
                <div className="bg-red-50/70 border border-red-100 rounded-xl p-2">
                  <p className="text-[10px] text-red-700 font-medium">90d+</p>
                  <p className="text-xs font-bold text-red-900 mt-0.5">{formatAED(ar_aging.aging.overdue_90_plus)}</p>
                </div>
              </div>
            </div>

            {/* Open Invoices */}
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Open Invoices ({ar_aging.open_invoices.length})</p>
              <div className="space-y-2">
                {ar_aging.open_invoices.map((inv) => (
                  <div key={inv.invoice_number} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText size={13} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-800">{inv.invoice_number}</span>
                        {inv.days_overdue > 0 ? (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700 rounded-md">
                            {inv.days_overdue}d overdue
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 rounded-md">
                            Due {inv.due_date}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">Billed {inv.invoice_date}</p>
                    </div>
                    <span className="text-xs font-bold text-gray-900">{formatAED(inv.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. Slow-Moving Stock Tab */}
        {activeTab === "slow_moving" && (
          <div className="space-y-3">
            <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2">
              <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Products previously purchased by this customer that have exceeded their historical reorder cycle by &gt;1.5x. Pitch restock during this visit.
              </p>
            </div>

            <div className="space-y-2.5">
              {slow_moving_stock.map((item) => (
                <div key={item.sku} className="p-3 rounded-xl border border-gray-200 bg-white hover:border-indigo-200 transition-all space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-gray-400">{item.sku}</span>
                      <h4 className="text-xs font-bold text-gray-900">{item.name}</h4>
                      <p className="text-[11px] text-gray-500">{item.category}</p>
                    </div>
                    {item.dormancy_status === "dormant" ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-700 border border-red-200">
                        🚨 Dormant ({item.days_since_last_order}d)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                        ⚠️ At Risk ({item.days_since_last_order}d)
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 text-center">
                    <div>
                      <p className="text-[10px] text-gray-400">Cadence</p>
                      <p className="text-xs font-semibold text-gray-700">{item.historical_order_cadence_days} days</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Est. Supply</p>
                      <p className="text-xs font-semibold text-amber-700">{item.estimated_days_of_supply} days left</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Base Price</p>
                      <p className="text-xs font-semibold text-gray-900">{formatAED(item.unit_price)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Batch / Expiry Alerts Tab */}
        {activeTab === "expiry" && (
          <div className="space-y-3">
            <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200/80 flex items-start gap-2">
              <Package size={15} className="text-indigo-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-indigo-900 leading-relaxed">
                Warehouse inventory expiring in &lt; 45 days. Use pre-approved special discounts to clear stock with this customer.
              </p>
            </div>

            <div className="space-y-2.5">
              {batch_expiry_alerts.map((lot) => (
                <div key={lot.lot_number} className="p-3 rounded-xl border border-gray-200 bg-white space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-gray-400">{lot.sku} · {lot.lot_number}</span>
                      <h4 className="text-xs font-bold text-gray-900">{lot.name}</h4>
                      <p className="text-[11px] text-gray-500">{lot.warehouse_location}</p>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                      ⏳ {lot.days_to_expiry}d left
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-600">
                      Avail: <strong className="text-gray-900">{lot.available_units} units</strong>
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Offer {lot.recommended_discount_pct}% Off
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Reorder Cadence Tab */}
        {activeTab === "reorder" && (
          <div className="space-y-2.5">
            <p className="text-[11px] text-gray-500 font-medium">Customer&apos;s Core Reorder Schedule:</p>
            {frequent_products.map((item) => (
              <div key={item.sku} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">{item.name}</h4>
                  <p className="text-[11px] text-gray-500">
                    Avg reorder every <strong className="text-indigo-600">{item.avg_reorder_interval_days} days</strong> · Typical qty: {item.avg_order_qty}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block">Last Ordered</span>
                  <span className="text-xs font-medium text-gray-700">{item.last_purchased}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
