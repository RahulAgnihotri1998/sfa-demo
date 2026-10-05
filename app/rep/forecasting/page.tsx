"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  AlertTriangle,
  XCircle,
  Tag,
  CheckCircle2,
  Download,
  Building,
  RefreshCw,
  ShoppingCart,
  Send,
  ArrowRight,
  Info,
  Calendar,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { CUSTOMER_FORECASTS, CustomerForecast } from "@/lib/data/productData";
import ExportExcelButton from "@/components/ExportExcelButton";

export default function RepForecastingPage() {
  const [forecasts, setForecasts] = useState<CustomerForecast[]>(CUSTOMER_FORECASTS);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("all");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter customers
  const displayedCustomers = selectedCustomerId === "all"
    ? forecasts
    : forecasts.filter((c) => c.customerId === selectedCustomerId);

  // Recalculate 3-Month & 6-Month totals dynamically
  const total6MUnits = displayedCustomers.reduce((sum, cust) => {
    return sum + cust.items.reduce((iSum, item) => {
      const units6M = (item.historical6mUnits || [0, 0, 0, 0, 0, 0]).reduce((a, b) => a + b, 0);
      return iSum + units6M;
    }, 0);
  }, 0);

  const total3MForecastAED = displayedCustomers.reduce((sum, cust) => {
    return sum + cust.items.reduce((iSum, item) => {
      const forecastUnits = item.m1ForecastUnits + item.m2ForecastUnits + item.m3ForecastUnits;
      return iSum + (forecastUnits * item.unitPrice);
    }, 0);
  }, 0);

  const handleUnitChange = (
    customerId: string,
    productId: string,
    field: "m1ForecastUnits" | "m2ForecastUnits" | "m3ForecastUnits",
    value: number
  ) => {
    setForecasts((prev) =>
      prev.map((c) => {
        if (c.customerId !== customerId) return c;
        return {
          ...c,
          items: c.items.map((item) => {
            if (item.productId !== productId) return item;
            return {
              ...item,
              [field]: Math.max(0, value),
            };
          }),
        };
      })
    );
  };

  const handleCreateTraderOrder = () => {
    setSuccessMsg("🛒 Internal Trader Reservation Order created! Forecast quantities submitted to Sage X3 ERP pipeline.");
    setTimeout(() => setSuccessMsg(null), 6000);
  };

  const handleSendToPurchasing = () => {
    setSuccessMsg("📦 Trader Procurement Forecast successfully submitted to Procurement Purchasing Team! Supplier purchase orders generated.");
    setTimeout(() => setSuccessMsg(null), 6000);
  };

  const handleExportSageCSV = () => {
    setSuccessMsg("📥 Exported 6-Month Purchase & 3-Month Procurement Forecast CSV (SageX3_Trader_Forecast.csv)");
    setTimeout(() => setSuccessMsg(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="hero-gradient rounded-2xl p-5 text-white shadow-brand relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-blue-100 mb-2">
              <TrendingUp size={13} className="text-yellow-300" /> Trading &amp; Inventory Procurement Forecast Engine
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Customer 6-Month Purchase &amp; 3-Month Trader Forecast</h1>
            <p className="text-blue-100 text-xs mt-1 max-w-2xl">
              Track 6-month historical buying trends (M-6 to M-1) across all assigned customers. Enable sales reps and traders to submit accurate procurement forecasts so the inventory team knows what stock to buy from suppliers.
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

      {/* KPI Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4 space-y-1 bg-white border border-gray-100">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Assigned Accounts</span>
          <p className="text-xl font-extrabold text-gray-900">{displayedCustomers.length} Customers</p>
          <p className="text-[10px] text-gray-400">Trading client portfolio</p>
        </div>

        <div className="card p-4 space-y-1 bg-white border border-gray-100">
          <span className="text-[10px] font-bold text-gray-400 uppercase">6-Month Historical Volume</span>
          <p className="text-xl font-extrabold text-gray-900">{total6MUnits.toLocaleString()} Units</p>
          <p className="text-[10px] text-emerald-600 font-semibold">M-6 to M-1 actual fulfilled sales</p>
        </div>

        <div className="card p-4 space-y-1 bg-white border border-gray-100">
          <span className="text-[10px] font-bold text-gray-400 uppercase">3-Month Trader Commit</span>
          <p className="text-xl font-extrabold text-brand-700">AED {total3MForecastAED.toLocaleString("en-AE")}</p>
          <p className="text-[10px] text-gray-400">M+1, M+2, M+3 projected orders</p>
        </div>

        <div className="card p-4 space-y-1 bg-white border border-gray-100">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Supplier Order Status</span>
          <p className="text-base font-bold text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 size={16} /> Procurement Ready
          </p>
          <p className="text-[10px] text-gray-400">Syncs with Sage X3 / Netstock</p>
        </div>
      </div>

      {/* CUSTOMER SELECTION BAR */}
      <div className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 shrink-0">
            <Building size={20} />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-400 block">Trading Client Filter</label>
            <h2 className="text-base font-bold text-gray-900">Customer Purchase &amp; Procurement Forecast</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="input text-xs font-bold text-gray-900 py-2.5 px-3 bg-brand-50 border-brand-300 focus:border-brand-500 min-w-[240px]"
          >
            <option value="all">🌐 All Assigned Customers ({forecasts.length})</option>
            {forecasts.map((c) => (
              <option key={c.customerId} value={c.customerId}>
                🏢 {c.customerName} ({c.territory})
              </option>
            ))}
          </select>

          <ExportExcelButton
            data={displayedCustomers.flatMap((c) =>
              c.items.map((item) => {
                const h = item.historical6mUnits || [0, 0, 0, 0, 0, 0];
                const total3MUnits = item.m1ForecastUnits + item.m2ForecastUnits + item.m3ForecastUnits;
                return {
                  "Customer Name": c.customerName,
                  "Territory": c.territory,
                  "Sales Rep": c.repName || "—",
                  "Brand": item.brand,
                  "Product Name": item.productName,
                  "Status": item.stockStatus,
                  "M-6 (Units)": h[0],
                  "M-5 (Units)": h[1],
                  "M-4 (Units)": h[2],
                  "M-3 (Units)": h[3],
                  "M-2 (Units)": h[4],
                  "M-1 (Units)": h[5],
                  "Month +1 Proj (Units)": item.m1ForecastUnits,
                  "Month +2 Proj (Units)": item.m2ForecastUnits,
                  "Month +3 Proj (Units)": item.m3ForecastUnits,
                  "Total 3M Proj Units": total3MUnits,
                  "Unit Price (AED)": item.unitPrice,
                  "Total 3M Value (AED)": total3MUnits * item.unitPrice,
                };
              })
            )}
            filename="Customer-Purchase-Forecast-Matrix"
            sheetName="Forecast Matrix"
            label="Export All Forecasts"
          />
        </div>
      </div>

      {/* PER-CUSTOMER 6-MONTH HISTORY & 3-MONTH PROCUREMENT FORECAST TABLE */}
      <div className="space-y-6">
        {displayedCustomers.map((cust) => {
          const cust3MTotal = cust.items.reduce((sum, item) => {
            const u = item.m1ForecastUnits + item.m2ForecastUnits + item.m3ForecastUnits;
            return sum + u * item.unitPrice;
          }, 0);

          return (
            <div key={cust.customerId} className="card p-5 space-y-4 bg-white border border-gray-200">
              {/* Customer Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900">{cust.customerName}</h3>
                    <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {cust.territory}
                    </span>
                    {cust.repName && (
                      <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        Sales Rep: {cust.repName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    6-Month Historical Purchase Record &amp; 3-Month Procurement Demand Projection
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-gray-400 mr-2">3-Month Trader Commitment:</span>
                    <span className="text-base font-extrabold text-brand-700">AED {cust3MTotal.toLocaleString("en-AE")}</span>
                  </div>
                  <ExportExcelButton
                    data={cust.items.map((item) => {
                      const h = item.historical6mUnits || [0, 0, 0, 0, 0, 0];
                      const total3MUnits = item.m1ForecastUnits + item.m2ForecastUnits + item.m3ForecastUnits;
                      return {
                        "Customer": cust.customerName,
                        "Brand": item.brand,
                        "Product Name": item.productName,
                        "Stock Status": item.stockStatus,
                        "M-6 Units": h[0],
                        "M-5 Units": h[1],
                        "M-4 Units": h[2],
                        "M-3 Units": h[3],
                        "M-2 Units": h[4],
                        "M-1 Units": h[5],
                        "Month +1 Proj": item.m1ForecastUnits,
                        "Month +2 Proj": item.m2ForecastUnits,
                        "Month +3 Proj": item.m3ForecastUnits,
                        "Total 3M Units": total3MUnits,
                        "Unit Price (AED)": item.unitPrice,
                        "Total 3M Value (AED)": total3MUnits * item.unitPrice,
                      };
                    })}
                    filename={`${cust.customerName.replace(/[^a-zA-Z0-9_-]/g, "_")}-Demand-Forecast`}
                    sheetName="Demand Forecast"
                  />
                </div>
              </div>

              {/* Free-of-Charge Sample Feedback Tracking */}
              {cust.focSamples && cust.focSamples.length > 0 && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900">
                    <Sparkles size={14} className="text-amber-600" />
                    <span className="text-xs font-bold uppercase tracking-wide">
                      🎁 Free-of-Charge (FOC) Trial Sample Tracker
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {cust.focSamples.map((sample) => (
                      <div key={sample.id} className="bg-white p-2.5 rounded-lg border border-amber-200/80 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">{sample.productName}</span>
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                            {sample.status === "pending_feedback" ? "Pending Chef Feedback" : "Trial Approved"}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500">{sample.chefNotes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-center bg-gray-100 text-gray-700">M-6</th>
                      <th className="p-3 text-center bg-gray-100 text-gray-700">M-5</th>
                      <th className="p-3 text-center bg-gray-100 text-gray-700">M-4</th>
                      <th className="p-3 text-center bg-gray-100 text-gray-700">M-3</th>
                      <th className="p-3 text-center bg-gray-100 text-gray-700">M-2</th>
                      <th className="p-3 text-center bg-gray-100 text-gray-700 font-extrabold">M-1</th>
                      <th className="p-3 text-center bg-blue-50 text-brand-800">Month +1 (Proj)</th>
                      <th className="p-3 text-center bg-blue-50 text-brand-800">Month +2 (Proj)</th>
                      <th className="p-3 text-center bg-blue-50 text-brand-800">Month +3 (Proj)</th>
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

                          {/* 6-Month Historical Purchase Breakdown */}
                          <td className="p-2 text-center text-gray-500 font-mono bg-gray-50/50">{h[0]}</td>
                          <td className="p-2 text-center text-gray-500 font-mono bg-gray-50/50">{h[1]}</td>
                          <td className="p-2 text-center text-gray-500 font-mono bg-gray-50/50">{h[2]}</td>
                          <td className="p-2 text-center text-gray-500 font-mono bg-gray-50/50">{h[3]}</td>
                          <td className="p-2 text-center text-gray-600 font-mono bg-gray-50/50">{h[4]}</td>
                          <td className="p-2 text-center text-gray-900 font-mono font-bold bg-gray-100">{h[5]}</td>

                          {/* 3-Month Interactive Procurement Forecast */}
                          <td className="p-2 text-center bg-blue-50/30">
                            <input
                              type="number"
                              min="0"
                              value={item.m1ForecastUnits}
                              onChange={(e) =>
                                handleUnitChange(cust.customerId, item.productId, "m1ForecastUnits", parseInt(e.target.value) || 0)
                              }
                              className="w-16 text-center input text-xs font-bold py-1 px-1 bg-white border-blue-200 text-brand-700"
                            />
                          </td>

                          <td className="p-2 text-center bg-blue-50/30">
                            <input
                              type="number"
                              min="0"
                              value={item.m2ForecastUnits}
                              onChange={(e) =>
                                handleUnitChange(cust.customerId, item.productId, "m2ForecastUnits", parseInt(e.target.value) || 0)
                              }
                              className="w-16 text-center input text-xs font-bold py-1 px-1 bg-white border-blue-200 text-brand-700"
                            />
                          </td>

                          <td className="p-2 text-center bg-blue-50/30">
                            <input
                              type="number"
                              min="0"
                              value={item.m3ForecastUnits}
                              onChange={(e) =>
                                handleUnitChange(cust.customerId, item.productId, "m3ForecastUnits", parseInt(e.target.value) || 0)
                              }
                              className="w-16 text-center input text-xs font-bold py-1 px-1 bg-white border-blue-200 text-brand-700"
                            />
                          </td>

                          <td className="p-3 text-right text-gray-600 font-mono">AED {item.unitPrice}</td>
                          <td className="p-3 text-right font-bold text-brand-700 font-mono">AED {totalValue.toLocaleString("en-AE")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 text-xs">
                <p className="text-gray-500">
                  💡 <em>6-Month buying velocity is used by traders to generate accurate inventory purchasing requests from suppliers.</em>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCreateTraderOrder}
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <ShoppingCart size={13} /> Reserve Trader Order (Sage X3)
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
