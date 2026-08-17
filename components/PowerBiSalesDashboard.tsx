"use client";

import { useState, useMemo, useEffect } from "react";
import {
  TrendingUp,
  Building2,
  Package,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Download,
  ArrowUpRight,
  User,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  ChevronDown,
  Sparkles,
  Loader2,
} from "lucide-react";
import ExportExcelButton from "@/components/ExportExcelButton";

interface PowerBiSalesDashboardProps {
  defaultTab?: "sales_rep" | "customer" | "executive";
  repId?: string;
  role?: "manager" | "sales_rep";
}

interface SkuItem {
  id: string;
  sku: string;
  name: string;
  category_name: string;
  category_tag: "Egg" | "Ing" | "FG";
  item_packaging: string;
  budget_qty_2026: number;
  actual_qty_2026: number;
  sales_2025_actual: number;
  sales_2026_budget: number;
  sales_2026_actual: number;
  margin_2026_budget: number;
  margin_2026_actual: number;
}

interface CustomerSkuItem {
  sku: string;
  name: string;
  item_category: string;
  category_tag: "Egg" | "Ing" | "FG";
  item_packaging: string;
  budget_qty_2026: number;
  actual_qty_2026: number;
  sales_2025_actual: number;
  sales_2026_budget: number;
  sales_2026_actual: number;
  margin_2026_budget: number;
  margin_2026_actual: number;
}

interface CustomerRecord {
  id: string;
  customer_code: string;
  customer_name: string;
  customer_country: string;
  customer_city: string;
  customer_category: string;
  station: string;
  sales_exec_id: string;
  sales_exec_name: string;
  credit_period_days: number;
  approved_credit_limit: number;
  net_receivables_ar: number;
  due_post_credit_period: number;
  due_exceeding_approved_limit: number;
  days_post_credit_period: number;
  sales_2026_budget: number;
  sales_2026_actual: number;
  margin_2026_actual: number;
  items: CustomerSkuItem[];
}

interface RepRecord {
  id: string;
  rep_name: string;
  email: string;
  territory: string;
  account_count: number;
  sales_2026_budget: number;
  sales_2026_actual: number;
  margin_2026_actual: number;
  net_receivables_ar: number;
  achieved_pct: number;
  top_customer: string;
  top_category: string;
}

