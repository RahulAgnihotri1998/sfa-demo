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
  ChevronRight
} from "lucide-react";

interface User {
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
  within_geofence: boolean | null;
  outcome: string | null;
  customer?: { name: string } | null;
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

interface Props {
  reps: User[];
  visits: Visit[];
  orders: Order[];
  discounts: DiscountRequest[];
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

export default function TeamPageClient({ reps, visits, orders, discounts }: Props) {
  const [selectedRepId, setSelectedRepId] = useState<string | null>(reps[0]?.id ?? null);
  const [activeTab, setActiveTab] = useState<"visits" | "orders" | "discounts">("visits");

  const selectedRep = reps.find((r) => r.id === selectedRepId);

  // Filter rep activities
  const repVisits = visits.filter((v) => v.sales_rep_id === selectedRepId);
  const repOrders = orders.filter((o) => o.sales_rep_id === selectedRepId);
  const repDiscounts = discounts.filter((d) => d.requested_by === selectedRepId);

  // Calculations for selected rep
  const closedVisitsCount = repVisits.filter((v) => v.status === "closed").length;
  const totalOrderValue = repOrders.reduce((sum, o) => sum + (o.total_amount ?? 0), 0);
  const pendingDiscountsCount = repDiscounts.filter((d) => d.status === "pending").length;

  return (
    <div className="space-y-6 bg-[#FAF8F4] -m-4 p-6 min-h-screen">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#B8622A]">
          Organization
        </p>
        <h1 className="text-xl font-bold text-[#1C2321] tracking-tight mt-0.5">
          Team Activity & Visibility
        </h1>
        <p className="text-xs text-[#9A988C] mt-1">
          Monitor representatives performance, geo-fenced client visits, and orders flow.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left pane: Rep List */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#9A988C]">
            Sales Representatives
          </h2>
          <div className="rounded-md bg-white ring-1 ring-[#E7E2D9] divide-y divide-[#E7E2D9] overflow-hidden shadow-sm">
            {reps.map((rep) => {
              const active = rep.id === selectedRepId;
              const repV = visits.filter((v) => v.sales_rep_id === rep.id && v.status === "closed").length;
              const repO = orders.filter((o) => o.sales_rep_id === rep.id);
              const repValue = repO.reduce((sum, o) => sum + (o.total_amount ?? 0), 0);

              return (
                <button
                  key={rep.id}
                  onClick={() => setSelectedRepId(rep.id)}
                  className={`w-full text-left p-4 transition-colors flex items-center justify-between gap-4 ${
                    active ? "bg-[#FAF8F4]" : "hover:bg-[#FAF8F4]/50"
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
                      <span className="truncate">{rep.territory}</span>
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
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#9A988C]">
            Performance Visibility
          </h2>

          {selectedRep ? (
            <div className="space-y-4">
              {/* Rep Profile Card */}
              <div className="rounded-md bg-white p-5 ring-1 ring-[#E7E2D9] space-y-4 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-sm bg-[#FAF8F4] ring-1 ring-[#E7E2D9] flex items-center justify-center text-[#B8622A] text-lg font-bold">
                    {selectedRep.full_name.split(" ").map(p => p[0]).join("").toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-[#1C2321]">{selectedRep.full_name}</h3>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-[#9A988C]">
                      <span className="flex items-center gap-1">
                        <Mail size={12} /> {selectedRep.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {selectedRep.territory}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Micro KPI Widgets */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#E7E2D9]">
                  <div className="bg-[#FAF8F4] rounded-sm p-3 ring-1 ring-[#E7E2D9] text-center">
                    <p className="text-[10px] text-[#9A988C] uppercase font-bold tracking-wider">Visits</p>
                    <p className="text-lg font-bold text-[#1C2321] mt-0.5">{closedVisitsCount}</p>
                  </div>
                  <div className="bg-[#FAF8F4] rounded-sm p-3 ring-1 ring-[#E7E2D9] text-center">
                    <p className="text-[10px] text-[#9A988C] uppercase font-bold tracking-wider">Orders</p>
                    <p className="text-lg font-bold text-[#1C2321] mt-0.5">{repOrders.length}</p>
                  </div>
                  <div className="bg-[#FAF8F4] rounded-sm p-3 ring-1 ring-[#E7E2D9] text-center">
                    <p className="text-[10px] text-[#9A988C] uppercase font-bold tracking-wider">Revenue</p>
                    <p className="text-lg font-bold text-[#1C2321] mt-0.5 font-mono">{formatAED(totalOrderValue)}</p>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs for Feeds */}
              <div className="flex border-b border-[#E7E2D9] gap-2">
                <button
                  onClick={() => setActiveTab("visits")}
                  className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                    activeTab === "visits"
                      ? "border-[#B8622A] text-[#B8622A]"
                      : "border-transparent text-[#9A988C] hover:text-[#1C2321]"
                  }`}
                >
                  Visits ({repVisits.length})
                </button>
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                    activeTab === "orders"
                      ? "border-[#B8622A] text-[#B8622A]"
                      : "border-transparent text-[#9A988C] hover:text-[#1C2321]"
                  }`}
                >
                  Orders ({repOrders.length})
                </button>
                <button
                  onClick={() => setActiveTab("discounts")}
                  className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                    activeTab === "discounts"
                      ? "border-[#B8622A] text-[#B8622A]"
                      : "border-transparent text-[#9A988C] hover:text-[#1C2321]"
                  }`}
                >
                  Discounts ({repDiscounts.length})
                </button>
              </div>

              {/* Feed Content Area */}
              <div className="space-y-2">
                {activeTab === "visits" && (
                  <>
                    {repVisits.length === 0 ? (
                      <div className="rounded-md bg-white p-8 text-center ring-1 ring-[#E7E2D9]">
                        <CalendarCheck size={28} className="mx-auto text-[#B4B2A9] mb-2" />
                        <p className="text-sm text-[#9A988C]">No recorded visits for this representative.</p>
                      </div>
                    ) : (
                      repVisits.map((v) => (
                        <div key={v.id} className="rounded-md bg-white p-4 ring-1 ring-[#E7E2D9] space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <p className="font-bold text-sm text-[#1C2321]">{v.customer?.name ?? "Unknown Customer"}</p>
                              <p className="text-xs text-[#9A988C] flex items-center gap-1">
                                <Clock size={12} /> {v.check_in_time ? formatDateTime(v.check_in_time) : formatDate(v.planned_date)}
                              </p>
                              {v.outcome && (
                                <p className="text-xs text-[#6B6A63] mt-2 italic bg-[#FAF8F4] p-2.5 rounded-sm border border-[#E7E2D9]">
                                  &ldquo;{v.outcome}&rdquo;
                                </p>
                              )}
                            </div>
                            <div className="shrink-0 flex flex-col items-end gap-1.5">
                              <span className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                v.status === "closed"
                                  ? "bg-[#E8EFE4] text-[#3F6B4F] border-[#C3D6BA]"
                                  : "bg-[#FBEEDD] text-[#8A5620] border-[#EDCFA3]"
                              }`}>
                                {v.status}
                              </span>
                              {v.status === "closed" && (
                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm ${
                                  v.within_geofence
                                    ? "bg-[#E8EFE4] text-[#3F6B4F]"
                                    : "bg-[#F7E7E3] text-[#A23B2E]"
                                }`}>
                                  {v.within_geofence ? "📍 GPS Verified" : "⚠️ Out of radius"}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-[#E7E2D9] flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#3F6B4F] bg-[#E8EFE4] px-2 py-0.5 rounded-sm">
                              7 of 7 Protocol Steps Audit Passed
                            </span>
                            <Link
                              href="/manager/visit-matrix"
                              className="text-[11px] font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1"
                            >
                              📋 Audit 7-Question Visit Matrix <ChevronRight size={13} />
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {activeTab === "orders" && (
                  <>
                    {repOrders.length === 0 ? (
                      <div className="rounded-md bg-white p-8 text-center ring-1 ring-[#E7E2D9]">
                        <ShoppingCart size={28} className="mx-auto text-[#B4B2A9] mb-2" />
                        <p className="text-sm text-[#9A988C]">No orders placed by this representative.</p>
                      </div>
                    ) : (
                      repOrders.map((o) => (
                        <div key={o.id} className="rounded-md bg-white p-4 ring-1 ring-[#E7E2D9] flex flex-col gap-3 shadow-sm">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <p className="font-bold text-sm text-[#1C2321]">{o.customer?.name ?? "Unknown Customer"}</p>
                              <p className="text-xs text-[#9A988C] flex items-center gap-1">
                                <Clock size={12} /> {formatDateTime(o.captured_at)}
                              </p>
                            </div>
                            <div className="shrink-0 flex flex-col items-end gap-1.5">
                              <p className="text-sm font-bold text-[#1C2321] font-mono">{formatAED(o.total_amount)}</p>
                              <span className="inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#FAF8F4] text-[#1C2321] border-[#E7E2D9]">
                                {o.status}
                              </span>
                            </div>
                          </div>

                          {o.order_items && o.order_items.length > 0 && (
                            <div className="border-t border-[#E7E2D9] pt-2.5 space-y-1">
                              <p className="text-[9px] font-bold text-[#9A988C] uppercase tracking-wider">Sold Products</p>
                              <div className="divide-y divide-[#FAF8F4]">
                                {o.order_items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center py-1 text-[11px] text-[#6B6A63]">
                                    <span>
                                      {item.product?.name ?? "Product"} <span className="text-[#9A988C]">x{item.quantity}</span>
                                    </span>
                                    <span className="font-mono text-[#1C2321]">
                                      {formatAED(item.line_total || (item.quantity * item.unit_price))}
                                    </span>
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

                {activeTab === "discounts" && (
                  <>
                    {repDiscounts.length === 0 ? (
                      <div className="rounded-md bg-white p-8 text-center ring-1 ring-[#E7E2D9]">
                        <Tag size={28} className="mx-auto text-[#B4B2A9] mb-2" />
                        <p className="text-sm text-[#9A988C]">No special pricing requests for this representative.</p>
                      </div>
                    ) : (
                      repDiscounts.map((d) => {
                        const productName = d.reason.match(/^\[Product:\s*([^\]]+)\]/)?.[1] ?? "Special Price";
                        const displayReason = d.reason.replace(/^\[Product:[^\]]+\]\s*/, "");

                        return (
                          <div key={d.id} className="rounded-md bg-white p-4 ring-1 ring-[#E7E2D9] flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <p className="font-bold text-sm text-[#1C2321]">{productName}</p>
                              {d.customer?.name && (
                                <p className="text-xs text-[#9A988C]">Client: {d.customer.name}</p>
                              )}
                              {displayReason && (
                                <p className="text-xs text-[#6B6A63] mt-2 italic bg-[#FAF8F4] p-2.5 rounded-sm border border-[#E7E2D9]">
                                  Reason: "{displayReason}"
                                </p>
                              )}
                              <p className="text-[10px] text-[#9A988C] mt-1">{formatDate(d.created_at)}</p>
                            </div>
                            <div className="shrink-0 flex flex-col items-end gap-1.5">
                              <p className="text-sm font-bold text-[#1C2321] font-mono">{formatAED(d.requested_price)}</p>
                              <span className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                d.status === "approved"
                                  ? "bg-[#E8EFE4] text-[#3F6B4F] border-[#C3D6BA]"
                                  : d.status === "rejected"
                                  ? "bg-[#F7E7E3] text-[#A23B2E] border-[#E4B8AC]"
                                  : "bg-[#FBEEDD] text-[#8A5620] border-[#EDCFA3]"
                              }`}>
                                {d.status}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-white p-12 text-center ring-1 ring-[#E7E2D9]">
              <User size={36} className="mx-auto text-[#B4B2A9] mb-3 animate-pulse" />
              <p className="text-sm text-[#1C2321] font-bold">No Representative Selected</p>
              <p className="text-xs text-[#9A988C] mt-1">Select a sales representative from the left pane to analyze their detailed activities and logs.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
