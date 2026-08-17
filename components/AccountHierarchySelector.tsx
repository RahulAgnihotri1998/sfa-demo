"use client";

import { useState, useMemo } from "react";
import { 
  Building2, 
  Network, 
  Search, 
  ChevronRight, 
  Check, 
  CreditCard, 
  MapPin, 
  Store, 
  Layers, 
  SlidersHorizontal,
  ChevronDown,
  ShieldCheck,
  Building,
  CheckCircle2
} from "lucide-react";
import { 
  CORPORATE_GROUPS, 
  CorporateGroup, 
  HierarchyBranchNode, 
  getAccountHierarchy,
  getAllHierarchyAccounts
} from "@/lib/hierarchy/accountHierarchy";

interface Props {
  selectedAccountId: string;
  onSelectAccount: (account: HierarchyBranchNode, group: CorporateGroup) => void;
  label?: string;
  showCreditDetails?: boolean;
}

export function AccountHierarchySelector({
  selectedAccountId,
  onSelectAccount,
  label = "Customer Account & Hierarchy",
  showCreditDetails = true,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<"all" | "flagship" | "active">("all");

  const hierarchyContext = useMemo(() => {
    return getAccountHierarchy(selectedAccountId);
  }, [selectedAccountId]);

  const currentBranch = hierarchyContext.currentBranch;
  const currentGroup = hierarchyContext.group;

  function formatAED(value: number) {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  const allAccounts = useMemo(() => getAllHierarchyAccounts(), []);

  // Filter groups and branches for modal
  const filteredGroups = useMemo(() => {
    return CORPORATE_GROUPS.map((g) => {
      const matchesGroupFilter = selectedGroupId === "all" || g.group_id === selectedGroupId;
      if (!matchesGroupFilter) return null;

      const matchingBranches = g.branches.filter((b) => {
        const query = search.toLowerCase();
        const matchesSearch = 
          !query ||
          b.name.toLowerCase().includes(query) ||
          b.code.toLowerCase().includes(query) ||
          b.territory.toLowerCase().includes(query) ||
          b.address.toLowerCase().includes(query) ||
          g.group_name.toLowerCase().includes(query);

        const matchesFlagship = filterLevel === "all" || (filterLevel === "flagship" && b.is_flagship) || (filterLevel === "active" && b.status === "active");

        return matchesSearch && matchesFlagship;
      });

      if (matchingBranches.length === 0 && search) return null;

      return {
        ...g,
        branches: matchingBranches,
      };
    }).filter(Boolean) as CorporateGroup[];
  }, [search, selectedGroupId, filterLevel]);

  const handleSelect = (branch: HierarchyBranchNode, group: CorporateGroup) => {
    onSelectAccount(branch, group);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2.5">
      {/* Label and Quick Controls */}
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold uppercase tracking-wider text-[#9A988C] flex items-center gap-1">
          <Network size={12} className="text-[#B8622A]" /> {label}
        </label>

        <div className="flex items-center gap-2">
          {/* Quick 1-Click Dropdown */}
          <select
            value={selectedAccountId}
            onChange={(e) => {
              const matched = allAccounts.find((a) => a.id === e.target.value);
              if (matched) {
                const group = CORPORATE_GROUPS.find((g) => g.group_id === matched.group_id) || currentGroup;
                handleSelect(matched, group);
              }
            }}
            className="text-[11px] font-bold text-gray-800 bg-white border border-gray-300 rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-[#B8622A] focus:outline-none cursor-pointer shadow-2xs hover:border-[#B8622A]"
          >
            {CORPORATE_GROUPS.map((g) => (
              <optgroup key={g.group_id} label={`🏢 ${g.group_name}`}>
                {g.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.city})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="text-[11px] font-bold text-[#B8622A] bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
          >
            <span>Browse Tree</span>
            <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Selected Account Bar */}
      <div 
        className="rounded-xl bg-white border border-[#E7E2D9] p-3.5 shadow-2xs hover:border-[#B8622A] transition-all space-y-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0 mt-0.5">
              <Store size={20} />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-extrabold uppercase tracking-wide bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded border border-indigo-200">
                  🏢 {currentGroup.group_name.replace(" (HQ)", "").replace(" (Corporate HQ)", "")}
                </span>
                <span className="text-[9px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                  {currentBranch.code}
                </span>
                {currentBranch.is_flagship && (
                  <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    ⭐ Central Hub / Flagship
                  </span>
                )}
              </div>
              <h3 className="font-bold text-sm text-[#1C2321]">{currentBranch.name}</h3>
              <p className="text-[11px] text-gray-500 flex items-center gap-1">
                <MapPin size={11} className="text-gray-400 shrink-0" />
                <span>{currentBranch.address} · {currentBranch.territory}</span>
              </p>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[#1C2321] text-white hover:bg-black text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <span>Switch Account</span>
              <ChevronDown size={13} />
            </button>
          </div>
        </div>

        {/* Multi-Tier Credit Summary Line */}
        {showCreditDetails && (
          <div className="pt-2.5 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
              <p className="text-[9px] font-bold uppercase text-gray-400">Consolidated Limit</p>
              <p className="font-extrabold text-gray-800 font-mono text-[11px]">
                {formatAED(currentGroup.group_credit_limit)}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
              <p className="text-[9px] font-bold uppercase text-gray-400">Group Available</p>
              <p className="font-extrabold text-emerald-700 font-mono text-[11px]">
                {formatAED(hierarchyContext.groupAvailableCredit)}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
              <p className="text-[9px] font-bold uppercase text-gray-400">Branch Limit</p>
              <p className="font-extrabold text-gray-800 font-mono text-[11px]">
                {formatAED(currentBranch.individual_credit_limit)}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
              <p className="text-[9px] font-bold uppercase text-gray-400">Payment Terms</p>
              <p className="font-extrabold text-indigo-700 text-[11px]">
                {currentGroup.payment_terms}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Account Hierarchy Selection Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="w-full max-w-2xl max-h-[85vh] rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300">
                  <Network size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold">Select Account from Corporate Hierarchy</h2>
                  <p className="text-xs text-indigo-200">
                    Switch between corporate parent entities and retail branch outlets
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 border-b border-gray-100 bg-[#FAF8F4] space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by store name, branch code, group, or territory..."
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs text-gray-900 placeholder:text-gray-400"
                />
              </div>

              {/* Group filter pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedGroupId("all")}
                  className={`px-3 py-1 rounded-lg font-bold text-[11px] shrink-0 transition-colors cursor-pointer ${
                    selectedGroupId === "all"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  All Corporate Groups ({CORPORATE_GROUPS.length})
                </button>
                {CORPORATE_GROUPS.map((g) => (
                  <button
                    key={g.group_id}
                    type="button"
                    onClick={() => setSelectedGroupId(g.group_id)}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] shrink-0 transition-colors cursor-pointer ${
                      selectedGroupId === g.group_id
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {g.group_name.replace(" (HQ)", "").replace(" (Corporate HQ)", "")}
                  </button>
                ))}
              </div>
            </div>

            {/* Group & Branch Tree List */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5">
              {filteredGroups.length === 0 ? (
                <div className="text-center py-10 text-gray-400 space-y-2">
                  <Building2 size={32} className="mx-auto text-gray-300" />
                  <p className="text-sm">No accounts found matching your search criteria.</p>
                </div>
              ) : (
                filteredGroups.map((group) => {
                  const groupUtil = Math.round((group.group_outstanding / group.group_credit_limit) * 100);
                  const isCurrentSelectedInThisGroup = group.branches.some((b) => b.id === selectedAccountId);

                  return (
                    <div 
                      key={group.group_id}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        isCurrentSelectedInThisGroup 
                          ? "border-indigo-300 ring-2 ring-indigo-100 bg-indigo-50/10" 
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      {/* Corporate Group Header */}
                      <div className="p-3.5 bg-gradient-to-r from-slate-50 to-indigo-50/40 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                            <Building2 size={16} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-xs text-gray-900">{group.group_name}</h3>
                              <span className="text-[9px] font-bold uppercase bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded">
                                HQ Entity
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-500">{group.hq_address}</p>
                          </div>
                        </div>

                        {/* Group Financial Metric */}
                        <div className="flex items-center gap-3 text-right shrink-0">
                          <div className="text-left sm:text-right">
                            <span className="text-[9px] uppercase font-bold text-gray-400 block">Consolidated Credit</span>
                            <span className="text-xs font-black text-gray-800 font-mono">
                              {formatAED(group.group_outstanding)} <span className="font-normal text-gray-400">/ {formatAED(group.group_credit_limit)}</span>
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            groupUtil > 75 ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {groupUtil}% Used
                          </span>
                        </div>
                      </div>

                      {/* Branch Outlets Grid */}
                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {group.branches.map((branch) => {
                          const isSelected = branch.id === selectedAccountId;
                          return (
                            <button
                              key={branch.id}
                              type="button"
                              onClick={() => handleSelect(branch, group)}
                              className={`p-3 rounded-xl border flex flex-col justify-between gap-2.5 text-left cursor-pointer transition-all ${
                                isSelected
                                  ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-300 shadow-sm"
                                  : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-slate-50/80"
                              }`}
                            >
                              <div className="space-y-1 w-full">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[9px] font-bold uppercase text-gray-500 font-mono bg-gray-100 px-1.5 py-0.2 rounded">
                                    {branch.code}
                                  </span>
                                  {isSelected ? (
                                    <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-indigo-600 text-white flex items-center gap-1">
                                      <Check size={10} /> Active Selection
                                    </span>
                                  ) : branch.is_flagship ? (
                                    <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                      ⭐ Flagship
                                    </span>
                                  ) : null}
                                </div>
                                <h4 className="text-xs font-bold text-gray-900 leading-snug">{branch.name}</h4>
                                <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                  <MapPin size={10} className="text-gray-400 shrink-0" />
                                  <span className="truncate">{branch.address}</span>
                                </p>
                              </div>

                              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] w-full">
                                <span className="font-semibold text-gray-600">
                                  Credit: <strong className="font-mono text-gray-900">{formatAED(branch.individual_credit_limit)}</strong>
                                </span>
                                <span className="font-bold text-indigo-600 flex items-center gap-0.5">
                                  {isSelected ? "Selected ✓" : "Click to Switch →"}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-gray-100 bg-[#FAF8F4] flex items-center justify-between text-xs">
              <span className="text-[11px] text-gray-500">
                Active Group: <strong className="text-gray-800">{currentGroup.group_name}</strong>
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-gray-900 text-white font-bold text-xs hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