export function PowerBiSalesDashboard({
  defaultTab = "sales_rep",
  repId,
  role = "manager",
}: PowerBiSalesDashboardProps) {
  const isSalesRepRole = role === "sales_rep" || !!repId;
  const [activeTab, setActiveTab] = useState<"sales_rep" | "customer" | "executive">(
    isSalesRepRole ? "customer" : defaultTab
  );
  const [loading, setLoading] = useState(true);

  // Raw API Data
  const [repsData, setRepsData] = useState<RepRecord[]>([]);
  const [customersData, setCustomersData] = useState<CustomerRecord[]>([]);
  const [skusData, setSkusData] = useState<SkuItem[]>([]);

  // Filter States
  const [selectedRepFilter, setSelectedRepFilter] = useState(repId || "ALL");
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState("ALL");
  const [selectedTerritory, setSelectedTerritory] = useState("ALL");
  const [selectedCustomerSegment, setSelectedCustomerSegment] = useState("ALL");
  const [selectedCategoryTag, setSelectedCategoryTag] = useState<"ALL" | "Egg" | "Ing" | "FG">("ALL");
  const [selectedSkuFilter, setSelectedSkuFilter] = useState("ALL");

  // Search Queries
  const [repSearchQuery, setRepSearchQuery] = useState("");
  const [skuSearchQuery, setSkuSearchQuery] = useState("");
  const [customerSkuSearch, setCustomerSkuSearch] = useState("");

  // Customer Drilldown State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [itemCatFilter, setItemCatFilter] = useState("ALL");

  // Fetch Live Data from PostgreSQL API
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/budget-actual/data");
      const json = await res.json();
      if (json.success) {
        setRepsData(json.reps || []);
        const rawCusts: CustomerRecord[] = json.customers || [];
        setCustomersData(rawCusts);
        setSkusData(json.skus || []);

        // Default customer selection for Rep vs Manager
        const relevantCusts = repId ? rawCusts.filter((c) => c.sales_exec_id === repId) : rawCusts;
        if (relevantCusts.length > 0) {
          setSelectedCustomerId(relevantCusts[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load budget actual live data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [repId]);

  function formatAED(n: number) {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      maximumFractionDigits: 0,
    }).format(n || 0);
  }

  function formatPct(n: number) {
    if (isNaN(n) || n === 0) return "0.0%";
    return `${n.toFixed(1)}%`;
  }

  // Base Customers scoped by Rep ID if in Sales Rep view
  const baseCustomers = useMemo(() => {
    if (isSalesRepRole && repId) {
      return customersData.filter((c) => c.sales_exec_id === repId);
    }
    return customersData;
  }, [customersData, isSalesRepRole, repId]);

  // Current Sales Rep profile if repId is set
  const currentRepProfile = useMemo(() => {
    if (!repId) return null;
    return repsData.find((r) => r.id === repId) || null;
  }, [repsData, repId]);

  // Unique Territories list from relevant customers
  const territoryList = useMemo(() => {
    const set = new Set<string>();
    baseCustomers.forEach((c) => {
      if (c.station) set.add(c.station);
    });
    return Array.from(set);
  }, [baseCustomers]);

  // Unique Segments list from relevant customers
  const segmentList = useMemo(() => {
    const set = new Set<string>();
    baseCustomers.forEach((c) => {
      if (c.customer_category) set.add(c.customer_category);
    });
    return Array.from(set);
  }, [baseCustomers]);

  // Filtered Sales Reps based on Rep dropdown, Territory filter, and Search Query (Manager only)
  const filteredReps = useMemo(() => {
    return repsData.filter((rep) => {
      const matchRep = selectedRepFilter === "ALL" || rep.id === selectedRepFilter;
      const matchTerritory =
        selectedTerritory === "ALL" || rep.territory.toLowerCase().includes(selectedTerritory.toLowerCase());
      const q = repSearchQuery.toLowerCase();
      const matchSearch =
        !q ||
        rep.rep_name.toLowerCase().includes(q) ||
        rep.territory.toLowerCase().includes(q) ||
        rep.top_customer.toLowerCase().includes(q);
      return matchRep && matchTerritory && matchSearch;
    });
  }, [repsData, selectedRepFilter, selectedTerritory, repSearchQuery]);

  // Filtered Customers based on Rep dropdown, Customer dropdown, Territory, Segment
  const filteredCustomers = useMemo(() => {
    return baseCustomers.filter((cust) => {
      const matchRep =
        isSalesRepRole || selectedRepFilter === "ALL" || cust.sales_exec_id === selectedRepFilter;
      const matchCust = selectedCustomerFilter === "ALL" || cust.id === selectedCustomerFilter;
      const matchTerritory = selectedTerritory === "ALL" || cust.station === selectedTerritory;
      const matchSegment = selectedCustomerSegment === "ALL" || cust.customer_category === selectedCustomerSegment;
      return matchRep && matchCust && matchTerritory && matchSegment;
    });
  }, [baseCustomers, isSalesRepRole, selectedRepFilter, selectedCustomerFilter, selectedTerritory, selectedCustomerSegment]);

  // Sales Rep View Totals (Manager Matrix)
  const salesRepTotals = useMemo(() => {
    const totalBudget = filteredReps.reduce((s, r) => s + r.sales_2026_budget, 0);
    const totalActual = filteredReps.reduce((s, r) => s + r.sales_2026_actual, 0);
    const totalMargin = filteredReps.reduce((s, r) => s + r.margin_2026_actual, 0);
    const totalAR = filteredReps.reduce((s, r) => s + r.net_receivables_ar, 0);
    const achievedPct = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;
    return { totalBudget, totalActual, totalMargin, totalAR, achievedPct };
  }, [filteredReps]);

  // Executive SKUs with Dynamic Filters (Territory, Segment, Category Tag, SKU dropdown, Search)
  const filteredSkus = useMemo(() => {
    const isFiltered =
      isSalesRepRole ||
      selectedRepFilter !== "ALL" ||
      selectedCustomerFilter !== "ALL" ||
      selectedTerritory !== "ALL" ||
      selectedCustomerSegment !== "ALL";

    let baseSkus: SkuItem[] = skusData;

    if (isFiltered) {
      baseSkus = skusData.map((sku) => {
        let budgetQty = 0;
        let actualQty = 0;
        let budgetAmount = 0;
        let actualAmount = 0;

        filteredCustomers.forEach((cust) => {
          const item = cust.items.find((i) => i.name === sku.name);
          if (item) {
            budgetQty += item.budget_qty_2026;
            actualQty += item.actual_qty_2026;
            budgetAmount += item.sales_2026_budget;
            actualAmount += item.sales_2026_actual;
          }
        });

        const marginRate = sku.category_tag === "FG" ? 0.35 : sku.category_tag === "Ing" ? 0.30 : 0.28;

        return {
          ...sku,
          budget_qty_2026: budgetQty,
          actual_qty_2026: actualQty,
          sales_2026_budget: budgetAmount,
          sales_2026_actual: actualAmount,
          margin_2026_budget: Math.round(budgetAmount * marginRate),
          margin_2026_actual: Math.round(actualAmount * marginRate),
        };
      });
    }

    return baseSkus.filter((item) => {
      const matchTag = selectedCategoryTag === "ALL" || item.category_tag === selectedCategoryTag;
      const matchSku = selectedSkuFilter === "ALL" || item.id === selectedSkuFilter || item.sku === selectedSkuFilter;
      const matchSearch =
        !skuSearchQuery ||
        item.name.toLowerCase().includes(skuSearchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(skuSearchQuery.toLowerCase()) ||
        item.category_name.toLowerCase().includes(skuSearchQuery.toLowerCase());
      return matchTag && matchSku && matchSearch && (item.sales_2026_budget > 0 || item.sales_2026_actual > 0);
    });
  }, [
    skusData,
    filteredCustomers,
    isSalesRepRole,
    selectedCategoryTag,
    selectedSkuFilter,
    skuSearchQuery,
    selectedRepFilter,
    selectedCustomerFilter,
    selectedTerritory,
    selectedCustomerSegment,
  ]);

  // Dynamic Totals based on Active Filters & Scope
  const execTotals = useMemo(() => {
    const totalBudgetSales = filteredSkus.reduce((s, i) => s + i.sales_2026_budget, 0);
    const totalActualSales = filteredSkus.reduce((s, i) => s + i.sales_2026_actual, 0);
    const totalSales2025 = filteredSkus.reduce((s, i) => s + i.sales_2025_actual, 0);
    const totalBudgetMargin = filteredSkus.reduce((s, i) => s + i.margin_2026_budget, 0);
    const totalActualMargin = filteredSkus.reduce((s, i) => s + i.margin_2026_actual, 0);
    const totalReceivables = filteredCustomers.reduce((s, c) => s + c.net_receivables_ar, 0);

    const calcCat = (tag: "Egg" | "Ing" | "FG") => {
      const items = filteredSkus.filter((i) => i.category_tag === tag);
      const actualSales = items.reduce((s, i) => s + i.sales_2026_actual, 0);
      const budgetSales = items.reduce((s, i) => s + i.sales_2026_budget, 0);
      const actualMargin = items.reduce((s, i) => s + i.margin_2026_actual, 0);
      const budgetMargin = items.reduce((s, i) => s + i.margin_2026_budget, 0);
      const achievedPct = budgetSales > 0 ? (actualSales / budgetSales) * 100 : 0;
      return { actualSales, budgetSales, actualMargin, budgetMargin, achievedPct };
    };

    return {
      totalBudgetSales,
      totalActualSales,
      totalSales2025,
      totalBudgetMargin,
      totalActualMargin,
      totalReceivables,
      salesAchievedPct: totalBudgetSales > 0 ? (totalActualSales / totalBudgetSales) * 100 : 0,
      marginAchievedPct: totalBudgetMargin > 0 ? (totalActualMargin / totalBudgetMargin) * 100 : 0,
      grossMarginPct: totalActualSales > 0 ? (totalActualMargin / totalActualSales) * 100 : 0,
      egg: calcCat("Egg"),
      ing: calcCat("Ing"),
      fg: calcCat("FG"),
    };
  }, [filteredSkus, filteredCustomers]);

  // Selected Customer for Drill-Down
  const currentCustomer: CustomerRecord | null = useMemo(() => {
    if (!baseCustomers.length) return null;
    return (
      baseCustomers.find((c) => c.id === selectedCustomerId) ||
      baseCustomers[0]
    );
  }, [baseCustomers, selectedCustomerId]);

  // Customer Drill-Down Unique Item Categories
  const customerItemCategories = useMemo(() => {
    if (!currentCustomer) return [];
    const cats = new Set<string>();
    currentCustomer.items.forEach((item) => cats.add(item.item_category));
    return Array.from(cats);
  }, [currentCustomer]);

  // Filtered Customer Items in Drill-down
  const filteredCustomerItems = useMemo(() => {
    if (!currentCustomer) return [];
    return currentCustomer.items.filter((item) => {
      const matchCat = itemCatFilter === "ALL" || item.item_category === itemCatFilter;
      const matchTag = selectedCategoryTag === "ALL" || item.category_tag === selectedCategoryTag;
      const matchSearch =
        !customerSkuSearch ||
        item.name.toLowerCase().includes(customerSkuSearch.toLowerCase()) ||
        item.sku.toLowerCase().includes(customerSkuSearch.toLowerCase()) ||
        item.item_packaging.toLowerCase().includes(customerSkuSearch.toLowerCase());
      return matchCat && matchTag && matchSearch;
    });
  }, [currentCustomer, itemCatFilter, selectedCategoryTag, customerSkuSearch]);

  // Customer Specific Totals
  const customerTotals = useMemo(() => {
    if (!currentCustomer) {
      return {
        totalBudgetSales: 0,
        totalActualSales: 0,
        salesAchievedPct: 0,
        egg: { actual: 0, budget: 0, margin: 0, achieved: 0 },
        ing: { actual: 0, budget: 0, margin: 0, achieved: 0 },
        fg: { actual: 0, budget: 0, margin: 0, achieved: 0 },
      };
    }

    const totalBudgetSales = currentCustomer.items.reduce((s, i) => s + i.sales_2026_budget, 0);
    const totalActualSales = currentCustomer.items.reduce((s, i) => s + i.sales_2026_actual, 0);

    const calcCat = (tag: "Egg" | "Ing" | "FG") => {
      const items = currentCustomer.items.filter((i) => i.category_tag === tag);
      const actual = items.reduce((s, i) => s + i.sales_2026_actual, 0);
      const budget = items.reduce((s, i) => s + i.sales_2026_budget, 0);
      const margin = items.reduce((s, i) => s + i.margin_2026_actual, 0);
      const achieved = budget > 0 ? (actual / budget) * 100 : 0;
      return { actual, budget, margin, achieved };
    };

    return {
      totalBudgetSales,
      totalActualSales,
      salesAchievedPct: totalBudgetSales > 0 ? (totalActualSales / totalBudgetSales) * 100 : 0,
      egg: calcCat("Egg"),
      ing: calcCat("Ing"),
      fg: calcCat("FG"),
    };
  }, [currentCustomer]);

  const creditUtilPct =
    currentCustomer && currentCustomer.approved_credit_limit > 0
      ? (currentCustomer.net_receivables_ar / currentCustomer.approved_credit_limit) * 100
      : 0;

  if (loading) {
    return (
      <div className="card p-12 bg-white border border-gray-200 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-semibold text-gray-600">
          Loading {isSalesRepRole ? "My Assigned Accounts Matrix..." : "Live Budget vs Actual Matrix..."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── 1. TOP VIEW NAVIGATION PILLS & REFRESH ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl flex-wrap">
          {/* Sales Rep Basis Matrix Tab (Manager Only) */}
          {!isSalesRepRole && (
            <button
              type="button"
              onClick={() => setActiveTab("sales_rep")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "sales_rep"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <User size={14} />
              <span>👥 Sales Rep Basis Matrix</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("customer")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "customer"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Building2 size={14} />
            <span>{isSalesRepRole ? "🏬 My Customer Accounts" : "🏬 Customer Basis Matrix"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("executive")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "executive"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Layers size={14} />
            <span>📦 Category &amp; SKU Matrix</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          {isSalesRepRole && currentRepProfile && (
            <span className="inline-flex items-center gap-1.5 font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
              <User size={12} /> {currentRepProfile.rep_name} ({baseCustomers.length} Accounts)
            </span>
          )}
          <button
            type="button"
            onClick={fetchDashboardData}
            className="inline-flex items-center gap-1.5 font-semibold text-gray-700 bg-white hover:bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200 shadow-2xs transition-colors"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Sync Live DB
          </button>
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
            <CheckCircle2 size={12} /> Live PostgreSQL Sync
          </span>
        </div>
      </div>

      {/* ── GLOBAL INTERACTIVE SLICER DROPDOWNS BAR ── */}
      <div className="card p-3.5 bg-white border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Sales Rep Dropdown (Manager Only) */}
          {!isSalesRepRole && (
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
              <User size={13} className="text-indigo-600" />
              <span className="text-gray-400 font-medium">Sales Rep:</span>
              <select
                value={selectedRepFilter}
                onChange={(e) => {
                  setSelectedRepFilter(e.target.value);
                  setSelectedCustomerFilter("ALL");
                }}
                className="bg-transparent font-bold text-gray-800 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Sales Reps ({repsData.length})</option>
                {repsData.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.rep_name} ({r.account_count} accounts)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Customer Dropdown (Scoped to Rep's Customers on Rep Side) */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
            <Building2 size={13} className="text-indigo-600" />
            <span className="text-gray-400 font-medium">Customer:</span>
            <select
              value={selectedCustomerFilter}
              onChange={(e) => {
                setSelectedCustomerFilter(e.target.value);
                if (e.target.value !== "ALL") {
                  setSelectedCustomerId(e.target.value);
                }
              }}
              className="bg-transparent font-bold text-gray-800 focus:outline-none cursor-pointer max-w-[220px] truncate"
            >
              <option value="ALL">
                {isSalesRepRole ? `All My Customers (${baseCustomers.length})` : `All Customers (${baseCustomers.length})`}
              </option>
              {baseCustomers
                .filter((c) => isSalesRepRole || selectedRepFilter === "ALL" || c.sales_exec_id === selectedRepFilter)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customer_name}
                  </option>
                ))}
            </select>
          </div>

          {/* Territory Dropdown */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
            <MapPin size={13} className="text-indigo-600" />
            <span className="text-gray-400 font-medium">Territory:</span>
            <select
              value={selectedTerritory}
              onChange={(e) => setSelectedTerritory(e.target.value)}
              className="bg-transparent font-bold text-gray-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Territories</option>
              {territoryList.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Segment Dropdown */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
            <span className="text-gray-400 font-medium">Segment:</span>
            <select
              value={selectedCustomerSegment}
              onChange={(e) => setSelectedCustomerSegment(e.target.value)}
              className="bg-transparent font-bold text-gray-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Customer Segments</option>
              {segmentList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Category Tag Interactive Filter Pills */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg">
            {[
              { id: "ALL", label: "All Items" },
              { id: "Egg", label: "🥚 Egg" },
              { id: "Ing", label: "🌾 Ingredients" },
              { id: "FG", label: "🍫 FG" },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setSelectedCategoryTag(btn.id as any)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  selectedCategoryTag === btn.id
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clear Filters Button */}
        {((!isSalesRepRole && selectedRepFilter !== "ALL") ||
          selectedCustomerFilter !== "ALL" ||
          selectedTerritory !== "ALL" ||
          selectedCustomerSegment !== "ALL" ||
          selectedCategoryTag !== "ALL") && (
          <button
            type="button"
            onClick={() => {
              if (!isSalesRepRole) setSelectedRepFilter("ALL");
              setSelectedCustomerFilter("ALL");
              setSelectedTerritory("ALL");
              setSelectedCustomerSegment("ALL");
              setSelectedCategoryTag("ALL");
              setSelectedSkuFilter("ALL");
            }}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded hover:bg-rose-50 transition-colors"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 0: SALES REPRESENTATIVE BASIS MATRIX (MANAGER ONLY)                    */}
      {/* ========================================================================= */}
      {!isSalesRepRole && activeTab === "sales_rep" && (
        <div className="space-y-5">
          {/* Top KPI Cards for Sales Rep Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4 bg-white border border-gray-200 space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Sales Rep Budget</span>
              <p className="text-xl font-black text-gray-900 font-mono">{formatAED(salesRepTotals.totalBudget)}</p>
              <p className="text-[10px] text-gray-400">2026 Target Portfolio</p>
            </div>

            <div className="card p-4 bg-indigo-50/60 border border-indigo-200 space-y-1">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Actual Sales Achieved</span>
              <p className="text-xl font-black text-indigo-900 font-mono">{formatAED(salesRepTotals.totalActual)}</p>
              <p className="text-[10px] text-emerald-600 font-bold">{formatPct(salesRepTotals.achievedPct)} Target Achieved</p>
            </div>

            <div className="card p-4 bg-emerald-50/60 border border-emerald-200 space-y-1">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Gross Margin YTD</span>
              <p className="text-xl font-black text-emerald-900 font-mono">{formatAED(salesRepTotals.totalMargin)}</p>
              <p className="text-[10px] text-emerald-700 font-semibold">
                {formatPct(salesRepTotals.totalActual > 0 ? (salesRepTotals.totalMargin / salesRepTotals.totalActual) * 100 : 0)} Margin %
              </p>
            </div>

            <div className="card p-4 bg-rose-50/60 border border-rose-200 space-y-1">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Open Receivables (AR)</span>
              <p className="text-xl font-black text-rose-900 font-mono">{formatAED(salesRepTotals.totalAR)}</p>
              <p className="text-[10px] text-rose-700 font-semibold">Total Accounts Receivables</p>
            </div>
          </div>

          {/* Search Filter Bar */}
          <div className="card p-3.5 bg-white border border-gray-200 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <User size={16} className="text-indigo-600" />
              <h3 className="text-xs font-bold text-gray-800">
                Sales Representatives Budget vs Actual Matrix ({filteredReps.length} Reps)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sales rep, territory, key account..."
                  value={repSearchQuery}
                  onChange={(e) => setRepSearchQuery(e.target.value)}
                  className="pl-7 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                />
              </div>
              <ExportExcelButton
                data={filteredReps.map((r) => ({
                  "Sales Representative": r.rep_name,
                  "Territory": r.territory,
                  "2026 Budget (AED)": r.sales_2026_budget,
                  "2026 Actual YTD (AED)": r.sales_2026_actual,
                  "Achievement %": Number(((r.sales_2026_actual / r.sales_2026_budget) * 100).toFixed(1)),
                  "Gross Margin (AED)": r.margin_2026_actual,
                  "Margin %": Number(((r.margin_2026_actual / r.sales_2026_actual) * 100).toFixed(1)),
                  "Open AR Receivables (AED)": r.net_receivables_ar,
                  "Assigned Accounts": r.account_count,
                  "Key Account": r.top_customer,
                }))}
                filename="Sales-Reps-Performance-Matrix"
                sheetName="Sales Reps"
              />
            </div>
          </div>

          {/* Sales Rep Table */}
          <div className="card overflow-hidden bg-white border border-gray-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase text-[10px] font-bold tracking-wider">
                    <th className="p-3">Sales Representative</th>
                    <th className="p-3">Territory</th>
                    <th className="p-3 text-right">2026 Budget Target</th>
                    <th className="p-3 text-right">2026 Actual YTD</th>
                    <th className="p-3 text-center">Achievement %</th>
                    <th className="p-3 text-right">Gross Margin</th>
                    <th className="p-3 text-right">Open AR (Sage)</th>
                    <th className="p-3">Key Account</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredReps.map((rep) => {
                    const marginPct = rep.sales_2026_actual > 0 ? (rep.margin_2026_actual / rep.sales_2026_actual) * 100 : 0;
                    return (
                      <tr
                        key={rep.id}
                        onClick={() => {
                          setSelectedRepFilter(rep.id);
                          setActiveTab("customer");
                        }}
                        className="hover:bg-indigo-50/40 transition-colors cursor-pointer"
                        title="Click to view Customer Matrix for this Rep"
                      >
                        <td className="p-3">
                          <div className="font-bold text-gray-900 flex items-center gap-1.5">
                            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black">
                              {rep.rep_name.split(" ").map((n) => n[0]).join("")}
                            </span>
                            {rep.rep_name}
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
                            {rep.account_count} Assigned Accounts
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-gray-700">{rep.territory}</td>
                        <td className="p-3 text-right font-mono font-bold text-gray-700">
                          {formatAED(rep.sales_2026_budget)}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-indigo-900">
                          {formatAED(rep.sales_2026_actual)}
                        </td>
                        <td className="p-3 text-center">
                          <div className="space-y-1">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                rep.achieved_pct >= 90
                                  ? "bg-emerald-100 text-emerald-900"
                                  : "bg-amber-100 text-amber-900"
                              }`}
                            >
                              {rep.achieved_pct}%
                            </span>
                            <div className="w-20 bg-gray-100 rounded-full h-1.5 mx-auto overflow-hidden">
                              <div
                                className="bg-indigo-600 h-full rounded-full"
                                style={{ width: `${Math.min(100, rep.achieved_pct)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-700">
                          {formatAED(rep.margin_2026_actual)}
                          <span className="text-[9px] text-gray-400 block font-normal">({marginPct.toFixed(1)}%)</span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-rose-700">
                          {formatAED(rep.net_receivables_ar)}
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-gray-800 block text-[11px] truncate max-w-[180px]">
                            {rep.top_customer}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: EXECUTIVE CATEGORY & SEGMENT MATRIX                                */}
      {/* ========================================================================= */}
      {activeTab === "executive" && (
        <div className="space-y-5">
          {/* Row 1: 4 Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Sales Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/30 p-5 text-white shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />{" "}
                    {isSalesRepRole ? "My Portfolio Sales (2026 YTD)" : "Total Sales (2026 YTD)"}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <ArrowUpRight size={12} /> Live DB
                  </span>
                </div>

                <p className="text-2xl font-black text-white font-mono tracking-tight mt-2.5">
                  {formatAED(execTotals.totalActualSales)}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-300 mt-2 pt-2 border-t border-white/10">
                  <span className="text-[11px] text-slate-400">
                    Budget: <strong className="text-slate-200">{formatAED(execTotals.totalBudgetSales)}</strong>
                  </span>
                  <span className="text-xs font-extrabold text-indigo-400 font-mono">
                    {formatPct(execTotals.salesAchievedPct)} Achieved
                  </span>
                </div>
              </div>

              <div className="w-full bg-white/10 rounded-full h-2 mt-3 overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-blue-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, execTotals.salesAchievedPct)}%` }}
                />
              </div>
            </div>

            {/* 2. Gross Margin Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 border border-emerald-500/30 p-5 text-white shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Gross Margin 2026
                  </span>
                  <span className="inline-flex items-center text-[10px] font-extrabold text-emerald-300 bg-emerald-900/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    {formatPct(execTotals.grossMarginPct)} Margin
                  </span>
                </div>

                <p className="text-2xl font-black text-white font-mono tracking-tight mt-2.5">
                  {formatAED(execTotals.totalActualMargin)}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-300 mt-2 pt-2 border-t border-white/10">
                  <span className="text-[11px] text-slate-400">
                    Budget: <strong className="text-slate-200">{formatAED(execTotals.totalBudgetMargin)}</strong>
                  </span>
                  <span className="text-xs font-extrabold text-emerald-400 font-mono">
                    {formatPct(execTotals.marginAchievedPct)} Target
                  </span>
                </div>
              </div>

              <div className="w-full bg-white/10 rounded-full h-2 mt-3 overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, execTotals.marginAchievedPct)}%` }}
                />
              </div>
            </div>

            {/* 3. Active SKUs Count Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-950 via-slate-900 to-slate-900 border border-amber-500/30 p-5 text-white shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-400" /> Active Products
                  </span>
                  <span className="text-[10px] font-extrabold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-mono">
                    {filteredSkus.length} SKUs
                  </span>
                </div>

                <p className="text-sm font-bold text-white mt-2 truncate">
                  {filteredSkus[0]?.name || "Master Baker Catalog"}
                </p>
                <p className="text-xl font-extrabold text-amber-300 font-mono mt-0.5">
                  {formatAED(filteredSkus[0]?.sales_2026_actual || 0)}
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs mt-2">
                <span className="text-[11px] text-slate-400">Tag: {selectedCategoryTag}</span>
                <span className="text-emerald-400 font-extrabold font-mono text-[11px]">
                  Margin: {formatAED(filteredSkus[0]?.margin_2026_actual || 0)}
                </span>
              </div>
            </div>

            {/* 4. Accounts & AR Exposure Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950 border border-rose-500/30 p-5 text-white shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 size={13} className="text-rose-400" /> Open AR Exposure
                  </span>
                  <span className="text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-400/40 px-2 py-0.5 rounded-full font-mono">
                    {filteredCustomers.length} Accounts
                  </span>
                </div>

                <p className="text-sm font-bold text-white mt-2 truncate">
                  {filteredCustomers[0]?.customer_name || "Total Receivables"}
                </p>
                <p className="text-xl font-extrabold text-white font-mono mt-0.5">
                  {formatAED(execTotals.totalReceivables)}
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs mt-2">
                <span className="text-[11px] text-slate-400">Top Account AR:</span>
                <span className="text-rose-400 font-black font-mono text-[11px]">
                  {formatAED(filteredCustomers[0]?.net_receivables_ar || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: 3 Category Split Cards (Egg / Ing / FG Split) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Egg Products Card */}
            <div
              onClick={() => setSelectedCategoryTag(selectedCategoryTag === "Egg" ? "ALL" : "Egg")}
              className={`rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50/20 to-white border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 cursor-pointer ${
                selectedCategoryTag === "Egg" ? "ring-2 ring-amber-500 border-amber-400" : "border-amber-200/90"
              }`}
            >
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
                    {formatPct(execTotals.egg.achievedPct)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 bg-white/90 p-3.5 rounded-xl border border-amber-100/90 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Actual YTD:</span>
                    <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">
                      {formatAED(execTotals.egg.actualSales)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Budget Target:</span>
                    <span className="text-sm font-bold text-slate-600 font-mono mt-0.5 block">
                      {formatAED(execTotals.egg.budgetSales)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="w-full bg-amber-100/80 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-orange-400 h-2 rounded-full shadow-2xs transition-all duration-500"
                    style={{ width: `${Math.min(100, execTotals.egg.achievedPct)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500 font-medium">Gross Margin:</span>
                  <span className="font-extrabold text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    {formatAED(execTotals.egg.actualMargin)}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Bakery Ingredients Card */}
            <div
              onClick={() => setSelectedCategoryTag(selectedCategoryTag === "Ing" ? "ALL" : "Ing")}
              className={`rounded-2xl bg-gradient-to-br from-blue-50 via-sky-50/20 to-white border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 cursor-pointer ${
                selectedCategoryTag === "Ing" ? "ring-2 ring-blue-500 border-blue-400" : "border-blue-200/90"
              }`}
            >
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
                    {formatPct(execTotals.ing.achievedPct)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 bg-white/90 p-3.5 rounded-xl border border-blue-100/90 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Actual YTD:</span>
                    <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">
                      {formatAED(execTotals.ing.actualSales)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Budget Target:</span>
                    <span className="text-sm font-bold text-slate-600 font-mono mt-0.5 block">
                      {formatAED(execTotals.ing.budgetSales)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="w-full bg-blue-100/80 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-sky-400 h-2 rounded-full shadow-2xs transition-all duration-500"
                    style={{ width: `${Math.min(100, execTotals.ing.achievedPct)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500 font-medium">Gross Margin:</span>
                  <span className="font-extrabold text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    {formatAED(execTotals.ing.actualMargin)}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Finished Goods Card */}
            <div
              onClick={() => setSelectedCategoryTag(selectedCategoryTag === "FG" ? "ALL" : "FG")}
              className={`rounded-2xl bg-gradient-to-br from-violet-50 via-purple-50/20 to-white border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 cursor-pointer ${
                selectedCategoryTag === "FG" ? "ring-2 ring-violet-500 border-violet-400" : "border-violet-200/90"
              }`}
            >
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
                    {formatPct(execTotals.fg.achievedPct)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 bg-white/90 p-3.5 rounded-xl border border-violet-100/90 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Actual YTD:</span>
                    <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">
                      {formatAED(execTotals.fg.actualSales)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Budget Target:</span>
                    <span className="text-sm font-bold text-slate-600 font-mono mt-0.5 block">
                      {formatAED(execTotals.fg.budgetSales)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="w-full bg-violet-100/80 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-violet-600 to-purple-400 h-2 rounded-full shadow-2xs transition-all duration-500"
                    style={{ width: `${Math.min(100, execTotals.fg.achievedPct)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500 font-medium">Gross Margin:</span>
                  <span className="font-extrabold text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    {formatAED(execTotals.fg.actualMargin)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: SKU Master Level Matrix */}
          <div className="card p-5 bg-white border border-gray-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-indigo-600" />
                <h3 className="text-sm font-bold text-gray-900">
                  {isSalesRepRole ? "Portfolio SKU Performance Matrix" : "SKU Master Performance Matrix"} ({filteredSkus.length} Items)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search SKU or product..."
                    value={skuSearchQuery}
                    onChange={(e) => setSkuSearchQuery(e.target.value)}
                    className="pl-7 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48"
                  />
                </div>
                <ExportExcelButton
                  data={filteredSkus.map((s) => ({
                    "SKU Code": s.sku,
                    "Product Name": s.name,
                    "Category": s.category_name,
                    "Category Tag": s.category_tag,
                    "Packaging Unit": s.item_packaging,
                    "Budget Qty 2026": s.budget_qty_2026,
                    "Actual Qty 2026": s.actual_qty_2026,
                    "2026 Budget (AED)": s.sales_2026_budget,
                    "2026 Actual (AED)": s.sales_2026_actual,
                    "Achievement %": Number(((s.sales_2026_actual / s.sales_2026_budget) * 100).toFixed(1)),
                    "Actual Margin (AED)": s.margin_2026_actual,
                  }))}
                  filename="Portfolio-SKU-Performance-Matrix"
                  sheetName="SKU Performance"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-600 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">SKU Code</th>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-2 text-center">Tag</th>
                    <th className="py-2.5 px-3">Packaging Unit</th>
                    <th className="py-2.5 px-3 text-right">Budget Qty</th>
                    <th className="py-2.5 px-3 text-right">Actual Qty</th>
                    <th className="py-2.5 px-3 text-right">2026 Budget</th>
                    <th className="py-2.5 px-3 text-right">2026 Actual</th>
                    <th className="py-2.5 px-3 text-center">Achieved %</th>
                    <th className="py-2.5 px-3 text-right">Actual Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSkus.map((item) => {
                    const achievedPct = item.sales_2026_budget > 0 ? (item.sales_2026_actual / item.sales_2026_budget) * 100 : 0;
                    const tagStyles = {
                      Egg: "bg-amber-100 text-amber-900 border-amber-200",
                      Ing: "bg-blue-100 text-blue-900 border-blue-200",
                      FG: "bg-violet-100 text-violet-900 border-violet-200",
                    }[item.category_tag];

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{item.sku}</td>
                        <td className="py-2.5 px-3 font-bold text-gray-900">{item.name}</td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase border ${tagStyles}`}>
                            {item.category_tag}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-gray-500">{item.item_packaging}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-500">{item.budget_qty_2026.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-800">{item.actual_qty_2026.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-600">{formatAED(item.sales_2026_budget)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-extrabold text-gray-900">{formatAED(item.sales_2026_actual)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-extrabold ${
                              achievedPct >= 90 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {formatPct(achievedPct)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">{formatAED(item.margin_2026_actual)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CUSTOMER DRILL-DOWN & CREDIT RECEIVABLES HUB                       */}
      {/* ========================================================================= */}
      {activeTab === "customer" && currentCustomer && (
        <div className="space-y-5">
          {/* Top Customer Selector Card */}
          <div className="card p-4 bg-white border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                <Building2 size={20} />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block">
                  {isSalesRepRole ? "Select From My Assigned Accounts" : "Select Customer Account"}
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    setItemCatFilter("ALL");
                  }}
                  className="font-bold text-sm text-gray-900 bg-transparent border-0 focus:outline-none cursor-pointer hover:text-indigo-600"
                >
                  {filteredCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.customer_name} ({c.station})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-mono">
                Station: <strong>{currentCustomer.station}</strong>
              </span>
            </div>
          </div>

          {/* Customer Master Header & Credit Risk Banner */}
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
                <p className="text-xs text-slate-300 flex items-center gap-1.5">
                  <MapPin size={12} className="text-indigo-400" /> {currentCustomer.customer_city}, {currentCustomer.customer_country} · {currentCustomer.station}
                </p>
              </div>

              {/* Mapped Sales Exec */}
              <div className="bg-white/10 backdrop-blur-xs border border-white/15 p-3 rounded-xl min-w-[200px]">
                <span className="text-[9px] uppercase font-bold text-indigo-300 block tracking-wider">Assigned Sales Executive</span>
                <p className="text-sm font-extrabold text-white mt-0.5 flex items-center gap-1.5">
                  <User size={14} className="text-yellow-400" /> {currentCustomer.sales_exec_name}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Direct Account Owner</p>
              </div>
            </div>

            {/* Credit Risk & AR Aging Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
              <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-medium">Credit Period</span>
                <p className="text-sm font-bold text-white mt-0.5">{currentCustomer.credit_period_days} Days</p>
              </div>

              <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-medium">Approved Credit Limit</span>
                <p className="text-sm font-bold text-indigo-300 font-mono mt-0.5">{formatAED(currentCustomer.approved_credit_limit)}</p>
              </div>

              <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-medium">Net Receivables (AR)</span>
                <p className="text-sm font-bold text-yellow-300 font-mono mt-0.5">{formatAED(currentCustomer.net_receivables_ar)}</p>
              </div>

              <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-medium">Due Post Credit Period</span>
                <p
                  className={`text-sm font-bold font-mono mt-0.5 ${
                    currentCustomer.due_post_credit_period > 0 ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {formatAED(currentCustomer.due_post_credit_period)}
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-medium">Days Post Credit Period</span>
                <p
                  className={`text-sm font-bold mt-0.5 ${
                    currentCustomer.days_post_credit_period > 0 ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {currentCustomer.days_post_credit_period > 0
                    ? `+${currentCustomer.days_post_credit_period} Days Overdue`
                    : `${currentCustomer.days_post_credit_period} Days (Safe)`}
                </p>
              </div>
            </div>

            {/* Credit Progress */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[10px] text-slate-300">
                <span>
                  Credit Utilization: <strong>{formatAED(currentCustomer.net_receivables_ar)}</strong> of {formatAED(currentCustomer.approved_credit_limit)}
                </span>
                <span className="font-bold font-mono">{formatPct(creditUtilPct)}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full ${
                    creditUtilPct >= 90 ? "bg-rose-500" : creditUtilPct >= 75 ? "bg-amber-400" : "bg-emerald-400"
                  }`}
                  style={{ width: `${Math.min(100, creditUtilPct)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Customer Specific Category Split Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4 bg-white border border-gray-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Sales (2026 YTD)</span>
                <p className="text-lg font-extrabold text-gray-900 font-mono mt-1">{formatAED(customerTotals.totalActualSales)}</p>
                <div className="flex justify-between text-[11px] text-gray-500 mt-1">
                  <span>Budget: {formatAED(customerTotals.totalBudgetSales)}</span>
                  <span className="font-bold text-indigo-600">{formatPct(customerTotals.salesAchievedPct)}</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, customerTotals.salesAchievedPct)}%` }} />
              </div>
            </div>

            <div className="card p-4 bg-amber-50/40 border border-amber-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">🥚 Egg Sales</span>
                <p className="text-lg font-extrabold text-gray-900 font-mono mt-1">{formatAED(customerTotals.egg.actual)}</p>
                <div className="flex justify-between text-[11px] text-gray-600 mt-1">
                  <span>Budget: {formatAED(customerTotals.egg.budget)}</span>
                  <span className="font-bold text-emerald-700">Margin: {formatAED(customerTotals.egg.margin)}</span>
                </div>
              </div>
              <div className="w-full bg-amber-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, customerTotals.egg.achieved)}%` }} />
              </div>
            </div>

            <div className="card p-4 bg-blue-50/40 border border-blue-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">🌾 Ingredients (Ing)</span>
                <p className="text-lg font-extrabold text-gray-900 font-mono mt-1">{formatAED(customerTotals.ing.actual)}</p>
                <div className="flex justify-between text-[11px] text-gray-600 mt-1">
                  <span>Budget: {formatAED(customerTotals.ing.budget)}</span>
                  <span className="font-bold text-emerald-700">Margin: {formatAED(customerTotals.ing.margin)}</span>
                </div>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, customerTotals.ing.achieved)}%` }} />
              </div>
            </div>

            <div className="card p-4 bg-violet-50/40 border border-violet-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-violet-900 uppercase tracking-wider">🍫 Finished Goods (FG)</span>
                <p className="text-lg font-extrabold text-gray-900 font-mono mt-1">{formatAED(customerTotals.fg.actual)}</p>
                <div className="flex justify-between text-[11px] text-gray-600 mt-1">
                  <span>Budget: {formatAED(customerTotals.fg.budget)}</span>
                  <span className="font-bold text-emerald-700">Margin: {formatAED(customerTotals.fg.margin)}</span>
                </div>
              </div>
              <div className="w-full bg-violet-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-violet-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, customerTotals.fg.achieved)}%` }} />
              </div>
            </div>
          </div>

          {/* SKU-Level Matrix for this Account */}
          <div className="card p-5 bg-white border border-gray-200 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-indigo-600" />
                <h3 className="text-sm font-bold text-gray-900">SKU Line Breakdown ({currentCustomer.customer_name})</h3>
              </div>

              {/* Slicers */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  value={itemCatFilter}
                  onChange={(e) => setItemCatFilter(e.target.value)}
                  className="py-1.5 px-3 rounded-lg border border-gray-200 bg-white font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ALL">All Item Categories</option>
                  {customerItemCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search SKU or item..."
                    value={customerSkuSearch}
                    onChange={(e) => setCustomerSkuSearch(e.target.value)}
                    className="pl-7 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36"
                  />
                </div>
                <ExportExcelButton
                  data={filteredCustomerItems.map((item) => ({
                    "SKU Code": item.sku,
                    "Item Description": item.name,
                    "Category": item.item_category,
                    "Category Tag": item.category_tag,
                    "Packaging Unit": item.item_packaging,
                    "2026 Budget Qty": item.budget_qty_2026,
                    "2026 Actual Qty": item.actual_qty_2026,
                    "2026 Budget (AED)": item.sales_2026_budget,
                    "2026 Actual (AED)": item.sales_2026_actual,
                    "Achievement %": Number(((item.sales_2026_actual / item.sales_2026_budget) * 100).toFixed(1)),
                    "Actual Margin (AED)": item.margin_2026_actual,
                  }))}
                  filename={`${currentCustomer.customer_name.replace(/[^a-zA-Z0-9_-]/g, "_")}-SKU-Breakdown`}
                  sheetName="Customer SKUs"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-600 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">SKU Code</th>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3">Item Category</th>
                    <th className="py-2.5 px-2 text-center">Tag</th>
                    <th className="py-2.5 px-3">Item Packaging</th>
                    <th className="py-2.5 px-3 text-right">Budget Qty</th>
                    <th className="py-2.5 px-3 text-right">Actual Qty</th>
                    <th className="py-2.5 px-3 text-right">2026 Budget</th>
                    <th className="py-2.5 px-3 text-right">2026 Actual</th>
                    <th className="py-2.5 px-3 text-center">Achieved %</th>
                    <th className="py-2.5 px-3 text-right">Actual Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustomerItems.map((item) => {
                    const achievedPct = item.sales_2026_budget > 0 ? (item.sales_2026_actual / item.sales_2026_budget) * 100 : 0;
                    const tagStyles = {
                      Egg: "bg-amber-100 text-amber-900 border-amber-200",
                      Ing: "bg-blue-100 text-blue-900 border-blue-200",
                      FG: "bg-violet-100 text-violet-900 border-violet-200",
                    }[item.category_tag];

                    return (
                      <tr key={item.sku} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{item.sku}</td>
                        <td className="py-2.5 px-3 font-bold text-gray-900">{item.name}</td>
                        <td className="py-2.5 px-3 text-gray-600">{item.item_category}</td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase border ${tagStyles}`}>
                            {item.category_tag}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-gray-500">{item.item_packaging}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-500">{item.budget_qty_2026.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-800">{item.actual_qty_2026.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-600">{formatAED(item.sales_2026_budget)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-extrabold text-gray-900">{formatAED(item.sales_2026_actual)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-extrabold ${
                              achievedPct >= 90 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {formatPct(achievedPct)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">{formatAED(item.margin_2026_actual)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
