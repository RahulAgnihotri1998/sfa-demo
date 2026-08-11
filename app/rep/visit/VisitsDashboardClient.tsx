"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  MapPin, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Navigation,
  ArrowRight,
  Plus
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  territory: string;
  contact_name: string;
  address: string;
}

interface Visit {
  id: string;
  customer_id: string;
  status: string;
  planned_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  within_geofence: boolean | null;
  outcome: string | null;
  next_action: string | null;
  customer?: { name: string } | null;
}

interface Props {
  initialVisits: Visit[];
  customers: Customer[];
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

function formatTime(dateStr: any) {
  if (!dateStr) return "";
  const d = typeof dateStr === "object" ? dateStr : new Date(dateStr);
  return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleTimeString("en-AE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function VisitsDashboardClient({ initialVisits, customers }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<"planned" | "history" | "customers">("planned");
  const [searchQuery, setSearchQuery] = useState("");

  // Plan visit form states
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planCustomerId, setPlanCustomerId] = useState("");
  const [planDate, setPlanDate] = useState("");
  const [planning, setPlanning] = useState(false);

  async function handlePlanVisit() {
    if (!planCustomerId || !planDate) {
      alert("Please select a customer and planned date.");
      return;
    }
    setPlanning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("visits").insert({
        customer_id: planCustomerId,
        sales_rep_id: user?.id,
        status: "planned",
        planned_date: planDate,
      });

      if (error) {
        alert("Failed to plan visit: " + error.message);
      } else {
        alert("Visit scheduled successfully!");
        setPlanCustomerId("");
        setPlanDate("");
        setShowPlanForm(false);
        router.refresh();
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setPlanning(false);
    }
  }

  // Filter customers by search
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.territory.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper: Determine if a visit is completed
  const isCompleted = (v: Visit) => 
    v.status === "closed" || 
    v.status === "completed" || 
    Boolean(v.check_out_time) || 
    Boolean(v.outcome);

  // Filter visits: Planned vs Completed History
  const plannedVisits = initialVisits.filter(v => !isCompleted(v));
  const pastVisits = initialVisits.filter(v => isCompleted(v));

  // Filter past visits by search
  const filteredPastVisits = pastVisits.filter(v => 
    v.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.outcome && v.outcome.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 bg-[#FAF8F4] -m-4 p-6 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#B8622A]">
            Field Execution
          </p>
          <h1 className="text-xl font-bold text-[#1C2321] tracking-tight mt-0.5">
            My Client Visits
          </h1>
          <p className="text-xs text-[#9A988C] mt-1">
            Conduct secure geo-fenced check-ins, capture dictations, and review your activity log.
          </p>
        </div>
        <button
          onClick={() => setShowPlanForm(!showPlanForm)}
          className="sm:self-end px-3.5 py-2 text-xs font-bold text-white bg-[#1C2321] hover:bg-[#2A322E] rounded-sm transition-colors flex items-center gap-1.5 self-start"
        >
          <Plus size={14} /> Plan Visit
        </button>
      </div>

      {showPlanForm && (
        <div className="rounded-md bg-white p-5 ring-1 ring-[#E7E2D9] space-y-4 max-w-xl shadow-sm animate-in">
          <div>
            <h3 className="text-sm font-bold text-[#1C2321]">Schedule Client Visit</h3>
            <p className="text-xs text-[#9A988C] mt-0.5">Choose a client account and planned visit date.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-[#9A988C]">Target Customer</label>
              <select
                value={planCustomerId}
                onChange={(e) => setPlanCustomerId(e.target.value)}
                className="w-full h-10 rounded-sm border border-[#E7E2D9] bg-[#FDFCFA] px-3 text-xs text-[#1C2321] focus:outline-none focus:ring-1 focus:ring-[#B8622A] focus:border-[#B8622A]"
              >
                <option value="">Select a customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.territory})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-[#9A988C]">Planned Date</label>
              <input
                type="date"
                value={planDate}
                onChange={(e) => setPlanDate(e.target.value)}
                className="w-full h-10 rounded-sm border border-[#E7E2D9] bg-[#FDFCFA] px-3 text-xs text-[#1C2321] focus:outline-none focus:ring-1 focus:ring-[#B8622A] focus:border-[#B8622A]"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t border-[#E7E2D9]">
            <button
              onClick={() => setShowPlanForm(false)}
              className="px-3 py-1.5 text-xs font-bold text-[#6B6A63] border border-[#E7E2D9] rounded-sm hover:bg-[#FAF8F4] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePlanVisit}
              disabled={planning}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#B8622A] hover:bg-[#A05220] rounded-sm transition-colors disabled:opacity-50"
            >
              {planning ? "Scheduling..." : "Schedule"}
            </button>
          </div>
        </div>
      )}

      {/* Tabs list & Search bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center border-b border-[#E7E2D9] pb-1">
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveTab("planned"); setSearchQuery(""); }}
            className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === "planned"
                ? "border-[#B8622A] text-[#B8622A]"
                : "border-transparent text-[#9A988C] hover:text-[#1C2321]"
            }`}
          >
            Planned / Active ({plannedVisits.length})
          </button>
          <button
            onClick={() => { setActiveTab("customers"); setSearchQuery(""); }}
            className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === "customers"
                ? "border-transparent text-[#9A988C] hover:text-[#1C2321]"
                : "border-[#B8622A] text-[#B8622A]"
            }`}
          >
            Start Check-In ({customers.length})
          </button>
          <button
            onClick={() => { setActiveTab("history"); setSearchQuery(""); }}
            className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === "history"
                ? "border-[#B8622A] text-[#B8622A]"
                : "border-transparent text-[#9A988C] hover:text-[#1C2321]"
            }`}
          >
            Visit History ({pastVisits.length})
          </button>
        </div>

        {activeTab !== "planned" && (
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#B4B2A9]" />
            <input
              type="text"
              placeholder={activeTab === "customers" ? "Search client accounts..." : "Search past outcomes..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 rounded-sm border border-[#E7E2D9] bg-white pl-9 pr-3 text-xs text-[#1C2321] placeholder-[#B4B2A9] focus:outline-none focus:ring-1 focus:ring-[#B8622A] focus:border-[#B8622A]"
            />
          </div>
        )}
      </div>

      {/* Main content grid */}
      <div className="space-y-3">
        {/* Tab 1: Planned / Active */}
        {activeTab === "planned" && (
          <>
            {plannedVisits.length === 0 ? (
              <div className="rounded-md bg-white p-12 text-center ring-1 ring-[#E7E2D9] space-y-3 max-w-lg mx-auto mt-6">
                <Calendar size={32} className="mx-auto text-[#B4B2A9]" />
                <div>
                  <p className="text-sm font-bold text-[#1C2321]">No scheduled visits</p>
                  <p className="text-xs text-[#9A988C] mt-1">You do not have any planned client visits. Start a walk-in check-in directly.</p>
                </div>
                <button
                  onClick={() => setActiveTab("customers")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#1C2321] hover:bg-[#2A322E] rounded-sm transition-colors mx-auto"
                >
                  <MapPin size={13} /> Select customer to check-in
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plannedVisits.map((v) => (
                  <div key={v.id} className="rounded-md bg-white p-5 ring-1 ring-[#E7E2D9] space-y-4 flex flex-col justify-between shadow-sm">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#B8622A] bg-[#FBEEDD] px-2 py-0.5 rounded-sm border border-[#EDCFA3]">
                          {v.status}
                        </span>
                        <span className="text-[10px] font-mono text-[#9A988C] flex items-center gap-1">
                          <Calendar size={11} /> {formatDate(v.planned_date)}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-[#1C2321] pt-1">{v.customer?.name ?? "Unknown Account"}</h3>
                      <p className="text-xs text-[#9A988C] truncate flex items-center gap-1">
                        <MapPin size={11} /> {v.customer_id}
                      </p>
                    </div>

                    <Link
                      href={`/rep/visit/${v.customer_id}`}
                      className="w-full py-2 bg-[#1C2321] hover:bg-[#2A322E] text-white text-xs font-bold rounded-sm flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Navigation size={12} /> Start Visit
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Tab 2: Start Check-In / Customers list */}
        {activeTab === "customers" && (
          <>
            {filteredCustomers.length === 0 ? (
              <div className="rounded-md bg-white p-8 text-center ring-1 ring-[#E7E2D9]">
                <p className="text-sm text-[#9A988C]">No customer accounts found matching your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCustomers.map((c) => (
                  <div key={c.id} className="rounded-md bg-white p-4 ring-1 ring-[#E7E2D9] flex flex-col justify-between gap-4 shadow-sm hover:ring-[#EDCFA3] transition-all">
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-bold text-sm text-[#1C2321] truncate">{c.name}</h3>
                      <div className="flex items-center gap-1 text-[11px] text-[#9A988C]">
                        <MapPin size={11} className="shrink-0" />
                        <span className="truncate">{c.territory} · {c.address}</span>
                      </div>
                      <p className="text-[10px] text-[#B4B2A9]">Contact: {c.contact_name}</p>
                    </div>

                    <Link
                      href={`/rep/visit/${c.id}`}
                      className="w-full py-2 border border-[#E7E2D9] hover:bg-[#FAF8F4] text-[#1C2321] text-xs font-bold rounded-sm flex items-center justify-center gap-1.5 transition-all"
                    >
                      <MapPin size={12} className="text-[#B8622A]" /> Check-In Now
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Tab 3: Past Visit Logs */}
        {activeTab === "history" && (
          <>
            {filteredPastVisits.length === 0 ? (
              <div className="rounded-md bg-white p-8 text-center ring-1 ring-[#E7E2D9]">
                <p className="text-sm text-[#9A988C]">No past visit logs found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPastVisits.map((v) => (
                  <div key={v.id} className="rounded-md bg-white p-4 ring-1 ring-[#E7E2D9] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm text-[#1C2321] truncate">{v.customer?.name ?? "Unknown Customer"}</h3>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-sm ${
                          v.within_geofence
                            ? "bg-[#E8EFE4] text-[#3F6B4F]"
                            : "bg-[#F7E7E3] text-[#A23B2E]"
                        }`}>
                          {v.within_geofence ? "📍 Verified Location" : "⚠️ Out of geofence"}
                        </span>
                      </div>
                      <div className="flex items-center gap-x-3 gap-y-1 text-xs text-[#9A988C] flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {v.planned_date ? formatDate(v.planned_date) : ""}
                        </span>
                        {v.check_in_time && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {formatTime(v.check_in_time)} - {v.check_out_time ? formatTime(v.check_out_time) : ""}
                          </span>
                        )}
                      </div>
                      {v.outcome && (
                        <p className="text-xs text-[#6B6A63] italic bg-[#FAF8F4] p-3 rounded-sm border border-[#E7E2D9] mt-2">
                          outcome: "{v.outcome}"
                        </p>
                      )}
                      {v.next_action && (
                        <p className="text-[11px] text-[#B8622A] font-semibold">
                          Next Action: {v.next_action}
                        </p>
                      )}
                    </div>
                    
                    <div className="shrink-0 flex items-center justify-end">
                      <span className="text-[10px] font-bold text-[#3F6B4F] bg-[#E8EFE4] border border-[#C3D6BA] px-2 py-0.5 rounded-sm flex items-center gap-1">
                        <CheckCircle2 size={11} /> Closed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
