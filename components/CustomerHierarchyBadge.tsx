"use client";

import { useState } from "react";
import { 
  Building2, 
  Network, 
  ShieldCheck, 
  CreditCard, 
  ChevronRight, 
  Check, 
  MapPin, 
  Store,
  ExternalLink,
  ShoppingCart,
  CalendarCheck
} from "lucide-react";
import { 
  getAccountHierarchy, 
  HierarchyBranchNode,
  CorporateGroup 
} from "@/lib/hierarchy/accountHierarchy";
import Link from "next/link";

export interface HierarchyBranch {
  id: string;
  name: string;
  territory: string;
  is_current: boolean;
  credit_utilization: number;
}

export function CustomerHierarchyBadge({
  customerId = "c1111111-0000-0000-0000-000000000001",
  parentName,
  hierarchyLevel = "branch",
  creditScope = "consolidated_parent",
  groupCreditLimit,
  groupOutstanding,
  branches,
  onSwitchBranch,
  showActions = true,
}: {
  customerId?: string;
  parentName?: string;
  hierarchyLevel?: "headquarters" | "regional" | "branch";
  creditScope?: "individual" | "consolidated_parent";
  groupCreditLimit?: number;
  groupOutstanding?: number;
  branches?: HierarchyBranch[];
  onSwitchBranch?: (branchId: string) => void;
  showActions?: boolean;
}) {
  const [showModal, setShowModal] = useState(false);

  // Read rich hierarchy context
  const context = getAccountHierarchy(customerId);
  const activeGroup = context.group;
  const activeBranch = context.currentBranch;

  const displayParentName = parentName || activeGroup.group_name;
  const displayCreditLimit = groupCreditLimit ?? activeGroup.group_credit_limit;
  const displayOutstanding = groupOutstanding ?? activeGroup.group_outstanding;

  function formatAED(value: number) {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  const groupUtilPct = Math.round((displayOutstanding / displayCreditLimit) * 100);

  const displayBranches = branches || activeGroup.branches.map((b) => ({
    id: b.id,
    name: b.name,
    territory: b.territory,
    is_current: b.id === customerId,
    credit_utilization: b.credit_utilization_pct,
    address: b.address,
    code: b.code,
  }));

  return (
    <>
      <div 
        onClick={() => setShowModal(true)}
        className="rounded-xl bg-indigo-50/70 border border-indigo-200/80 p-2.5 flex items-center justify-between cursor-pointer hover:bg-indigo-50 transition-colors shadow-2xs group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Network size={15} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-indigo-950 uppercase tracking-wider">Account Hierarchy</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-200/70 text-indigo-900">
                {hierarchyLevel === "branch" ? "Branch Outlet" : "Corporate HQ"}
              </span>
              <span className="text-[9px] font-semibold text-gray-500 bg-white/80 px-1 rounded border border-indigo-100">
                {activeGroup.branches.length} Outlets
              </span>
            </div>
            <p className="text-xs font-bold text-gray-900 truncate max-w-[260px]">{displayParentName}</p>
          </div>
        </div>

        <div className="text-right flex items-center gap-1 text-indigo-700 shrink-0">
          <span className="text-[11px] font-bold hidden sm:inline">View Corporate Tree</span>
          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-gray-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="text-indigo-600" size={22} />
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Corporate Account Hierarchy</h3>
                  <p className="text-[11px] text-gray-500">{displayParentName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center text-xs font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Consolidated Credit Status */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-800 flex items-center gap-1.5">
                  <CreditCard size={14} className="text-indigo-600" />
                  Consolidated Group Credit
                </span>
                <span className={`font-extrabold ${groupUtilPct > 75 ? "text-amber-700" : "text-emerald-700"}`}>
                  {groupUtilPct}% Used
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    groupUtilPct > 75 ? "bg-amber-500" : "bg-indigo-600"
                  }`} 
                  style={{ width: `${Math.min(100, groupUtilPct)}%` }} 
                />
              </div>

              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>Used: <strong className="text-gray-800">{formatAED(displayOutstanding)}</strong></span>
                <span>Available: <strong className="text-emerald-700">{formatAED(Math.max(0, displayCreditLimit - displayOutstanding))}</strong></span>
                <span>Limit: <strong className="text-gray-800">{formatAED(displayCreditLimit)}</strong></span>
              </div>
            </div>

            {/* Branch Network */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Linked Outlets & Branches ({displayBranches.length})
                </p>
                <span className="text-[10px] text-indigo-600 font-semibold">Click to Switch Account</span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {displayBranches.map((b: any) => (
                  <div
                    key={b.id}
                    onClick={() => {
                      if (onSwitchBranch) {
                        onSwitchBranch(b.id);
                      }
                      setShowModal(false);
                    }}
                    className={`p-3 rounded-xl border flex flex-col gap-2 cursor-pointer transition-all ${
                      b.is_current
                        ? "border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-200"
                        : "border-gray-200 hover:bg-gray-50 hover:border-indigo-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-gray-900">{b.name}</p>
                        <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={10} className="text-gray-400" />
                          <span>{b.territory}</span>
                        </p>
                      </div>
                      {b.is_current ? (
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-indigo-600 text-white flex items-center gap-1 shrink-0">
                          <Check size={10} /> Active Outlet
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSwitchBranch) onSwitchBranch(b.id);
                            setShowModal(false);
                          }}
                          className="px-2.5 py-1 text-[9px] font-bold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-200 transition-colors shrink-0 cursor-pointer"
                        >
                          Switch Account →
                        </button>
                      )}
                    </div>

                    {showActions && !b.is_current && (
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2 text-[10px]">
                        <Link
                          href={`/rep/order/new?customer=${b.id}`}
                          onClick={() => setShowModal(false)}
                          className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 flex items-center gap-1"
                        >
                          <ShoppingCart size={10} /> Create Order
                        </Link>
                        <Link
                          href={`/rep/visit/${b.id}`}
                          onClick={() => setShowModal(false)}
                          className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 flex items-center gap-1"
                        >
                          <CalendarCheck size={10} /> Visit Outlet
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
