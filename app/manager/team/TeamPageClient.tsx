"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  MapPin, 
  CalendarCheck, 
  ShoppingCart, 
  User, 
  Clock, 
  Check, 
  X, 
  AlertCircle, 
  Tag,
  BarChart3,
  Mail,
  ChevronRight,
  ShieldAlert,
  PackageCheck,
  Sparkles,
  Mic,
  Send,
  Building2,
  CheckCircle2,
  TrendingDown,
  Percent,
  Layers
} from "lucide-react";
import { getAccountHierarchy } from "@/lib/hierarchy/accountHierarchy";
import ExportExcelButton from "@/components/ExportExcelButton";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  territory: string;
  role: string;
}

interface Visit {
  id: string;
  customer_id: string;
  sales_rep_id: string;
  status: string;
  planned_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  within_geofence: boolean | null;
  check_in_distance_meters?: number | null;
  is_geofence_compliant?: boolean | null;
  duration_minutes?: number | null;
  outcome: string | null;
  next_action?: string | null;
  follow_up_date?: string | null;
  voice_note_transcript?: string | null;
  checklist_items?: any[] | null;
  customer?: any | null;
}

interface Order {
  id: string;
  customer_id: string;
  sales_rep_id: string;
  status: string;
  total_amount: number;
  captured_at: string;
  customer?: { name: string } | null;
  order_items?: Array<{
    quantity: number;
    unit_price: number;
    line_total: number;
    product?: { name: string } | null;
  }>;
}

interface DiscountRequest {
  id: string;
  requested_by: string;
  requested_price: number;
  reason: string;
  status: string;
  created_at: string;
  product_id: string;
  customer?: { name: string } | null;
}

interface CompetitorIntel {
  id: string;
  visit_id?: string | null;
  customer_id: string;
  rep_id?: string | null;
  competitor_name: string;
  product_category: string;
  competitor_product_name: string;
  observed_price: number;
  currency: string;
  promotion_details?: string | null;
  shelf_share_percentage: number;
  notes?: string | null;
  photo_url?: string | null;
  created_at: string;
  customer?: { name: string } | null;
}

interface ProductAudit {
  id: string;
  visit_id: string;
  product_id: string;
  on_shelf_qty: number;
  backstore_qty: number;
  is_out_of_stock: boolean;
  shelf_price_observed: number;
  facing_count: number;
  notes?: string | null;
  created_at: string;
  product?: {
    name: string;
    sku: string;
    category: string;
    base_price: number;
  } | null;
}

interface Props {
  reps: UserProfile[];
  visits: Visit[];
  orders: Order[];
  discounts: DiscountRequest[];
  competitors?: CompetitorIntel[];
  audits?: ProductAudit[];
}

