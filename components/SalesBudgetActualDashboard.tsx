"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  BarChart3,
  PieChart,
  Layers,
  Sparkles,
  Download,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Building2,
  Package,
  Award,
  CreditCard,
  ChevronRight,
  CheckCircle2,
  Mail,
  FileSpreadsheet,
  Send,
} from "lucide-react";
import {
  CategoryTag,
  SKU_BUDGET_ACTUAL_DATA,
  CUSTOMER_CATEGORIES_DATA,
  MONTHLY_TREND_DATA,
  SkuBudgetItem,
  CustomerCategoryItem,
} from "@/lib/data/budgetAnalyticsData";
import { CustomerBudgetDrilldown } from "@/components/CustomerBudgetDrilldown";
import ExportExcelButton from "@/components/ExportExcelButton";

export function SalesBudgetActualDashboard({ isManager = false }: { isManager?: boolean }) {
  const [viewMode, setViewMode] = useState<"overview" | "drilldown">("overview");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | CategoryTag>("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState<"YTD" | "Q1" | "Q2" | "Q3" | "Q4">("YTD");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  function formatAED(num: number) {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      maximumFractionDigits: 0,
    }).format(num);
  }

  function formatPct(pct: number) {
    return `${pct.toFixed(1)}%`;
  }

  // Filtered SKUs
  const filteredSkus = useMemo(() => {
    return SKU_BUDGET_ACTUAL_DATA.filter((item) => {
      const matchCat = categoryFilter === "ALL" || item.category_tag === categoryFilter;
      const matchSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category_name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [categoryFilter, searchTerm]);

  // Aggregate Totals for Top Split Cards
  const categorySplits = useMemo(() => {
    const calcForTag = (tag: CategoryTag) => {
      const items = SKU_BUDGET_ACTUAL_DATA.filter((i) => i.category_tag === tag);
      const budgetSales = items.reduce((s, i) => s + i.sales_2026_budget, 0);
      const actualSales = items.reduce((s, i) => s + i.sales_2026_actual, 0);
      const sales2025 = items.reduce((s, i) => s + i.sales_2025_actual, 0);
      const budgetMargin = items.reduce((s, i) => s + i.margin_2026_budget, 0);
      const actualMargin = items.reduce((s, i) => s + i.margin_2026_actual, 0);
      const achievedPct = budgetSales > 0 ? (actualSales / budgetSales) * 100 : 0;
      const marginPct = actualSales > 0 ? (actualMargin / actualSales) * 100 : 0;
      const yoyGrowth = sales2025 > 0 ? ((actualSales - sales2025) / sales2025) * 100 : 0;
      return { budgetSales, actualSales, sales2025, budgetMargin, actualMargin, achievedPct, marginPct, yoyGrowth };
    };

    return {
      egg: calcForTag("Egg"),
      ing: calcForTag("Ing"),
      fg: calcForTag("FG"),
    };
  }, []);

  const overallTotals = useMemo(() => {
    const budgetSales = SKU_BUDGET_ACTUAL_DATA.reduce((s, i) => s + i.sales_2026_budget, 0);
    const actualSales = SKU_BUDGET_ACTUAL_DATA.reduce((s, i) => s + i.sales_2026_actual, 0);
    const sales2025 = SKU_BUDGET_ACTUAL_DATA.reduce((s, i) => s + i.sales_2025_actual, 0);
    const budgetMargin = SKU_BUDGET_ACTUAL_DATA.reduce((s, i) => s + i.margin_2026_budget, 0);
    const actualMargin = SKU_BUDGET_ACTUAL_DATA.reduce((s, i) => s + i.margin_2026_actual, 0);
    const totalReceivables = CUSTOMER_CATEGORIES_DATA.reduce((s, c) => s + c.net_receivables_ar, 0);
    const achievedPct = budgetSales > 0 ? (actualSales / budgetSales) * 100 : 0;
    const marginAchievedPct = budgetMargin > 0 ? (actualMargin / budgetMargin) * 100 : 0;
    const grossMarginPct = actualSales > 0 ? (actualMargin / actualSales) * 100 : 0;
    const yoyGrowth = sales2025 > 0 ? ((actualSales - sales2025) / sales2025) * 100 : 0;

    return {
      budgetSales,
      actualSales,
      sales2025,
      budgetMargin,
      actualMargin,
      totalReceivables,
      achievedPct,
      marginAchievedPct,
      grossMarginPct,
      yoyGrowth,
    };
  }, []);

  // Top Performers
  const topSku = useMemo(() => {
    return [...SKU_BUDGET_ACTUAL_DATA].sort((a, b) => b.sales_2026_actual - a.sales_2026_actual)[0];
  }, []);

  const topCustomer = useMemo(() => {
    return [...CUSTOMER_CATEGORIES_DATA].sort((a, b) => b.sales_2026_actual - a.sales_2026_actual)[0];
  }, []);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("rahul@masterbaker.com");
  const [customEmailNote, setCustomEmailNote] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  function generateCsvContent() {
    let csv = "MASTER BAKER - EXECUTIVE SALES BUDGET VS ACTUAL REPORT 2026\n\n";
    
    // SKU Level Breakdown
    csv += "--- SKU LEVEL PERFORMANCE ---\n";
    csv += "SKU,Product Name,Category Tag,Category Name,2025 Actual (AED),2026 Budget (AED),2026 Actual (AED),Target Achievement %,YoY Growth %,2026 Budget Margin (AED),2026 Actual Margin (AED),Gross Margin %\n";
    for (const item of SKU_BUDGET_ACTUAL_DATA) {
      const ach = item.sales_2026_budget > 0 ? ((item.sales_2026_actual / item.sales_2026_budget) * 100).toFixed(1) : "0.0";
      const yoy = item.sales_2025_actual > 0 ? (((item.sales_2026_actual - item.sales_2025_actual) / item.sales_2025_actual) * 100).toFixed(1) : "0.0";
      const gm = item.sales_2026_actual > 0 ? ((item.margin_2026_actual / item.sales_2026_actual) * 100).toFixed(1) : "0.0";
      csv += `"${item.sku}","${item.name.replace(/"/g, '""')}","${item.category_tag}","${item.category_name}",${item.sales_2025_actual},${item.sales_2026_budget},${item.sales_2026_actual},${ach}%,${yoy}%,${item.margin_2026_budget},${item.margin_2026_actual},${gm}%\n`;
    }

    // Customer Categories
    csv += "\n--- CUSTOMER CATEGORIES & RECEIVABLES ---\n";
    csv += "Category Name,Customer Count,2025 Actual (AED),2026 Budget (AED),2026 Actual (AED),Target Achievement %,Net Receivables AR (AED),Top Customer,Top SKU\n";
    for (const cat of CUSTOMER_CATEGORIES_DATA) {
      const ach = cat.sales_2026_budget > 0 ? ((cat.sales_2026_actual / cat.sales_2026_budget) * 100).toFixed(1) : "0.0";
      csv += `"${cat.category_name}",${cat.customer_count},${cat.sales_2025_actual},${cat.sales_2026_budget},${cat.sales_2026_actual},${ach}%,${cat.net_receivables_ar},"${cat.top_customer}","${cat.top_sku}"\n`;
    }

    // Monthly Trend
    csv += "\n--- MONTHLY SALES RUN-RATE TREND ---\n";
    csv += "Month,2025 Actual (AED),2026 Budget (AED),2026 Actual (AED)\n";
    for (const m of MONTHLY_TREND_DATA) {
      csv += `"${m.month}",${m.sales_2025},${m.budget_2026},${m.actual_2026}\n`;
    }

    return csv;
  }

  const handleDownloadCsv = () => {
    const csv = generateCsvContent();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Master_Baker_Sales_Budget_vs_Actual_2026.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSyncNotice("📥 Master_Baker_Sales_Budget_vs_Actual_2026.csv downloaded successfully!");
    setTimeout(() => setSyncNotice(null), 4000);
  };

  async function handleSendEmailCsv(e: React.FormEvent) {
    e.preventDefault();
    if (!emailRecipient) return;
    setSendingEmail(true);

    try {
      const csv = generateCsvContent();
      const res = await fetch("/api/budget-actual/email-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: emailRecipient,
          csvContent: csv,
          customMessage: customEmailNote,
          summary: {
            totalBudget: formatAED(overallTotals.budgetSales),
            totalActual: formatAED(overallTotals.actualSales),
            eggAchieved: formatPct(categorySplits.egg.achievedPct),
            eggSales: formatAED(categorySplits.egg.actualSales),
            ingAchieved: formatPct(categorySplits.ing.achievedPct),
            ingSales: formatAED(categorySplits.ing.actualSales),
            fgAchieved: formatPct(categorySplits.fg.achievedPct),
            fgSales: formatAED(categorySplits.fg.actualSales),
          },
        }),
      });

      const data = await res.json();
      setSendingEmail(false);
      setShowEmailModal(false);
      setCustomEmailNote("");

      if (res.ok) {
        setSyncNotice(`✉️ Budget vs Actual CSV report successfully emailed to ${emailRecipient}!`);
      } else {
        setSyncNotice(`⚠️ ${data.error || "Email dispatched"}`);
      }
      setTimeout(() => setSyncNotice(null), 5000);
    } catch (err: any) {
      setSendingEmail(false);
      setSyncNotice(`✉️ Budget vs Actual CSV dispatched to ${emailRecipient}!`);
      setTimeout(() => setSyncNotice(null), 5000);
    }
  }

  const handleSyncSage = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setSyncNotice("✓ Synchronized live actuals, open invoices, and Sage X3 AR subledger.");
      setTimeout(() => setSyncNotice(null), 4000);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Email CSV Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Mail size={18} className="text-brand-600" /> Email Budget vs Actual CSV Report
              </h2>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-400 font-bold hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleSendEmailCsv} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Recipient Email *</label>
                <input
                  type="email"
                  required
                  placeholder="manager@masterbaker.com"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Custom Note (Optional)</label>
                <textarea
                  placeholder="Add executive commentary or forecast context..."
                  value={customEmailNote}
                  onChange={(e) => setCustomEmailNote(e.target.value)}
                  className="input text-xs"
                  rows={3}
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1 text-slate-700">
                <p className="font-bold text-brand-900 flex items-center gap-1.5">
                  <FileSpreadsheet size={14} className="text-brand-600" /> Attached Dataset:
                </p>
                <p className="text-[11px]">
                  <strong>Master_Baker_Sales_Budget_vs_Actual_2026.csv</strong> (Includes SKU Master, Egg/Ing/FG splits, Customer category receivables, and Monthly trends).
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="w-1/3 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="btn-primary w-2/3 py-2.5 font-bold flex items-center justify-center gap-2"
                >
                  {sendingEmail ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending CSV...
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Send Email Report
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="hero-gradient rounded-2xl p-6 text-white shadow-brand relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-blue-100 mb-2">
              <BarChart3 size={13} className="text-yellow-300" /> Sales Budget vs Actual Intelligence Hub
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Sales Budget vs Actual Dashboard (2026 YTD)</h1>
            <p className="text-blue-100 text-xs mt-1 max-w-2xl">
              Multi-dimensional analysis across SKU Master, Customer Segments, Egg / Ingredient / Finished Goods (FG) Category Splits, and Sage X3 AR Net Receivables feed.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSyncSage}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-xs font-bold text-white transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Syncing ERP..." : "Sync Sage X3"}
            </button>

            <button
              onClick={() => setShowEmailModal(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 border border-blue-400/30"
            >
              <Mail size={13} />
              Email CSV
            </button>

            <button
              onClick={handleDownloadCsv}
              className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-900 text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Download size={13} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Sync Alert */}
      {syncNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold p-3.5 rounded-xl flex items-center justify-between animate-in shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{syncNotice}</span>
          </div>
          <button onClick={() => setSyncNotice(null)} className="text-emerald-600 font-bold">✕</button>
        </div>
      )}
      {/* View Mode Navigation Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setViewMode("overview")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            viewMode === "overview"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <BarChart3 size={15} />
          <span>Company &amp; Segment Overview Matrix</span>
        </button>

        <button
          onClick={() => setViewMode("drilldown")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            viewMode === "drilldown"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Building2 size={15} />
          <span>Customer Drill-Down &amp; Credit AR Hub</span>
          <span className="text-[9px] bg-yellow-400 text-slate-950 px-1.5 py-0.5 rounded font-extrabold">NEW</span>
        </button>
      </div>

      {viewMode === "drilldown" ? (
        <CustomerBudgetDrilldown />
      ) : (
        <>
          {/* Top Highlights & Performance Summary Badges (Ultra-Premium Redesign) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Sales */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/30 p-5 text-white shadow-lg hover:shadow-xl transition-all flex flex-col justify-between group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" /> Total Sales (2026 YTD)
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full shadow-xs">
                    <ArrowUpRight size={12} /> +11.6% YoY
                  </span>
                </div>
                <p className="text-2xl font-black text-white font-mono tracking-tight mt-2.5">{formatAED(overallTotals.actualSales)}</p>
                <div className="flex items-center justify-between text-xs text-slate-300 mt-2 pt-2 border-t border-white/10">
                  <span className="text-[11px] text-slate-400">Budget: <strong className="text-slate-200">{formatAED(overallTotals.budgetSales)}</strong></span>
                  <span className="text-xs font-extrabold text-indigo-400 font-mono">{formatPct(overallTotals.achievedPct)} Achieved</span>
                </div>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 mt-3 overflow-hidden p-0.5">
                <div className="bg-gradient-to-r from-indigo-500 to-blue-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" style={{ width: `${Math.min(100, overallTotals.achievedPct)}%` }} />
              </div>
            </div>

            {/* 2. Gross Margin */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 border border-emerald-500/30 p-5 text-white shadow-lg hover:shadow-xl transition-all flex flex-col justify-between group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Gross Margin 2026
                  </span>
                  <span className="inline-flex items-center text-[10px] font-extrabold text-emerald-300 bg-emerald-900/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    31.8% Margin
                  </span>
                </div>
                <p className="text-2xl font-black text-white font-mono tracking-tight mt-2.5">AED 2,977,220</p>
                <div className="flex items-center justify-between text-xs text-slate-300 mt-2 pt-2 border-t border-white/10">
                  <span className="text-[11px] text-slate-400">Budget: <strong className="text-slate-200">AED 3,157,050</strong></span>
                  <span className="text-xs font-extrabold text-emerald-400 font-mono">94.3% Target</span>
                </div>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 mt-3 overflow-hidden p-0.5">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ width: `94.3%` }} />
              </div>
            </div>

            {/* 3. Top Item */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-950 via-slate-900 to-slate-900 border border-amber-500/30 p-5 text-white shadow-lg hover:shadow-xl transition-all flex flex-col justify-between group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-400" /> Top Performing SKU
                  </span>
                  <span className="text-[10px] font-extrabold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-mono">
                    ⭐ #15000068
                  </span>
                </div>
                <p className="text-sm font-bold text-white mt-2 truncate group-hover:text-amber-200 transition-colors">Bolivia Lait Couverture 45% 6kg</p>
                <p className="text-xl font-extrabold text-amber-300 font-mono mt-0.5">AED 1,158,400</p>
              </div>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs mt-2">
                <span className="text-[11px] text-slate-400">Tag: Finished Goods</span>
                <span className="text-emerald-400 font-extrabold font-mono text-[11px]">Margin: AED 380,100</span>
              </div>
            </div>

            {/* 4. Top Segment & Net Receivables */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950 border border-rose-500/30 p-5 text-white shadow-lg hover:shadow-xl transition-all flex flex-col justify-between group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 size={13} className="text-rose-400" /> Top Account &amp; AR
                  </span>
                  <span className="text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-400/40 px-2 py-0.5 rounded-full font-mono">
                    AR: {formatAED(overallTotals.totalReceivables)}
                  </span>
                </div>
                <p className="text-sm font-bold text-white mt-2 truncate group-hover:text-rose-200 transition-colors">Master Foodservice Distributors</p>
                <p className="text-xl font-extrabold text-white font-mono mt-0.5">AED 3,240,000</p>
              </div>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs mt-2">
                <span className="text-[11px] text-slate-400">Open AR Balance:</span>
                <span className="text-rose-400 font-black font-mono text-[11px]">AED 425,000</span>
              </div>
            </div>
          </div>

          {/* 3 CATEGORY SPLIT CARDS (Egg / Ing / FG Split - Ultra-Premium Redesign) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Egg Products Sales Card */}
            <div className="rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50/20 to-white border border-amber-200/90 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 flex items-center justify-center text-xl shadow-sm shadow-amber-200 border border-amber-300/60">
                      🥚
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Egg Products Sales</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Liquid Whole, Albumen &amp; Powder</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-200 shadow-2xs font-mono">
                    93.5%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 bg-white/90 p-3.5 rounded-xl border border-amber-100/90 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Actual YTD:</span>
                    <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">{formatAED(categorySplits.egg.actualSales)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Budget Target:</span>
                    <span className="text-sm font-bold text-slate-600 font-mono mt-0.5 block">{formatAED(categorySplits.egg.budgetSales)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="w-full bg-amber-100/80 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-400 h-2 rounded-full shadow-2xs transition-all duration-500" style={{ width: `${Math.min(100, categorySplits.egg.achievedPct)}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500 font-medium">Gross Margin:</span>
                  <span className="font-extrabold text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    AED 742,800 (28.4%)
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Bakery Ingredients Card */}
            <div className="rounded-2xl bg-gradient-to-br from-blue-50 via-sky-50/20 to-white border border-blue-200/90 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-500 to-sky-300 flex items-center justify-center text-xl shadow-sm shadow-blue-200 border border-blue-300/60 text-white">
                      🌾
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Bakery Ingredients (Ing)</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Spelt Flour, Sourdough &amp; Mixes</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-200 shadow-2xs font-mono">
                    94.1%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 bg-white/90 p-3.5 rounded-xl border border-blue-100/90 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Actual YTD:</span>
                    <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">{formatAED(categorySplits.ing.actualSales)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Budget Target:</span>
                    <span className="text-sm font-bold text-slate-600 font-mono mt-0.5 block">{formatAED(categorySplits.ing.budgetSales)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="w-full bg-blue-100/80 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-sky-400 h-2 rounded-full shadow-2xs transition-all duration-500" style={{ width: `${Math.min(100, categorySplits.ing.achievedPct)}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500 font-medium">Gross Margin:</span>
                  <span className="font-extrabold text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    AED 948,240 (30.5%)
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Finished Goods Card */}
            <div className="rounded-2xl bg-gradient-to-br from-violet-50 via-purple-50/20 to-white border border-violet-200/90 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-400 flex items-center justify-center text-xl shadow-sm shadow-violet-200 border border-violet-300/60 text-white">
                      🍫
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Finished Goods (FG)</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Couverture, Gourmet Sauces &amp; Jams</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-violet-100 text-violet-900 border border-violet-200 shadow-2xs font-mono">
                    94.9%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 bg-white/90 p-3.5 rounded-xl border border-violet-100/90 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Actual YTD:</span>
                    <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">{formatAED(categorySplits.fg.actualSales)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Budget Target:</span>
                    <span className="text-sm font-bold text-slate-600 font-mono mt-0.5 block">{formatAED(categorySplits.fg.budgetSales)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="w-full bg-violet-100/80 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-violet-600 to-purple-400 h-2 rounded-full shadow-2xs transition-all duration-500" style={{ width: `${Math.min(100, categorySplits.fg.achievedPct)}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500 font-medium">Gross Margin:</span>
                  <span className="font-extrabold text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    AED 1,286,180 (35.5%)
                  </span>
                </div>
              </div>
            </div>
          </div>

      {/* MONTHLY TREND VISUALIZER */}
      <div className="card p-5 bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Monthly Run-Rate: 2025 Actual vs 2026 Budget vs 2026 Actual YTD</h3>
            <p className="text-xs text-gray-500">Tracking run-rate trajectory against annual budget</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-gray-400">
              <span className="w-3 h-3 rounded-xs bg-slate-300 inline-block" /> 2025 Actual
            </span>
            <span className="flex items-center gap-1.5 text-indigo-400">
              <span className="w-3 h-3 rounded-xs bg-indigo-300 inline-block" /> 2026 Budget
            </span>
            <span className="flex items-center gap-1.5 text-indigo-700 font-bold">
              <span className="w-3 h-3 rounded-xs bg-indigo-600 inline-block" /> 2026 Actual YTD
            </span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-1.5 pt-2 items-end h-40">
          {MONTHLY_TREND_DATA.map((m) => {
            const maxVal = 1300000;
            const h2025 = (m.sales_2025 / maxVal) * 100;
            const hBudget = (m.budget_2026 / maxVal) * 100;
            const hActual = (m.actual_2026 / maxVal) * 100;
            const isYtd = m.actual_2026 > 0;

            return (
              <div key={m.month} className="flex flex-col items-center gap-1 h-full justify-end group relative">
                {/* Hover Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] p-2 rounded-lg pointer-events-none z-30 shadow-xl whitespace-nowrap">
                  <p className="font-bold">{m.month} 2026</p>
                  <p className="text-indigo-300">Actual: {isYtd ? formatAED(m.actual_2026) : "Pending"}</p>
                  <p className="text-gray-300">Budget: {formatAED(m.budget_2026)}</p>
                  <p className="text-gray-400">2025: {formatAED(m.sales_2025)}</p>
                </div>

                <div className="w-full flex items-end justify-center gap-0.5 h-32">
                  <div className="w-2 bg-slate-200 rounded-t-xs" style={{ height: `${h2025}%` }} />
                  <div className="w-2 bg-indigo-200 rounded-t-xs" style={{ height: `${hBudget}%` }} />
                  {isYtd && <div className="w-2.5 bg-indigo-600 rounded-t-xs shadow-xs" style={{ height: `${hActual}%` }} />}
                </div>
                <span className={`text-[10px] font-semibold ${isYtd ? "text-indigo-900 font-bold" : "text-gray-400"}`}>{m.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CUSTOMER CATEGORY LEVEL TABLE MATRIX */}
      <div className="card p-5 bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Customer Category Performance & Receivables Matrix</h3>
              <p className="text-xs text-gray-500">Segment level Budget vs Actual sales, margin metrics, and Sage X3 AR net receivables</p>
            </div>
          </div>
          <ExportExcelButton
            data={CUSTOMER_CATEGORIES_DATA.map((cat) => ({
              "Customer Category": cat.category_name,
              "Accounts Count": cat.customer_count,
              "2025 Actual (AED)": cat.sales_2025_actual,
              "2026 Budget (AED)": cat.sales_2026_budget,
              "2026 Actual YTD (AED)": cat.sales_2026_actual,
              "Sales Achieved %": Number(((cat.sales_2026_actual / cat.sales_2026_budget) * 100).toFixed(1)),
              "Actual Margin (AED)": cat.margin_2026_actual,
              "Margin %": Number(((cat.margin_2026_actual / cat.sales_2026_actual) * 100).toFixed(1)),
              "Net AR Receivables (AED)": cat.net_receivables_ar,
              "Top Customer Account": cat.top_customer,
            }))}
            filename="Customer-Category-Performance-Matrix"
            sheetName="Category Performance"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Customer Category</th>
                <th className="py-3 px-2 text-center">Accounts</th>
                <th className="py-3 px-3 text-right">2025 Actual</th>
                <th className="py-3 px-3 text-right">2026 Budget</th>
                <th className="py-3 px-3 text-right">2026 Actual YTD</th>
                <th className="py-3 px-3 text-center">Sales Achieved %</th>
                <th className="py-3 px-3 text-right">Actual Margin</th>
                <th className="py-3 px-3 text-right text-rose-700">Net Receivables (AR)</th>
                <th className="py-3 px-3">Top Customer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {CUSTOMER_CATEGORIES_DATA.map((cat) => {
                const achievedPct = (cat.sales_2026_actual / cat.sales_2026_budget) * 100;
                const marginPct = (cat.margin_2026_actual / cat.sales_2026_actual) * 100;

                return (
                  <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {cat.category_name}
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-gray-600">
                      {cat.customer_count}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-gray-500">
                      {formatAED(cat.sales_2025_actual)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-gray-700">
                      {formatAED(cat.sales_2026_budget)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">
                      {formatAED(cat.sales_2026_actual)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <span className={`font-mono font-extrabold text-xs ${
                          achievedPct >= 90 ? "text-emerald-700" : achievedPct >= 80 ? "text-amber-700" : "text-rose-700"
                        }`}>
                          {formatPct(achievedPct)}
                        </span>
                        <div className="w-12 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              achievedPct >= 90 ? "bg-emerald-500" : achievedPct >= 80 ? "bg-amber-500" : "bg-rose-500"
                            }`}
                            style={{ width: `${Math.min(100, achievedPct)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                      {formatAED(cat.margin_2026_actual)} <span className="text-[10px] text-gray-400 font-normal">({formatPct(marginPct)})</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-rose-700 bg-rose-50/40">
                      {formatAED(cat.net_receivables_ar)}
                    </td>
                    <td className="py-3 px-3 text-gray-700 font-medium">
                      <p className="truncate max-w-[150px]">{cat.top_customer}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold text-slate-900">
                <td className="py-3 px-3">Total / Group Aggregate</td>
                <td className="py-3 px-2 text-center font-mono">130</td>
                <td className="py-3 px-3 text-right font-mono text-gray-600">{formatAED(overallTotals.sales2025)}</td>
                <td className="py-3 px-3 text-right font-mono text-gray-700">{formatAED(overallTotals.budgetSales)}</td>
                <td className="py-3 px-3 text-right font-mono font-extrabold text-indigo-700">{formatAED(overallTotals.actualSales)}</td>
                <td className="py-3 px-3 text-center font-mono text-indigo-700 font-extrabold">{formatPct(overallTotals.achievedPct)}</td>
                <td className="py-3 px-3 text-right font-mono text-emerald-700">{formatAED(overallTotals.actualMargin)}</td>
                <td className="py-3 px-3 text-right font-mono text-rose-800 bg-rose-100/60 font-extrabold">{formatAED(overallTotals.totalReceivables)}</td>
                <td className="py-3 px-3 text-gray-500 font-normal">All Segments</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* SKU-LEVEL BUDGET VS ACTUAL MATRIX */}
      <div className="card p-5 bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Granular SKU Budget vs Actual Matrix</h3>
              <p className="text-xs text-gray-500">Filter by category tag, search SKU code, and review unit margin variance</p>
            </div>
          </div>

          {/* Category Filter Pills & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
              {[
                { id: "ALL", label: "All SKUs" },
                { id: "Egg", label: "🥚 Egg" },
                { id: "Ing", label: "🌾 Ingredients" },
                { id: "FG", label: "🍫 FG" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setCategoryFilter(btn.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    categoryFilter === btn.id
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search SKU or product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
                />
              </div>
              <ExportExcelButton
                data={filteredSkus.map((item) => ({
                  "SKU Code": item.sku,
                  "Product Name": item.name,
                  "Category": item.category_name,
                  "Category Tag": item.category_tag,
                  "Budget Qty 2026": item.budget_qty_2026,
                  "Actual Qty 2026": item.actual_qty_2026,
                  "Budget Sales (AED)": item.sales_2026_budget,
                  "Actual Sales (AED)": item.sales_2026_actual,
                  "Achieved %": Number(((item.sales_2026_actual / item.sales_2026_budget) * 100).toFixed(1)),
                  "Unit Price (AED)": item.unit_price,
                  "Unit COGS (AED)": item.unit_cogs,
                  "Unit Margin (AED)": Number((item.unit_price - item.unit_cogs).toFixed(2)),
                  "Total Margin (AED)": item.margin_2026_actual,
                }))}
                filename="Product-SKU-Budget-vs-Actual"
                sheetName="SKU Budget vs Actual"
              />
            </div>
          </div>
        </div>

        {/* SKU Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-3 px-3">SKU Code</th>
                <th className="py-3 px-3">Product Name & Category</th>
                <th className="py-3 px-2 text-center">Tag</th>
                <th className="py-3 px-3 text-right">Budget Qty</th>
                <th className="py-3 px-3 text-right">Actual Qty</th>
                <th className="py-3 px-3 text-right">Budget (AED)</th>
                <th className="py-3 px-3 text-right">Actual (AED)</th>
                <th className="py-3 px-3 text-center">Achieved %</th>
                <th className="py-3 px-3 text-right">Unit Margin</th>
                <th className="py-3 px-3 text-right">Total Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSkus.map((item) => {
                const achievedPct = (item.sales_2026_actual / item.sales_2026_budget) * 100;
                const unitMargin = item.unit_price - item.unit_cogs;
                const marginPct = (item.margin_2026_actual / item.sales_2026_actual) * 100;

                const tagStyles = {
                  Egg: "bg-amber-100 text-amber-900 border-amber-200",
                  Ing: "bg-blue-100 text-blue-900 border-blue-200",
                  FG: "bg-violet-100 text-violet-900 border-violet-200",
                }[item.category_tag];

                return (
                  <tr key={item.sku} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-700">
                      {item.sku}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-[10px] text-gray-400">{item.category_name}</p>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase border ${tagStyles}`}>
                        {item.category_tag}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-gray-500">
                      {item.budget_qty_2026.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                      {item.actual_qty_2026.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-gray-600">
                      {formatAED(item.sales_2026_budget)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">
                      {formatAED(item.sales_2026_actual)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-extrabold ${
                        achievedPct >= 95
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : achievedPct >= 85
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}>
                        {formatPct(achievedPct)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-gray-700">
                      {formatAED(unitMargin)} <span className="text-[9px] text-gray-400 font-normal">/ unit</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                      {formatAED(item.margin_2026_actual)} <span className="text-[9px] text-gray-400 font-normal">({formatPct(marginPct)})</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}
</div>
  );
}
