"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  User,
  Building2,
  MapPin,
  Calendar,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Package,
  Layers,
  Search,
  Filter,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Sparkles,
} from "lucide-react";
import ExportExcelButton from "@/components/ExportExcelButton";
import {
  CUSTOMER_DETAIL_RECORDS,
  CustomerDetailRecord,
  CategoryTag,
} from "@/lib/data/budgetAnalyticsData";

export function CustomerBudgetDrilldown() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("cust-spinneys");
  const [categoryTagFilter, setCategoryTagFilter] = useState<"ALL" | CategoryTag>("ALL");
  const [itemCategoryFilter, setItemCategoryFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [syncingAr, setSyncingAr] = useState(false);
  const [syncAlert, setSyncAlert] = useState<string | null>(null);

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

  // Selected customer object
  const currentCustomer: CustomerDetailRecord = useMemo(() => {
    return (
      CUSTOMER_DETAIL_RECORDS.find((c) => c.id === selectedCustomerId) ||
      CUSTOMER_DETAIL_RECORDS[0]
    );
  }, [selectedCustomerId]);

  // Unique Item Categories for current customer
  const itemCategories = useMemo(() => {
    const cats = new Set<string>();
    currentCustomer.items.forEach((item) => cats.add(item.item_category));
    return Array.from(cats);
  }, [currentCustomer]);

  // Filtered customer items
  const filteredItems = useMemo(() => {
    return currentCustomer.items.filter((item) => {
      const matchTag = categoryTagFilter === "ALL" || item.category_tag === categoryTagFilter;
      const matchItemCat = itemCategoryFilter === "ALL" || item.item_category === itemCategoryFilter;
      const matchSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item_packaging.toLowerCase().includes(searchTerm.toLowerCase());
      return matchTag && matchItemCat && matchSearch;
    });
  }, [currentCustomer, categoryTagFilter, itemCategoryFilter, searchTerm]);

  // Customer aggregates
  const customerTotals = useMemo(() => {
    const totalBudgetSales = currentCustomer.items.reduce((s, i) => s + i.sales_2026_budget, 0);
    const totalActualSales = currentCustomer.items.reduce((s, i) => s + i.sales_2026_actual, 0);
    const total2025Sales = currentCustomer.items.reduce((s, i) => s + i.sales_2025_actual, 0);
    const totalBudgetMargin = currentCustomer.items.reduce((s, i) => s + i.margin_2026_budget, 0);
    const totalActualMargin = currentCustomer.items.reduce((s, i) => s + i.margin_2026_actual, 0);

    const salesAchievedPct = totalBudgetSales > 0 ? (totalActualSales / totalBudgetSales) * 100 : 0;
    const marginAchievedPct = totalBudgetMargin > 0 ? (totalActualMargin / totalBudgetMargin) * 100 : 0;
    const grossMarginPct = totalActualSales > 0 ? (totalActualMargin / totalActualSales) * 100 : 0;
    const yoyGrowthPct = total2025Sales > 0 ? ((totalActualSales - total2025Sales) / total2025Sales) * 100 : 0;

    // Category Splits for this customer
    const calcCat = (tag: CategoryTag) => {
      const catItems = currentCustomer.items.filter((i) => i.category_tag === tag);
      const budget = catItems.reduce((s, i) => s + i.sales_2026_budget, 0);
      const actual = catItems.reduce((s, i) => s + i.sales_2026_actual, 0);
      const margin = catItems.reduce((s, i) => s + i.margin_2026_actual, 0);
      const achieved = budget > 0 ? (actual / budget) * 100 : 0;
      return { budget, actual, margin, achieved };
    };

    return {
      totalBudgetSales,
      totalActualSales,
      total2025Sales,
      totalBudgetMargin,
      totalActualMargin,
      salesAchievedPct,
      marginAchievedPct,
      grossMarginPct,
      yoyGrowthPct,
      egg: calcCat("Egg"),
      ing: calcCat("Ing"),
      fg: calcCat("FG"),
    };
  }, [currentCustomer]);

  // Credit Utilization %
  const creditUtilPct =
    currentCustomer.approved_credit_limit > 0
      ? (currentCustomer.net_receivables_ar / currentCustomer.approved_credit_limit) * 100
      : 0;

  const handleSyncAr = () => {
    setSyncingAr(true);
    setTimeout(() => {
      setSyncingAr(false);
      setSyncAlert(`✓ Synchronized live AR balance for ${currentCustomer.customer_name} from Sage X3 AR Ledger.`);
      setTimeout(() => setSyncAlert(null), 4000);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Top Customer Selector & Sync Bar */}
      <div className="card p-4 bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
            <Building2 size={20} />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-400 block">Select Target Account</label>
            <div className="flex items-center gap-2">
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  setItemCategoryFilter("ALL");
                  setCategoryTagFilter("ALL");
                }}
                className="font-bold text-sm text-slate-900 bg-transparent border-0 focus:outline-none cursor-pointer hover:text-indigo-600"
              >
                {CUSTOMER_DETAIL_RECORDS.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.customer_code}] {c.customer_name} ({c.customer_category})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncAr}
            disabled={syncingAr}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={12} className={syncingAr ? "animate-spin" : ""} />
            {syncingAr ? "Updating..." : "Refresh Sage AR"}
          </button>
        </div>
      </div>

      {/* Sync Alert Banner */}
      {syncAlert && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold p-3.5 rounded-xl flex items-center justify-between shadow-xs animate-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{syncAlert}</span>
          </div>
          <button onClick={() => setSyncAlert(null)} className="text-emerald-600 font-bold">✕</button>
        </div>
      )}

      {/* 1. CUSTOMER MASTER CARD & EXPANDED METADATA */}
      <div className="card p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-extrabold uppercase bg-yellow-400 text-slate-950 px-2 py-0.5 rounded-md">
                CODE: {currentCustomer.customer_code}
              </span>
              <span className="text-[10px] font-semibold bg-white/10 text-indigo-200 px-2 py-0.5 rounded-md border border-white/10">
                {currentCustomer.customer_category}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{currentCustomer.customer_name}</h2>
            <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-indigo-400" /> {currentCustomer.customer_city}, {currentCustomer.customer_country}
              </span>
              <span>•</span>
              <span className="text-indigo-200">Station: {currentCustomer.station}</span>
            </div>
          </div>

          {/* Assigned Sales Exec */}
          <div className="bg-white/10 backdrop-blur-xs border border-white/15 p-3 rounded-xl min-w-[200px]">
            <span className="text-[9px] uppercase font-bold text-indigo-300 block tracking-wider">Assigned Sales Executive</span>
            <p className="text-sm font-extrabold text-white mt-0.5 flex items-center gap-1.5">
              <User size={14} className="text-yellow-400" /> {currentCustomer.sales_exec_name}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Direct Field Account Owner</p>
          </div>
        </div>

        {/* 2. RECEIVABLES & CREDIT RISK METRICS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          {/* Credit Period */}
          <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-medium">Credit Terms</span>
            <p className="text-sm font-bold text-white mt-0.5">{currentCustomer.credit_period_days} Days</p>
            <span className="text-[9px] text-slate-400">Standard Master Terms</span>
          </div>

          {/* Approved Credit Limit */}
          <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-medium">Approved Credit Limit</span>
            <p className="text-sm font-bold text-indigo-300 font-mono mt-0.5">{formatAED(currentCustomer.approved_credit_limit)}</p>
            <span className="text-[9px] text-slate-400">Sage X3 Risk Ceiling</span>
          </div>

          {/* Net Receivables */}
          <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-medium">Net Receivables (AR)</span>
            <p className="text-sm font-bold text-yellow-300 font-mono mt-0.5">{formatAED(currentCustomer.net_receivables_ar)}</p>
            <span className="text-[9px] text-slate-300 font-bold">{formatPct(creditUtilPct)} Limit Used</span>
          </div>

          {/* Due Post Credit Period */}
          <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-medium">Due Post Credit Period</span>
            <p className={`text-sm font-bold font-mono mt-0.5 ${
              currentCustomer.due_post_credit_period > 0 ? "text-rose-400" : "text-emerald-400"
            }`}>
              {formatAED(currentCustomer.due_post_credit_period)}
            </p>
            <span className="text-[9px] text-slate-400">
              {currentCustomer.due_post_credit_period > 0 ? "⚠️ Overdue in AR" : "✓ Zero Overdue"}
            </span>
          </div>

          {/* Days Post Credit Period */}
          <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-medium">Days Post Credit</span>
            <p className={`text-sm font-bold mt-0.5 ${
              currentCustomer.days_post_credit_period > 0 ? "text-rose-400 font-extrabold" : "text-emerald-400 font-bold"
            }`}>
              {currentCustomer.days_post_credit_period > 0
                ? `+${currentCustomer.days_post_credit_period} Days Overdue`
                : `${currentCustomer.days_post_credit_period} Days (Safe)`}
            </p>
            <span className="text-[9px] text-slate-400">Aging vs Terms</span>
          </div>
        </div>

        {/* Credit Limit Progress Gauge */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-[10px] text-slate-300">
            <span>Credit Limit Utilization: <strong>{formatAED(currentCustomer.net_receivables_ar)}</strong> of {formatAED(currentCustomer.approved_credit_limit)}</span>
            <span className="font-bold font-mono">{formatPct(creditUtilPct)}</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full ${
                creditUtilPct >= 90 ? "bg-rose-500" : creditUtilPct >= 75 ? "bg-amber-400" : "bg-emerald-400"
              }`}
              style={{ width: `${Math.min(100, creditUtilPct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. CUSTOMER SPECIFIC CATEGORY SPLIT METRICS (Egg / Ing / FG) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Account Category Split &amp; Performance ({currentCustomer.customer_name})
            </h3>
          </div>
          <span className="text-xs text-gray-500">2026 YTD Actual vs Budget</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
          {/* Total Sales Card */}
          <div className="card p-4 bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Sales</span>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  +{formatPct(customerTotals.yoyGrowthPct)} YoY
                </span>
              </div>
              <p className="text-lg font-extrabold text-slate-900 font-mono mt-1">{formatAED(customerTotals.totalActualSales)}</p>
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>Budget: {formatAED(customerTotals.totalBudgetSales)}</span>
                <span className="font-bold text-indigo-600">{formatPct(customerTotals.salesAchievedPct)} Achieved</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
              <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, customerTotals.salesAchievedPct)}%` }} />
            </div>
          </div>

          {/* Egg Sales Card */}
          <div className="card p-4 bg-amber-50/40 border border-amber-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                  🥚 Egg Products
                </span>
                <span className="text-[9px] font-extrabold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                  {formatPct(customerTotals.egg.achieved)}
                </span>
              </div>
              <p className="text-lg font-extrabold text-slate-900 font-mono mt-1">{formatAED(customerTotals.egg.actual)}</p>
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>Budget: {formatAED(customerTotals.egg.budget)}</span>
                <span className="font-bold text-emerald-700">Margin: {formatAED(customerTotals.egg.margin)}</span>
              </div>
            </div>
            <div className="w-full bg-amber-100 rounded-full h-1.5 mt-3 overflow-hidden">
              <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, customerTotals.egg.achieved)}%` }} />
            </div>
          </div>

          {/* Ing Sales Card */}
          <div className="card p-4 bg-blue-50/40 border border-blue-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1">
                  🌾 Ingredients (Ing)
                </span>
                <span className="text-[9px] font-extrabold text-blue-900 bg-blue-100 px-1.5 py-0.5 rounded">
                  {formatPct(customerTotals.ing.achieved)}
                </span>
              </div>
              <p className="text-lg font-extrabold text-slate-900 font-mono mt-1">{formatAED(customerTotals.ing.actual)}</p>
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>Budget: {formatAED(customerTotals.ing.budget)}</span>
                <span className="font-bold text-emerald-700">Margin: {formatAED(customerTotals.ing.margin)}</span>
              </div>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-1.5 mt-3 overflow-hidden">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, customerTotals.ing.achieved)}%` }} />
            </div>
          </div>

          {/* FG Sales Card */}
          <div className="card p-4 bg-violet-50/40 border border-violet-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-violet-900 uppercase tracking-wider flex items-center gap-1">
                  🍫 Finished Goods (FG)
                </span>
                <span className="text-[9px] font-extrabold text-violet-900 bg-violet-100 px-1.5 py-0.5 rounded">
                  {formatPct(customerTotals.fg.achieved)}
                </span>
              </div>
              <p className="text-lg font-extrabold text-slate-900 font-mono mt-1">{formatAED(customerTotals.fg.actual)}</p>
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>Budget: {formatAED(customerTotals.fg.budget)}</span>
                <span className="font-bold text-emerald-700">Margin: {formatAED(customerTotals.fg.margin)}</span>
              </div>
            </div>
            <div className="w-full bg-violet-100 rounded-full h-1.5 mt-3 overflow-hidden">
              <div className="bg-violet-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, customerTotals.fg.achieved)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 4. SKU-LEVEL TABLE FOR THIS SPECIFIC CUSTOMER (WITH ITEM CATEGORY SLICER) */}
      <div className="card p-5 bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">SKU Line Breakdown ({currentCustomer.customer_name})</h3>
              <p className="text-xs text-gray-500">Item Category dimension, packaging units, and SKU-level budget vs actual variance</p>
            </div>
          </div>

          {/* Slicers: Item Category & SKU Search */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Tag Pills */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
              {[
                { id: "ALL", label: "All Tags" },
                { id: "Egg", label: "Egg" },
                { id: "Ing", label: "Ing" },
                { id: "FG", label: "FG" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setCategoryTagFilter(btn.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    categoryTagFilter === btn.id
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Item Category Dropdown Slicer */}
            <select
              value={itemCategoryFilter}
              onChange={(e) => setItemCategoryFilter(e.target.value)}
              className="py-1.5 px-3 rounded-xl border border-gray-200 text-xs bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Item Categories</option>
              {itemCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search SKU or item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36"
              />
            </div>

            <ExportExcelButton
              data={filteredItems.map((item) => ({
                "SKU Code": item.sku,
                "Item Description": item.name,
                "Category": item.item_category,
                "Category Tag": item.category_tag,
                "Packaging": item.item_packaging,
                "Budget Qty 2026": item.budget_qty_2026,
                "Actual Qty 2026": item.actual_qty_2026,
                "2026 Budget Sales (AED)": item.sales_2026_budget,
                "2026 Actual Sales (AED)": item.sales_2026_actual,
                "Achieved %": Number(((item.sales_2026_actual / item.sales_2026_budget) * 100).toFixed(1)),
                "Actual Margin (AED)": item.margin_2026_actual,
              }))}
              filename={`${currentCustomer.customer_name.replace(/[^a-zA-Z0-9_-]/g, "_")}-Budget-Drilldown`}
              sheetName="SKU Breakdown"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-3 px-3">SKU Code</th>
                <th className="py-3 px-3">Item Description</th>
                <th className="py-3 px-3">Item Category</th>
                <th className="py-3 px-2 text-center">Tag</th>
                <th className="py-3 px-3">Item Packaging</th>
                <th className="py-3 px-3 text-right">Budget Qty</th>
                <th className="py-3 px-3 text-right">Actual Qty</th>
                <th className="py-3 px-3 text-right">2026 Budget</th>
                <th className="py-3 px-3 text-right">2026 Actual</th>
                <th className="py-3 px-3 text-center">Achieved %</th>
                <th className="py-3 px-3 text-right">Actual Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const achievedPct = (item.sales_2026_actual / item.sales_2026_budget) * 100;
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
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-3 px-3 text-gray-600">
                      {item.item_category}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase border ${tagStyles}`}>
                        {item.category_tag}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-gray-500">
                      {item.item_packaging}
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
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                      {formatAED(item.margin_2026_actual)} <span className="text-[9px] text-gray-400 font-normal">({formatPct(marginPct)})</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold text-slate-900">
                <td colSpan={5} className="py-3 px-3">Account Total ({currentCustomer.customer_name})</td>
                <td className="py-3 px-3 text-right font-mono text-gray-500">
                  {currentCustomer.items.reduce((s, i) => s + i.budget_qty_2026, 0).toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-800">
                  {currentCustomer.items.reduce((s, i) => s + i.actual_qty_2026, 0).toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right font-mono text-gray-600">{formatAED(customerTotals.totalBudgetSales)}</td>
                <td className="py-3 px-3 text-right font-mono font-extrabold text-indigo-700">{formatAED(customerTotals.totalActualSales)}</td>
                <td className="py-3 px-3 text-center font-mono text-indigo-700 font-extrabold">{formatPct(customerTotals.salesAchievedPct)}</td>
                <td className="py-3 px-3 text-right font-mono text-emerald-700">{formatAED(customerTotals.totalActualMargin)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