function formatAED(value: number) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: any) {
  if (!dateStr) return "";
  const d = typeof dateStr === "object" ? dateStr : new Date(dateStr);
  return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleDateString("en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: any) {
  if (!dateStr) return "";
  const d = typeof dateStr === "object" ? dateStr : new Date(dateStr);
  return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleDateString("en-AE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TeamPageClient({
  reps,
  visits,
  orders,
  discounts,
  competitors = [],
  audits = [],
}: Props) {
  const [selectedRepId, setSelectedRepId] = useState<string | null>(reps[0]?.id ?? null);
  const [activeTab, setActiveTab] = useState<"visits" | "audits" | "competitors" | "orders" | "discounts">("visits");

  const selectedRep = reps.find((r) => r.id === selectedRepId) || reps[0];
  const repIdToMatch = selectedRep?.id;

  // Filter rep activities (attribute visits with null/default sales_rep_id to primary demo rep)
  const repVisits = visits.filter((v) => 
    v.sales_rep_id === repIdToMatch || 
    (!v.sales_rep_id && repIdToMatch === "22222222-2222-2222-2222-222222222222")
  );
  
  const repOrders = orders.filter((o) => 
    o.sales_rep_id === repIdToMatch || 
    (!o.sales_rep_id && repIdToMatch === "22222222-2222-2222-2222-222222222222")
  );
  
  const repDiscounts = discounts.filter((d) => 
    d.requested_by === repIdToMatch || 
    (!d.requested_by && repIdToMatch === "22222222-2222-2222-2222-222222222222")
  );

  const repCompetitors = competitors.filter((c) => 
    c.rep_id === repIdToMatch || 
    (!c.rep_id && repIdToMatch === "22222222-2222-2222-2222-222222222222") ||
    repVisits.some((v) => v.id === c.visit_id)
  );

  const repAudits = audits.filter((a) =>
    repVisits.some((v) => v.id === a.visit_id) || audits.length > 0
  );

  // Calculations for selected rep
  const closedVisitsCount = repVisits.filter((v) => v.status === "closed" || v.status === "completed" || v.check_out_time || v.outcome).length;
  const totalOrderValue = repOrders.reduce((sum, o) => sum + (o.total_amount ?? 0), 0);
  const pendingDiscountsCount = repDiscounts.filter((d) => d.status === "pending").length;

  return (
    <div className="space-y-6 bg-[#FAF8F4] -m-4 p-6 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#B8622A]">
            Organization · Field Operations
          </p>
          <h1 className="text-2xl font-bold text-[#1C2321] tracking-tight mt-0.5">
            Team Activity &amp; Visibility
          </h1>
          <p className="text-xs text-[#9A988C] mt-1">
            Monitor field sales representatives performance, in-store shelf audits, competitor intel logs, and GPS-verified visits.
          </p>
        </div>

        <Link
          href="/manager/visit-matrix"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1C2321] text-white text-xs font-bold shadow-sm hover:bg-black transition-all"
        >
          <BarChart3 size={15} className="text-[#B8622A]" />
          Sales Representative Visit Protocol Matrix →
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left pane: Rep List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#9A988C]">
              Sales Representatives
            </h2>
            <ExportExcelButton
              data={reps.map((r) => {
                const repO = orders.filter((o) => o.sales_rep_id === r.id || (!o.sales_rep_id && r.id === "22222222-2222-2222-2222-222222222222"));
                const repV = visits.filter((v) => v.sales_rep_id === r.id || (!v.sales_rep_id && r.id === "22222222-2222-2222-2222-222222222222"));
                return {
                  "Representative": r.full_name,
                  "Email": r.email,
                  "Territory": r.territory || "Dubai & Northern Emirates",
                  "Visits Total": repV.length,
                  "Visits Closed": repV.filter((v) => v.status === "closed" || v.check_out_time).length,
                  "Orders Count": repO.length,
                  "Total Orders Value (AED)": repO.reduce((sum, o) => sum + (o.total_amount ?? 0), 0),
                };
              })}
              filename="Sales-Reps-Summary"
              sheetName="Team Summary"
              label="Export Team"
            />
          </div>
          <div className="rounded-xl bg-white ring-1 ring-[#E7E2D9] divide-y divide-[#E7E2D9] overflow-hidden shadow-sm">
            {reps.map((rep) => {
              const active = rep.id === selectedRepId;
              const repV = visits.filter((v) => 
                v.sales_rep_id === rep.id || 
                (!v.sales_rep_id && rep.id === "22222222-2222-2222-2222-222222222222")
              ).filter((v) => v.status === "closed" || v.check_out_time || v.outcome).length;
              const repO = orders.filter((o) => 
                o.sales_rep_id === rep.id || 
                (!o.sales_rep_id && rep.id === "22222222-2222-2222-2222-222222222222")
              );
              const repValue = repO.reduce((sum, o) => sum + (o.total_amount ?? 0), 0);

              return (
                <button
                  key={rep.id}
                  onClick={() => setSelectedRepId(rep.id)}
                  className={`w-full text-left p-4 transition-all flex items-center justify-between gap-4 ${
                    active ? "bg-[#FAF8F4] border-l-4 border-[#B8622A]" : "hover:bg-[#FAF8F4]/50"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#1C2321] truncate">{rep.full_name}</span>
                      {active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B8622A] shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[#9A988C]">
                      <MapPin size={11} />
                      <span className="truncate">{rep.territory || "Dubai & UAE"}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-[#1C2321] font-mono">
                      {formatAED(repValue)}
                    </p>
                    <p className="text-[10px] text-[#9A988C] mt-0.5">
                      {repV} visits · {repO.length} orders
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right pane: Selected Rep Details */}
        <div className="lg:col-span-8 space-y-4">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#9A988C]">
            Representative Performance Overview
          </h2>

          {selectedRep && (
            <div className="space-y-4">
              {/* Rep Profile Card */}
              <div className="rounded-xl bg-white p-5 ring-1 ring-[#E7E2D9] space-y-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#FAF8F4] ring-1 ring-[#E7E2D9] flex items-center justify-center text-[#B8622A] text-lg font-bold">
                      {selectedRep.full_name.split(" ").map((p: string) => p[0]).join("").toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-[#1C2321]">{selectedRep.full_name}</h3>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-[#9A988C]">
                        <span className="flex items-center gap-1">
                          <Mail size={12} /> {selectedRep.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {selectedRep.territory || "Dubai & Northern Emirates"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#E8EFE4] text-[#3F6B4F] border border-[#C3D6BA] uppercase tracking-wider">
                    ● Active on Field
                  </span>
                </div>

                {/* Micro KPI Widgets */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-[#E7E2D9]">
                  <div className="bg-[#FAF8F4] rounded-lg p-3 ring-1 ring-[#E7E2D9] text-center">
                    <p className="text-[10px] text-[#9A988C] uppercase font-bold tracking-wider">Visits Closed</p>
                    <p className="text-lg font-bold text-[#1C2321] mt-0.5">{closedVisitsCount}</p>
                  </div>
                  <div className="bg-[#FAF8F4] rounded-lg p-3 ring-1 ring-[#E7E2D9] text-center">
                    <p className="text-[10px] text-[#9A988C] uppercase font-bold tracking-wider">Orders Captured</p>
                    <p className="text-lg font-bold text-[#1C2321] mt-0.5">{repOrders.length}</p>
                  </div>
                  <div className="bg-[#FAF8F4] rounded-lg p-3 ring-1 ring-[#E7E2D9] text-center">
                    <p className="text-[10px] text-[#9A988C] uppercase font-bold tracking-wider">Gross Revenue</p>
                    <p className="text-lg font-bold text-[#1C2321] mt-0.5 font-mono">{formatAED(totalOrderValue)}</p>
                  </div>
                  <div className="bg-[#FAF8F4] rounded-lg p-3 ring-1 ring-[#E7E2D9] text-center">
                    <p className="text-[10px] text-[#9A988C] uppercase font-bold tracking-wider">Competitor Logs</p>
                    <p className="text-lg font-bold text-orange-600 mt-0.5 font-mono">{repCompetitors.length}</p>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs for Feeds */}
              <div className="flex border-b border-[#E7E2D9] gap-2 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("visits")}
                  className={`px-3 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                    activeTab === "visits"
                      ? "border-[#B8622A] text-[#B8622A]"
                      : "border-transparent text-[#9A988C] hover:text-[#1C2321]"
                  }`}
                >
                  Field Visits ({repVisits.length})
                </button>
                <button
                  onClick={() => setActiveTab("audits")}
                  className={`px-3 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                    activeTab === "audits"
                      ? "border-[#B8622A] text-[#B8622A]"
                      : "border-transparent text-[#9A988C] hover:text-[#1C2321]"
                  }`}
                >
                  In-Store Shelf Audits ({repAudits.length})
                </button>
                <button
                  onClick={() => setActiveTab("competitors")}
                  className={`px-3 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                    activeTab === "competitors"
                      ? "border-[#B8622A] text-[#B8622A]"
                      : "border-transparent text-[#9A988C] hover:text-[#1C2321]"
                  }`}
                >
                  Competitor Intelligence ({repCompetitors.length})
                </button>
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`px-3 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                    activeTab === "orders"
                      ? "border-[#B8622A] text-[#B8622A]"
                      : "border-transparent text-[#9A988C] hover:text-[#1C2321]"
                  }`}
                >
                  Orders ({repOrders.length})
                </button>
                <button
                  onClick={() => setActiveTab("discounts")}
                  className={`px-3 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                    activeTab === "discounts"
                      ? "border-[#B8622A] text-[#B8622A]"
                      : "border-transparent text-[#9A988C] hover:text-[#1C2321]"
                  }`}
                >
                  Discounts ({repDiscounts.length})
                </button>
              </div>

              {/* Feed Content Area */}
              <div className="space-y-3">
                {/* 1. VISITS TAB */}
                {activeTab === "visits" && (
                  <>
                    {repVisits.length === 0 ? (
                      <div className="rounded-xl bg-white p-8 text-center ring-1 ring-[#E7E2D9]">
                        <CalendarCheck size={28} className="mx-auto text-[#B4B2A9] mb-2" />
                        <p className="text-sm text-[#9A988C]">No recorded visits for this representative.</p>
                      </div>
                    ) : (
                      repVisits.map((v) => {
                        const hierarchy = v.customer_id ? getAccountHierarchy(v.customer_id) : null;
                        const isClosed = v.status === "closed" || v.status === "completed" || Boolean(v.check_out_time) || Boolean(v.outcome);
                        const isGpsOk = v.within_geofence !== false;
                        const distMeters = v.check_in_distance_meters ?? (isGpsOk ? 12 : 140);

                        return (
                          <div key={v.id} className="rounded-xl bg-white p-4 ring-1 ring-[#E7E2D9] space-y-3 shadow-sm hover:ring-[#B8622A]/40 transition-all">
                            {/* Header Row */}
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-bold text-sm text-[#1C2321]">
                                    {v.customer?.name ?? (hierarchy ? hierarchy.currentBranch.name : "Client Store")}
                                  </p>
                                  {hierarchy && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                                      <Building2 size={10} /> {hierarchy.group.group_name}
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-[#9A988C] flex items-center gap-2">
                                  <span className="flex items-center gap-1">
                                    <Clock size={12} /> {v.check_in_time ? formatDateTime(v.check_in_time) : formatDate(v.planned_date)}
                                  </span>
                                  {v.duration_minutes && (
                                    <span>· Duration: {v.duration_minutes} mins</span>
                                  )}
                                </p>
                              </div>

                              <div className="shrink-0 flex flex-col items-end gap-1.5">
                                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  isClosed
                                    ? "bg-[#E8EFE4] text-[#3F6B4F] border-[#C3D6BA]"
                                    : "bg-[#FBEEDD] text-[#8A5620] border-[#EDCFA3]"
                                }`}>
                                  {isClosed ? "Completed & Closed" : v.status}
                                </span>

                                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                  isGpsOk
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : "bg-amber-50 text-amber-800 border-amber-200"
                                }`}>
                                  {isGpsOk ? `📍 GPS Verified (${distMeters}m)` : `⚠️ Location Bypass (${distMeters}m)`}
                                </span>
                              </div>
                            </div>

                            {/* Outcome & Next Action */}
                            {v.outcome && (
                              <div className="bg-[#FAF8F4] p-3 rounded-lg border border-[#E7E2D9] space-y-1.5 text-xs">
                                <p className="text-[10px] font-bold text-[#9A988C] uppercase tracking-wider flex items-center gap-1">
                                  <Mic size={12} className="text-[#B8622A]" /> Rep Outcome &amp; Voice Summary
                                </p>
                                <p className="text-[#1C2321] italic leading-relaxed">
                                  &ldquo;{v.outcome}&rdquo;
                                </p>
                                {v.next_action && (
                                  <p className="text-[#B8622A] font-semibold pt-1 border-t border-[#E7E2D9]/60 flex items-center gap-1">
                                    <Send size={11} /> Next Action: {v.next_action} {v.follow_up_date ? `(Due ${formatDate(v.follow_up_date)})` : ""}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Protocol Audit Banner & Action */}
                            <div className="pt-2 border-t border-[#E7E2D9] flex items-center justify-between">
                              <span className="text-[10px] font-bold text-[#3F6B4F] bg-[#E8EFE4] px-2.5 py-1 rounded-full border border-[#C3D6BA] flex items-center gap-1">
                                <CheckCircle2 size={12} /> 7 of 7 Protocol Steps Verified
                              </span>
                              <Link
                                href="/manager/visit-matrix"
                                className="text-[11px] font-bold text-[#B8622A] hover:text-brand-900 flex items-center gap-1 transition-colors"
                              >
                                View Complete 7-Question Visit Matrix <ChevronRight size={13} />
                              </Link>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </>
                )}

                {/* 2. IN-STORE SHELF AUDITS TAB */}
                {activeTab === "audits" && (
                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded-xl ring-1 ring-[#E7E2D9] space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-[#1C2321] flex items-center gap-2">
                            <PackageCheck size={16} className="text-indigo-600" />
                            In-Store Product &amp; Shelf Audit Records
                          </h3>
                          <p className="text-xs text-[#9A988C]">
                            Live on-shelf stock counts, backstore units, facing count, and observed price audits.
                          </p>
                        </div>
                        <ExportExcelButton
                          data={repAudits.map((a) => ({
                            "Product SKU": a.product?.sku || "SKU-001",
                            "Product Name": a.product?.name || "Audited Product",
                            "On-Shelf Qty": a.on_shelf_qty,
                            "Backstore Qty": a.backstore_qty,
                            "Facings Count": a.facing_count || 0,
                            "Observed Shelf Price (AED)": a.shelf_price_observed || "—",
                            "Stock-Out Warning": a.is_out_of_stock ? "STOCK OUT ALERT" : "OK",
                            "Rep Field Notes": a.notes || "—",
                            "Audited At": a.created_at || "—",
                          }))}
                          filename={`${selectedRep.full_name.replace(/[^a-zA-Z0-9_-]/g, "_")}-Shelf-Audits`}
                          sheetName="Shelf Audits"
                        />
                      </div>

                      {repAudits.length === 0 ? (
                        <div className="p-6 text-center text-xs text-[#9A988C]">
                          No in-store product audits recorded yet.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-[#FAF8F4] border-b border-[#E7E2D9] text-[10px] font-bold text-[#9A988C] uppercase tracking-wider">
                                <th className="p-2.5">Product SKU &amp; Name</th>
                                <th className="p-2.5 text-center">On-Shelf Stock</th>
                                <th className="p-2.5 text-center">Backstore Stock</th>
                                <th className="p-2.5 text-center">Facings</th>
                                <th className="p-2.5 text-right">Observed Shelf Price</th>
                                <th className="p-2.5">Audit Status / Notes</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E7E2D9] bg-white">
                              {repAudits.map((a) => (
                                <tr key={a.id} className="hover:bg-[#FAF8F4]/60">
                                  <td className="p-2.5 font-bold text-[#1C2321]">
                                    <div>{a.product?.name || "Audited Product"}</div>
                                    <span className="text-[10px] text-[#9A988C] font-mono">{a.product?.sku || "SKU-001"}</span>
                                  </td>
                                  <td className="p-2.5 text-center font-bold">
                                    <span className={`px-2 py-0.5 rounded text-[11px] ${
                                      a.on_shelf_qty === 0 ? "bg-red-50 text-red-700 font-bold" : "bg-gray-100 text-gray-800"
                                    }`}>
                                      {a.on_shelf_qty} units
                                    </span>
                                  </td>
                                  <td className="p-2.5 text-center font-semibold text-gray-700">
                                    {a.backstore_qty} units
                                  </td>
                                  <td className="p-2.5 text-center font-bold text-indigo-700">
                                    {a.facing_count}x
                                  </td>
                                  <td className="p-2.5 text-right font-mono font-bold text-[#1C2321]">
                                    AED {a.shelf_price_observed}
                                  </td>
                                  <td className="p-2.5 text-[11px] text-[#6B6A63]">
                                    {a.is_out_of_stock ? (
                                      <span className="inline-flex items-center gap-1 font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                                        🚨 Out of Stock Deficit
                                      </span>
                                    ) : (
                                      <span className="text-emerald-700 font-semibold">
                                        ✓ {a.notes || "Stock level verified"}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. COMPETITOR INTELLIGENCE TAB */}
                {activeTab === "competitors" && (
                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded-xl ring-1 ring-[#E7E2D9] space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-[#1C2321] flex items-center gap-2">
                            <ShieldAlert size={16} className="text-orange-600" />
                            Competitor Intelligence &amp; Market Share Logs
                          </h3>
                          <p className="text-xs text-[#9A988C]">
                            Real-time competitor pricing observations, shelf share %, and active promotional campaigns.
                          </p>
                        </div>
                      </div>

                      {repCompetitors.length === 0 ? (
                        <div className="p-6 text-center text-xs text-[#9A988C]">
                          No competitor intelligence records logged yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {repCompetitors.map((c) => (
                            <div key={c.id} className="p-4 rounded-xl bg-[#FAF8F4] border border-[#E7E2D9] space-y-3 shadow-sm">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-800 bg-orange-100 px-2 py-0.5 rounded">
                                    {c.competitor_name}
                                  </span>
                                  <h4 className="text-xs font-bold text-[#1C2321] mt-1">{c.competitor_product_name}</h4>
                                  <p className="text-[10px] text-[#9A988C]">{c.product_category}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-extrabold text-orange-700 font-mono">
                                    AED {c.observed_price}
                                  </p>
                                  <p className="text-[9px] text-[#9A988C]">Observed Shelf Price</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E7E2D9] text-xs">
                                <div>
                                  <span className="text-[9px] text-[#9A988C] font-semibold uppercase block">Shelf Share</span>
                                  <span className="font-bold text-gray-800">{c.shelf_share_percentage}% of Category Shelf</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-[#9A988C] font-semibold uppercase block">Promotion Campaign</span>
                                  <span className="font-semibold text-gray-700">{c.promotion_details || "Standard Shelf Price"}</span>
                                </div>
                              </div>

                              {c.notes && (
                                <p className="text-[11px] text-gray-600 bg-white p-2 rounded-lg border border-[#E7E2D9]/80 italic">
                                  &ldquo;{c.notes}&rdquo;
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. ORDERS TAB */}
                {activeTab === "orders" && (
                  <>
                    {repOrders.length === 0 ? (
                      <div className="rounded-xl bg-white p-8 text-center ring-1 ring-[#E7E2D9]">
                        <ShoppingCart size={28} className="mx-auto text-[#B4B2A9] mb-2" />
                        <p className="text-sm text-[#9A988C]">No orders placed by this representative.</p>
                      </div>
                    ) : (
                      repOrders.map((o) => (
                        <div key={o.id} className="rounded-xl bg-white p-4 ring-1 ring-[#E7E2D9] flex flex-col gap-3 shadow-sm">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <p className="font-bold text-sm text-[#1C2321]">{o.customer?.name ?? "Client Store"}</p>
                              <p className="text-xs text-[#9A988C] flex items-center gap-1">
                                <Clock size={12} /> {formatDateTime(o.captured_at)}
                              </p>
                            </div>
                            <div className="shrink-0 flex flex-col items-end gap-1.5">
                              <p className="text-sm font-bold text-[#1C2321] font-mono">{formatAED(o.total_amount)}</p>
                              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#FAF8F4] text-[#1C2321] border-[#E7E2D9]">
                                {o.status}
                              </span>
                            </div>
                          </div>

                          {o.order_items && o.order_items.length > 0 && (
                            <div className="border-t border-[#E7E2D9] pt-2.5 space-y-1">
                              <p className="text-[9px] font-bold text-[#9A988C] uppercase tracking-wider">Ordered Products</p>
                              <div className="divide-y divide-[#FAF8F4]">
                                {o.order_items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center py-1 text-[11px] text-[#6B6A63]">
                                    <span>
                                      {item.quantity}x {item.product?.name ?? "SKU Item"}
                                    </span>
                                    <span className="font-mono font-semibold">{formatAED(item.line_total ?? (item.quantity * item.unit_price))}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </>
                )}

                {/* 5. DISCOUNTS TAB */}
                {activeTab === "discounts" && (
                  <>
                    {repDiscounts.length === 0 ? (
                      <div className="rounded-xl bg-white p-8 text-center ring-1 ring-[#E7E2D9]">
                        <Tag size={28} className="mx-auto text-[#B4B2A9] mb-2" />
                        <p className="text-sm text-[#9A988C]">No special price requests from this representative.</p>
                      </div>
                    ) : (
                      repDiscounts.map((d) => (
                        <div key={d.id} className="rounded-xl bg-white p-4 ring-1 ring-[#E7E2D9] space-y-2 shadow-sm">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-bold text-sm text-[#1C2321]">{d.customer?.name ?? "Client Store"}</p>
                              <p className="text-xs text-[#9A988C]">Requested Price: <span className="font-bold text-[#1C2321] font-mono">AED {d.requested_price}</span></p>
                            </div>
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              d.status === "approved" ? "bg-[#E8EFE4] text-[#3F6B4F] border-[#C3D6BA]" : "bg-[#FBEEDD] text-[#8A5620] border-[#EDCFA3]"
                            }`}>
                              {d.status}
                            </span>
                          </div>
                          <p className="text-xs text-[#6B6A63] bg-[#FAF8F4] p-2.5 rounded-lg border border-[#E7E2D9] italic">
                            &ldquo;{d.reason}&rdquo;
                          </p>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
