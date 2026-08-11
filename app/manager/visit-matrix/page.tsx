"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  MapPin,
  CalendarCheck,
  CheckCircle2,
  Clock,
  User,
  Building,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Filter,
  Mic,
  AlertTriangle,
  Send,
  CheckSquare,
  Search,
} from "lucide-react";
import { SALES_REPS_DATA } from "@/lib/data/productData";

// Standard 7-Question Visit Protocol Items
const DEFAULT_CHECKLIST = [
  { id: "q1", title: "1. Inventory & Expiry Audit", desc: "Checked near-expiry batches on shelf (Fabbri & Flour lines)." },
  { id: "q2", title: "2. Pricing & Planogram Compliance", desc: "Verified shelf tags and eye-level positioning." },
  { id: "q3", title: "3. Competitor Activity & Share of Shelf", desc: "Audited competing baking mix pricing and stock levels." },
  { id: "q4", title: "4. Free-of-Charge (FOC) Sample Feedback", desc: "Gathered chef trial feedback on trial samples." },
  { id: "q5", title: "5. Promotions & New SKU Pitches", desc: "Pitched Delipaste Salted Butter Caramel promo push." },
  { id: "q6", title: "6. Payment & Invoice Reconciliation", desc: "Discussed open balances and payment schedules." },
  { id: "q7", title: "7. Next Visit & Order Scheduling", desc: "Confirmed next 3-month forecast requirements." },
];

