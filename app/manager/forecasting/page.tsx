"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  UserCheck,
  Building,
  AlertTriangle,
  XCircle,
  Tag,
  CheckCircle2,
  Download,
  Check,
  Sparkles,
  ShoppingBag,
  Send,
  PieChart,
} from "lucide-react";
import {
  SALES_REPS_DATA,
  SalesRepSummary,
  CustomerForecast,
} from "@/lib/data/productData";

export default function ManagerForecastingPage() {
  const [selectedRepId, setSelectedRepId] = useState<string>("all");
  const [repsData, setRepsData] = useState<SalesRepSummary[]>(SALES_REPS_DATA);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected Rep or Aggregate
  const selectedRep = repsData.find((r) => r.id === selectedRepId);

  // Customers list to show: if "all", show all customers across reps; else show selected rep's customers
  const customersToShow: CustomerForecast[] = selectedRep
    ? selectedRep.customers
    : repsData.flatMap((r) => r.customers);

  // Aggregate metrics
  const totalOrdersSoldAll = repsData.reduce((sum, r) => sum + r.totalOrdersSoldAED, 0);
  const total3MForecastAll = repsData.reduce((sum, r) => sum + r.projected3MForecastAED, 0);
  const totalAccountsAll = repsData.reduce((sum, r) => sum + r.customerCount, 0);

  const displayOrdersSold = selectedRep ? selectedRep.totalOrdersSoldAED : totalOrdersSoldAll;
  const display3MForecast = selectedRep ? selectedRep.projected3MForecastAED : total3MForecastAll;
  const displayAccountCount = selectedRep ? selectedRep.customerCount : totalAccountsAll;
  const displayQuotaPct = selectedRep
    ? selectedRep.quotaCompletionPct
    : Number(((totalOrdersSoldAll / (repsData.reduce((s, r) => s + r.quotaTargetAED, 0))) * 100).toFixed(1));

  // Handler for approving forecast allocations
  const handleApproveAllocations = () => {
    const repName = selectedRep ? selectedRep.name : "All Sales Reps";
    setSuccessMsg(`✅ Manager Approval Granted! 6-Month sales history & 3-Month supplier procurement forecasts for ${repName} synchronized to Sage X3 / Netstock pipeline.`);
    setTimeout(() => setSuccessMsg(null), 6000);
  };

  const handleExportReport = () => {
    const repName = selectedRep ? selectedRep.name : "Team_Overview";
    setSuccessMsg(`📥 Exported Sales Rep 6M History & 3M Forecast Report (${repName}_SageX3_Procurement.csv)`);
    setTimeout(() => setSuccessMsg(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="hero-gradient rounded-2xl p-6 text-white shadow-brand relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-blue-100 mb-2">
              <Sparkles size={13} className="text-yellow-300" /> Executive Management &amp; Trader Procurement Dashboard
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Sales Rep Performance, 6M Customer History &amp; Procurement Forecast</h1>
            <p className="text-blue-100 text-xs mt-1 max-w-2xl">
              Select any sales rep to audit their assigned trading customers, inspect 6-month historical purchase velocity (M-6 to M-1), and approve 3-month inventory procurement forecasts.
            </p>
          </div>
        </div>
      </div>

      {/* Alert Notification */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-medium p-3.5 rounded-xl flex items-center justify-between animate-in shadow-sm">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 font-bold text-sm">
            ✕
          </button>
        </div>
      )}

      {/* SALES REP SELECTION BAR */}
      <div className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 shrink-0">
            <UserCheck size={20} />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-400 block">Select Sales Representative</label>
            <h2 className="text-base font-bold text-gray-900">Field Team &amp; Trading Account Oversight</h2>
          </div>
        </div>

        {/* Rep Selector Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedRepId}
            onChange={(e) => setSelectedRepId(e.target.value)}
            className="input text-xs font-bold text-gray-900 py-2.5 px-3 bg-brand-50 border-brand-300 focus:border-brand-500 min-w-[260px]"
          >
            <option value="all">🌐 All Sales Reps (Territory Aggregate)</option>
            {repsData.map((rep) => (
              <option key={rep.id} value={rep.id}>
                👤 {rep.name} — {rep.territory}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* PERFORMANCE KPI CARDS FOR SELECTED REP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4 space-y-1 bg-white border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Total Orders Sold (YTD)</span>
            <ShoppingBag size={16} className="text-brand-600" />
          </div>
          <p className="text-xl font-extrabold text-gray-900">
            AED {displayOrdersSold.toLocaleString("en-AE")}
          </p>
          <p className="text-[10px] text-emerald-600 font-semibold">
            {selectedRep ? `Fulfilled by ${selectedRep.name}` : "Aggregate team fulfilled sales"}
          </p>
        </div>

        <div className="card p-4 space-y-1 bg-white border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase">3M Procurement Pipeline</span>
            <TrendingUp size={16} className="text-emerald-600" />
          </div>
          <p className="text-xl font-extrabold text-emerald-700">
            AED {display3MForecast.toLocaleString("en-AE")}
          </p>
          <p className="text-[10px] text-gray-400">M+1, M+2, M+3 Inventory Commit</p>
        </div>

        <div className="card p-4 space-y-1 bg-white border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Quota Target Completion</span>
            <PieChart size={16} className="text-violet-600" />
          </div>
          <p className="text-xl font-extrabold text-violet-700">{displayQuotaPct}%</p>
          <p className="text-[10px] text-gray-400">
            {selectedRep ? `Target: AED ${selectedRep.quotaTargetAED.toLocaleString()}` : "Team Target Average"}
          </p>
        </div>

        <div className="card p-4 space-y-1 bg-white border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Accounts Managed</span>
            <Building size={16} className="text-amber-600" />
          </div>
          <p className="text-xl font-extrabold text-gray-900">{displayAccountCount} Accounts</p>
          <p className="text-[10px] text-gray-400">Assigned customer portfolio</p>
        </div>
      </div>

      {/* PER-CUSTOMER 6-MONTH HISTORICAL & 3-MONTH PROCUREMENT MATRIX */}
      <div className="card p-5 space-y-4 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Building size={18} className="text-brand-600" />
              {selectedRep ? `${selectedRep.name}'s Customer Purchase & Procurement Forecast` : "All Sales Reps Customer Purchase & Procurement Forecast"}
            </h2>
            <p className="text-xs text-gray-400">6-Month Historical Purchase Breakdown (M-6 to M-1) &amp; 3-Month Inventory Procurement Projections</p>
          </div>
        </div>

        {/* Customer Tables */}
        <div className="space-y-6">
          {customersToShow.map((cust) => {
            const cust3MTotal = cust.items.reduce((sum, item) => {
              const u = item.m1ForecastUnits + item.m2ForecastUnits + item.m3ForecastUnits;
              return sum + u * item.unitPrice;
            }, 0);

            return (
              <div key={cust.customerId} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {/* Customer Sub-header */}
                <div className="bg-gray-50 p-3.5 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{cust.customerName}</span>
                      <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                        {cust.territory}
                      </span>
                      {cust.repName && (
                        <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          Sales Rep: {cust.repName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400 mr-2">3-Month Trader Commit:</span>
                    <span className="text-sm font-extrabold text-brand-700">AED {cust3MTotal.toLocaleString("en-AE")}</span>
                  </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Stock Status</th>
                        <th className="p-3 text-center bg-gray-100 text-gray-700">M-6</th>
                        <th className="p-3 text-center bg-gray-100 text-gray-700">M-5</th>
                        <th className="p-3 text-center bg-gray-100 text-gray-700">M-4</th>
                        <th className="p-3 text-center bg-gray-100 text-gray-700">M-3</th>
                        <th className="p-3 text-center bg-gray-100 text-gray-700">M-2</th>
                        <th className="p-3 text-center bg-gray-100 text-gray-700 font-extrabold">M-1</th>
                        <th className="p-3 text-center bg-blue-50 text-brand-800">Month +1</th>
                        <th className="p-3 text-center bg-blue-50 text-brand-800">Month +2</th>
                        <th className="p-3 text-center bg-blue-50 text-brand-800">Month +3</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Total 3M Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs bg-white">
                      {cust.items.map((item) => {
                        const h = item.historical6mUnits || [0, 0, 0, 0, 0, 0];
                        const totalUnits = item.m1ForecastUnits + item.m2ForecastUnits + item.m3ForecastUnits;
                        const totalValue = totalUnits * item.unitPrice;

                        return (
                          <tr key={item.productId} className="hover:bg-gray-50/80 transition-colors">
                            <td className="p-3 font-semibold text-gray-900">
                              <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded mr-1.5">
                                {item.brand}
                              </span>
                              {item.productName}
                            </td>

                            <td className="p-3">
                              {item.stockStatus === "near_expiry" && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                  <AlertTriangle size={10} /> Near Expiry
                                </span>
                              )}
                              {item.stockStatus === "out_of_stock" && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                                  <XCircle size={10} /> Out of Stock
                                </span>
                              )}
                              {item.stockStatus === "promo" && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                                  <Tag size={10} /> Promo Push
                                </span>
                              )}
                              {item.stockStatus === "active" && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 size={10} /> Active
                                </span>
                              )}
                            </td>

                            <td className="p-2 text-center text-gray-500 font-mono bg-gray-50/50">{h[0]}</td>
                            <td className="p-2 text-center text-gray-500 font-mono bg-gray-50/50">{h[1]}</td>
                            <td className="p-2 text-center text-gray-500 font-mono bg-gray-50/50">{h[2]}</td>
                            <td className="p-2 text-center text-gray-500 font-mono bg-gray-50/50">{h[3]}</td>
                            <td className="p-2 text-center text-gray-600 font-mono bg-gray-50/50">{h[4]}</td>
                            <td className="p-2 text-center text-gray-900 font-mono font-bold bg-gray-100">{h[5]}</td>

                            <td className="p-3 text-center font-bold bg-blue-50/20 text-gray-900">{item.m1ForecastUnits}</td>
                            <td className="p-3 text-center font-bold bg-blue-50/20 text-gray-900">{item.m2ForecastUnits}</td>
                            <td className="p-3 text-center font-bold bg-blue-50/20 text-gray-900">{item.m3ForecastUnits}</td>
                            <td className="p-3 text-right text-gray-600 font-mono">AED {item.unitPrice}</td>
                            <td className="p-3 text-right font-bold text-brand-700 font-mono">AED {totalValue.toLocaleString("en-AE")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