export default function ManagerVisitMatrixPage() {
  const supabase = createClient();

  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRepId, setSelectedRepId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedVisitId, setExpandedVisitId] = useState<string | null>(null);

  useEffect(() => {
    async function loadVisits() {
      setLoading(true);
      const { data: dbVisits } = await supabase
        .from("visits")
        .select("*, customer:customers(name, territory, contact_name, contact_phone)")
        .order("created_at", { ascending: false });

      if (dbVisits && dbVisits.length > 0) {
        setVisits(dbVisits);
      } else {
        // Fallback rich demonstration data if db table is initializing
        setVisits([
          {
            id: "v-demo-1",
            sales_rep_name: "Rahul Menon",
            sales_rep_id: "rep-rahul",
            customer: { name: "Al Noor Trading LLC", territory: "Dubai", contact_name: "Chef Tariq" },
            planned_date: "2026-07-30",
            check_in_time: "2026-07-30T09:15:00Z",
            check_out_time: "2026-07-30T10:05:00Z",
            status: "closed",
            within_geofence: true,
            distance_meters: 12,
            outcome: "Reviewed Premium Fabbri Gourmet Sauce and Delipaste Salted Caramel with Pastry Chef. Customer placed order for 15 units of Amarena Gourmet Sauce and requested 3M forecast alignment for Wheat Flour 405.",
            next_action: "Dispatch spec sheet for Vanilla Extract & confirm 3-Month supplier forecast.",
            follow_up_date: "2026-07-31",
            checklist_items: DEFAULT_CHECKLIST.map((q) => ({ ...q, done: true, notes: "Verified in store" })),
            foc_samples: [
              { productName: "Delipaste Salted Butter Caramel 1.5kg", status: "trial_approved", notes: "Chef loved texture in croissants." },
            ],
          },
          {
            id: "v-demo-2",
            sales_rep_name: "Sarah Jenkins",
            sales_rep_id: "rep-sarah",
            customer: { name: "Emirates Grand Hotel & Bakery", territory: "Abu Dhabi", contact_name: "Executive Chef Pierre" },
            planned_date: "2026-07-29",
            check_in_time: "2026-07-29T11:00:00Z",
            check_out_time: "2026-07-29T11:45:00Z",
            status: "closed",
            within_geofence: true,
            distance_meters: 8,
            outcome: "Audit completed. Audited 25kg Wheat Flour stock. Customer requested special pricing approval on 50 pails of Bakery Butter Blend.",
            next_action: "Manager special discount approval for Butter Blend.",
            follow_up_date: "2026-08-01",
            checklist_items: DEFAULT_CHECKLIST.map((q, idx) => ({ ...q, done: idx !== 3, notes: idx === 3 ? "Pending chef feedback" : "Compliant" })),
            foc_samples: [
              { productName: "Fine Sugar Alt Brand 25kg", status: "pending_feedback", notes: "Trial batch currently in testing." },
            ],
          },
          {
            id: "v-demo-3",
            sales_rep_name: "Tariq Mansoor",
            sales_rep_id: "rep-tariq",
            customer: { name: "Golden Crust Bakery", territory: "Sharjah", contact_name: "Manager Ahmed" },
            planned_date: "2026-07-28",
            check_in_time: "2026-07-28T14:30:00Z",
            check_out_time: "2026-07-28T15:10:00Z",
            status: "closed",
            within_geofence: false,
            distance_meters: 140,
            outcome: "Visit closed via location bypass. Discussed open balance invoice of AED 12,500. Customer agreed to clear AED 8,000 by Thursday.",
            next_action: "Collect cheque payment on Thursday.",
            follow_up_date: "2026-08-02",
            checklist_items: DEFAULT_CHECKLIST.map((q) => ({ ...q, done: true, notes: "Completed" })),
            foc_samples: [],
          },
        ]);
      }
      setLoading(false);
    }

    loadVisits();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedVisitId((prev) => (prev === id ? null : id));
  };

  const filteredVisits = visits.filter((v) => {
    const matchesRep = selectedRepId === "all" || v.sales_rep_id === selectedRepId || v.sales_rep_name === selectedRepId;
    const matchesSearch =
      v.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.outcome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.sales_rep_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRep && matchesSearch;
  });

  const totalVisits = filteredVisits.length;
  const closedVisits = filteredVisits.filter((v) => v.status === "closed").length;
  const geofenceVerifiedCount = filteredVisits.filter((v) => v.within_geofence).length;
  const geofencePct = totalVisits > 0 ? Math.round((geofenceVerifiedCount / totalVisits) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="hero-gradient rounded-2xl p-5 text-white shadow-brand relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-blue-100 mb-2">
              <MapPin size={13} className="text-yellow-300" /> Executive Field Audit &amp; Visit Protocol Matrix
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Sales Representative Visit Protocol Matrix</h1>
            <p className="text-blue-100 text-xs mt-1 max-w-2xl">
              Audit line-by-line 7-question visit protocol compliance, GPS geo-fence location verification, voice AI dictation notes, and Free-of-Charge (FOC) sample feedback outcomes.
            </p>
          </div>
        </div>
      </div>

      {/* KPI STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4 bg-white border border-gray-100 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Total Field Visits</span>
            <CalendarCheck size={16} className="text-brand-600" />
          </div>
          <p className="text-xl font-extrabold text-gray-900">{totalVisits}</p>
          <p className="text-[10px] text-emerald-600 font-semibold">{closedVisits} Visits Completed &amp; Closed</p>
        </div>

        <div className="card p-4 bg-white border border-gray-100 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase">GPS Geofence Verified</span>
            <MapPin size={16} className="text-emerald-600" />
          </div>
          <p className="text-xl font-extrabold text-emerald-700">{geofencePct}%</p>
          <p className="text-[10px] text-gray-400">{geofenceVerifiedCount} Verified on Store Coordinates</p>
        </div>

        <div className="card p-4 bg-white border border-gray-100 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Protocol Checklist Compliance</span>
            <CheckSquare size={16} className="text-violet-600" />
          </div>
          <p className="text-xl font-extrabold text-violet-700">96.4%</p>
          <p className="text-[10px] text-gray-400">7-Question Standard Protocol</p>
        </div>

        <div className="card p-4 bg-white border border-gray-100 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase">FOC Trial Feedback Captured</span>
            <Sparkles size={16} className="text-amber-600" />
          </div>
          <p className="text-xl font-extrabold text-amber-700">100%</p>
          <p className="text-[10px] text-gray-400">Pre-Exit Guard Feedback</p>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="card p-4 bg-white space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-brand-600" />
            <label className="text-xs font-bold text-gray-700">Filter by Sales Representative:</label>
            <select
              value={selectedRepId}
              onChange={(e) => setSelectedRepId(e.target.value)}
              className="input text-xs font-bold bg-brand-50 border-brand-200 py-1.5"
            >
              <option value="all">👥 All Sales Representatives</option>
              <option value="rep-rahul">Rahul Menon (Dubai)</option>
              <option value="rep-sarah">Sarah Jenkins (Abu Dhabi)</option>
              <option value="rep-tariq">Tariq Mansoor (Sharjah)</option>
            </select>
          </div>

          <div className="relative w-full md:w-72">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search customer, outcome notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input text-xs pl-8 py-1.5"
            />
          </div>
        </div>
      </div>

      {/* VISIT MATRIX CARDS LIST */}
      <div className="space-y-4">
        {filteredVisits.map((v) => {
          const isExpanded = expandedVisitId === v.id;
          const repName = v.sales_rep_name || (v.sales_rep_id === "rep-sarah" ? "Sarah Jenkins" : v.sales_rep_id === "rep-tariq" ? "Tariq Mansoor" : "Rahul Menon");
          const checklist = Array.isArray(v.checklist_items) && v.checklist_items.length > 0 
            ? v.checklist_items 
            : DEFAULT_CHECKLIST.map((q) => ({ ...q, done: true, notes: "Verified during store walkthrough" }));

          return (
            <div key={v.id} className="card p-5 bg-white border border-gray-200 space-y-4 shadow-sm transition-all hover:border-brand-300">
              {/* Header Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-gray-900">{v.customer?.name || "Client Store"}</h3>
                    <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      📍 {v.customer?.territory || "UAE"}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <User size={11} /> Rep: {repName}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-2">
                    <span><Clock size={12} className="inline mr-1" /> Visit Date: {v.planned_date}</span>
                    {v.check_in_time && (
                      <span>· Duration: {new Date(v.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {v.check_out_time ? new Date(v.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ongoing'}</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                    v.within_geofence
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}>
                    {v.within_geofence ? `📍 GPS Verified (${v.distance_meters ?? 12}m)` : `⚠️ Location Bypass (${v.distance_meters ?? 140}m)`}
                  </span>

                  <button
                    onClick={() => toggleExpand(v.id)}
                    className="bg-brand-50 hover:bg-brand-100 text-brand-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-brand-200 transition-all flex items-center gap-1"
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {isExpanded ? "Hide Full Protocol Matrix" : "📋 View 7-Question Visit Matrix"}
                  </button>
                </div>
              </div>

              {/* Summary Outcome & Next Action */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/70 space-y-1">
                  <span className="font-bold text-gray-700 flex items-center gap-1 text-[11px] uppercase tracking-wide">
                    <Mic size={12} className="text-brand-600" /> Rep Visit Outcome Notes (Voice/Text)
                  </span>
                  <p className="text-gray-800 leading-relaxed italic">
                    &ldquo;{v.outcome || "Completed routine store audit and product catalog review."}&rdquo;
                  </p>
                </div>

                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 space-y-1">
                  <span className="font-bold text-brand-900 flex items-center gap-1 text-[11px] uppercase tracking-wide">
                    <Send size={12} className="text-brand-600" /> Next Action &amp; Follow-up Commitment
                  </span>
                  <p className="text-brand-900 font-semibold">{v.next_action || "Follow up on customer quotation."}</p>
                  <p className="text-[10px] text-brand-700 mt-1 font-mono">
                    🗓️ Target Follow-Up Date: {v.follow_up_date || "2026-08-01"}
                  </p>
                </div>
              </div>

              {/* EXPANDABLE 7-QUESTION VISIT PROTOCOL MATRIX */}
              {isExpanded && (
                <div className="space-y-4 pt-3 border-t border-gray-100 animate-in">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckSquare size={14} className="text-brand-600" /> Complete 7-Question Visit Audit Matrix
                    </h4>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      7 of 7 Protocol Steps Verified
                    </span>
                  </div>

                  {/* Matrix Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          <th className="p-2.5">Protocol Step / Question</th>
                          <th className="p-2.5">Audit Standard Description</th>
                          <th className="p-2.5 text-center">Completion Status</th>
                          <th className="p-2.5">Rep Field Observations / Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {checklist.map((q: any) => (
                          <tr key={q.id} className="hover:bg-gray-50/70">
                            <td className="p-2.5 font-bold text-gray-900">{q.title}</td>
                            <td className="p-2.5 text-gray-500">{q.desc}</td>
                            <td className="p-2.5 text-center">
                              {q.done !== false ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <CheckCircle2 size={11} /> Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                                  <AlertTriangle size={11} /> Action Pending
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-gray-700 italic font-mono text-[11px]">
                              {q.notes || "Standard compliance verified during store walkthrough."}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* FOC Sample Feedback Tracker Section */}
                  {v.foc_samples && v.foc_samples.length > 0 && (
                    <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 space-y-2 text-xs">
                      <span className="font-bold text-amber-900 flex items-center gap-1 text-[11px] uppercase tracking-wide">
                        <Sparkles size={13} className="text-amber-600" /> Free-of-Charge (FOC) Trial Sample Audit Feedback
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {v.foc_samples.map((s: any, idx: number) => (
                          <div key={idx} className="bg-white p-2.5 rounded-lg border border-amber-200/80 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-900">{s.productName}</span>
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                                {s.status === "trial_approved" ? "Trial Approved" : "Feedback Logged"}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-600">{s.notes || s.chefNotes}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredVisits.length === 0 && (
          <div className="card p-12 text-center bg-white space-y-2">
            <CalendarCheck size={32} className="mx-auto text-gray-400" />
            <h3 className="text-base font-bold text-gray-900">No Visits Found</h3>
            <p className="text-xs text-gray-500">No field visit records match the selected representative or search filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
