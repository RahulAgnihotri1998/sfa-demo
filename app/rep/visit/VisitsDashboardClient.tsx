"use client";

import { useState, useEffect } from "react";
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
import ExportExcelButton from "@/components/ExportExcelButton";

interface Customer {
  id: string;
  name: string;
  territory: string;
  contact_name: string;
  contact_phone?: string;
  address: string;
}

interface Visit {
  id: string;
  customer_id: string;
  sales_rep_id?: string;
  status: string;
  planned_date: string;
  scheduled_time_start?: string;
  duration_minutes?: number;
  check_in_time?: string | null;
  check_out_time?: string | null;
  within_geofence?: boolean | null;
  outcome?: string | null;
  next_action?: string | null;
  customer?: { name: string } | null;
  created_at?: string;
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

  const [visitsList, setVisitsList] = useState<Visit[]>(initialVisits);
  const [activeTab, setActiveTab] = useState<"planned" | "history" | "customers">("planned");
  const [searchQuery, setSearchQuery] = useState("");
  const [scheduledNotice, setScheduledNotice] = useState<string | null>(null);

  // Sync state if initialVisits prop updates
  useEffect(() => {
    setVisitsList(initialVisits);
  }, [initialVisits]);

  // Plan visit form states
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planCustomerId, setPlanCustomerId] = useState("");
  const [planDate, setPlanDate] = useState("");
  const [planTime, setPlanTime] = useState("10:00");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [planning, setPlanning] = useState(false);

  // Check if there is an existing planned visit at the same date/time
  const hasConflict = visitsList.some(
    (v) => v.planned_date === planDate && (v as any).scheduled_time_start === planTime
  );

  async function handlePlanVisit() {
    if (!planCustomerId || !planDate) {
      alert("Please select a customer and planned date.");
      return;
    }
    setPlanning(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const repId = userData?.user?.id || "22222222-2222-2222-2222-222222222222";
      
      const { data: inserted, error } = await supabase
        .from("visits")
        .insert({
          customer_id: planCustomerId,
          sales_rep_id: repId,
          status: "planned",
          planned_date: planDate,
          scheduled_time_start: planTime,
          duration_minutes: parseInt(durationMinutes) || 60,
        })
        .select()
        .single();

      if (error) {
        const errorMsg = typeof error === "string" ? error : error.message || JSON.stringify(error);
        alert("Failed to plan visit: " + errorMsg);
      } else {
        const targetCust = customers.find((c) => c.id === planCustomerId);
        const newVisit: Visit = {
          id: inserted?.id || ("v-plan-" + Date.now()),
          customer_id: planCustomerId,
          customer: { name: targetCust?.name || "Client Store" },
          sales_rep_id: repId,
          status: "planned",
          planned_date: planDate,
          scheduled_time_start: planTime,
          duration_minutes: parseInt(durationMinutes) || 60,
          created_at: new Date().toISOString(),
        };

        // Immediately add to planned visits state
        setVisitsList((prev) => [newVisit, ...prev]);
        setActiveTab("planned");
        setScheduledNotice(`✓ Planned visit scheduled for ${targetCust?.name || "Customer"} on ${formatDate(planDate)} at ${planTime}!`);
        setTimeout(() => setScheduledNotice(null), 5000);

        setPlanCustomerId("");
        setPlanDate("");
        setPlanTime("10:00");
        setShowPlanForm(false);
        router.refresh();
      }
    } catch (err: any) {
      alert("Error: " + (err?.message || "Failed to schedule visit"));
    } finally {
      setPlanning(false);
    }
  }

  // Filter customers by search
  const q = (searchQuery || "").toLowerCase();
  const filteredCustomers = customers.filter((c) => {
    if (!c) return false;
    const nameStr = (c.name || "").toLowerCase();
    const terrStr = (c.territory || "").toLowerCase();
    return !q || nameStr.includes(q) || terrStr.includes(q);
  });

  // Helper: Determine if a visit is completed
  const isCompleted = (v: Visit) => 
    Boolean(v) && (
      v.status === "closed" || 
      v.status === "completed" || 
      Boolean(v.check_out_time) || 
      (Boolean(v.outcome) && String(v.outcome).trim().length > 0)
    );

  // Filter visits: Planned vs Completed History
  const plannedVisits = visitsList.filter((v) => !isCompleted(v));
  const pastVisits = visitsList.filter((v) => isCompleted(v));

  // Filter past visits by search
  const filteredPastVisits = pastVisits.filter((v) => {
    if (!v) return false;
    const custName = (v.customer?.name || "").toLowerCase();
    const outcomeText = (v.outcome || "").toLowerCase();
    return !q || custName.includes(q) || outcomeText.includes(q);
  });

  // Filter planned visits by search
  const filteredPlannedVisits = plannedVisits.filter((v) => {
    if (!v) return false;
    const custName = (v.customer?.name || "").toLowerCase();
    const pDate = String(v.planned_date || "");
    return !q || custName.includes(q) || pDate.includes(searchQuery);
  });

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
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-[#9A988C]">Scheduled Time Slot</label>
              <input
                type="time"
                value={planTime}
                onChange={(e) => setPlanTime(e.target.value)}
                className="w-full h-10 rounded-sm border border-[#E7E2D9] bg-[#FDFCFA] px-3 text-xs text-[#1C2321] focus:outline-none focus:ring-1 focus:ring-[#B8622A] focus:border-[#B8622A]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-[#9A988C]">Estimated Duration</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full h-10 rounded-sm border border-[#E7E2D9] bg-[#FDFCFA] px-3 text-xs text-[#1C2321] focus:outline-none focus:ring-1 focus:ring-[#B8622A] focus:border-[#B8622A]"
              >
                <option value="30">30 Minutes</option>
                <option value="45">45 Minutes</option>
                <option value="60">60 Minutes (1 Hour)</option>
                <option value="90">90 Minutes (1.5 Hours)</option>
              </select>
            </div>
          </div>

          {hasConflict && (
            <div className="p-2.5 rounded-sm bg-[#F7E7E3] border border-[#EAC4BD] text-[#A23B2E] text-xs flex items-center gap-2">
              <span>⚠️ <strong>Schedule Conflict Alert:</strong> You already have a visit planned around this date/time window. Overlapping visits will trigger a manager audit alert.</span>
            </div>
          )}
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

      {/* Notification Banner */}
      {scheduledNotice && (
        <div className="bg-[#E8EFE4] border border-[#C5DDC0] text-[#2C5237] text-xs font-semibold p-3.5 rounded-sm flex items-center justify-between animate-in shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#3F6B4F]" />
            <span>{scheduledNotice}</span>
          </div>
          <button onClick={() => setScheduledNotice(null)} className="text-[#3F6B4F] font-bold">✕</button>
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
            📅 Planned Visits ({plannedVisits.length})
          </button>
          <button
            onClick={() => { setActiveTab("customers"); setSearchQuery(""); }}
            className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === "customers"
                ? "border-[#B8622A] text-[#B8622A]"
                : "border-transparent text-[#9A988C] hover:text-[#1C2321]"
            }`}
          >
            🏢 Start Check-In ({customers.length})
          </button>
          <button
            onClick={() => { setActiveTab("history"); setSearchQuery(""); }}
            className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === "history"
                ? "border-[#B8622A] text-[#B8622A]"
                : "border-transparent text-[#9A988C] hover:text-[#1C2321]"
            }`}
          >
            📜 Visit History ({pastVisits.length})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#B4B2A9]" />
            <input
              type="text"
              placeholder={activeTab === "planned" ? "Search planned visits..." : activeTab === "customers" ? "Search client accounts..." : "Search past outcomes..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 rounded-sm border border-[#E7E2D9] bg-white pl-9 pr-3 text-xs text-[#1C2321] placeholder-[#B4B2A9] focus:outline-none focus:ring-1 focus:ring-[#B8622A] focus:border-[#B8622A]"
            />
          </div>
          <ExportExcelButton
            data={visitsList.map((v) => ({
              "Customer Name": v.customer?.name || "Client Store",
              "Status": v.status,
              "Planned Date": v.planned_date,
              "Scheduled Time": v.scheduled_time_start || "10:00",
              "Duration (Mins)": v.duration_minutes || 60,
              "Check In": v.check_in_time ? new Date(v.check_in_time).toLocaleTimeString() : "—",
              "Check Out": v.check_out_time ? new Date(v.check_out_time).toLocaleTimeString() : "—",
              "GPS Geofence Verified": v.within_geofence !== false ? "YES" : "NO / BYPASS",
              "Outcome": v.outcome || "—",
              "Next Action": v.next_action || "—",
            }))}
            filename="Rep-Field-Visits-Schedule"
            sheetName="Visits"
            label="Export Schedule"
          />
        </div>
      </div>

      {/* Main content grid */}
      <div className="space-y-3">
        {/* Tab 1: Planned / Active */}
        {activeTab === "planned" && (
          <>
            {filteredPlannedVisits.length === 0 ? (
              <div className="rounded-md bg-white p-12 text-center ring-1 ring-[#E7E2D9] space-y-3 max-w-lg mx-auto mt-6">
                <Calendar size={32} className="mx-auto text-[#B4B2A9]" />
                <div>
                  <p className="text-sm font-bold text-[#1C2321]">
                    {searchQuery ? "No matching planned visits" : "No scheduled visits in planned tab"}
                  </p>
                  <p className="text-xs text-[#9A988C] mt-1">
                    {searchQuery 
                      ? "Try searching for a different customer name or date."
                      : "Schedule upcoming client visits using the 'Plan Visit' button above, or select a customer below."}
                  </p>
                </div>
                <div className="flex gap-2 justify-center pt-1">
                  <button
                    onClick={() => setShowPlanForm(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#B8622A] hover:bg-[#A05220] rounded-sm transition-colors"
                  >
                    <Plus size={13} /> Schedule New Visit
                  </button>
                  <button
                    onClick={() => setActiveTab("customers")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#1C2321] bg-white border border-[#E7E2D9] hover:bg-[#FAF8F4] rounded-sm transition-colors"
                  >
                    <MapPin size={13} /> Select customer
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPlannedVisits.map((v) => (
                  <div key={v.id} className="rounded-md bg-white p-5 ring-1 ring-[#E7E2D9] space-y-4 flex flex-col justify-between shadow-sm hover:ring-[#EDCFA3] transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#B8622A] bg-[#FBEEDD] px-2 py-0.5 rounded-sm border border-[#EDCFA3]">
                          {v.status || "planned"}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-[#9A988C]">
                          <span className="flex items-center gap-1">
                            <Calendar size={11} /> {v.planned_date ? formatDate(v.planned_date) : "Scheduled"}
                          </span>
                          {(v as any).scheduled_time_start && (
                            <span className="flex items-center gap-1 bg-[#FAF8F4] px-1.5 py-0.5 rounded border border-[#E7E2D9]">
                              <Clock size={10} /> {(v as any).scheduled_time_start}
                            </span>
                          )}
                        </div>
                      </div>
                      <h3 className="font-bold text-sm text-[#1C2321] pt-1">{v.customer?.name ?? "Client Store"}</h3>
                      <p className="text-xs text-[#9A988C] truncate flex items-center gap-1">
                        <MapPin size={11} /> Account ID: {v.customer_id}
                      </p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Link
                        href={`/rep/visit/${v.customer_id}?visitId=${v.id}`}
                        className="w-full py-2.5 bg-[#1C2321] hover:bg-[#2A322E] text-white text-xs font-bold rounded-sm flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Navigation size={12} /> Start Visit &amp; Check-In
                      </Link>
                    </div>
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
                      <p className="text-[10px] text-[#B4B2A9]">Contact: {c.contact_name || c.contact_phone || "Store Manager"}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setPlanCustomerId(c.id);
                          setPlanDate(new Date().toISOString().split("T")[0]);
                          setShowPlanForm(true);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="w-1/2 py-2 border border-[#E7E2D9] hover:bg-[#FAF8F4] text-[#1C2321] text-xs font-bold rounded-sm flex items-center justify-center gap-1 transition-all"
                      >
                        <Calendar size={11} className="text-[#B8622A]" /> Plan Visit
                      </button>
                      <Link
                        href={`/rep/visit/${c.id}`}
                        className="w-1/2 py-2 bg-[#B8622A] hover:bg-[#964E20] text-white text-xs font-bold rounded-sm flex items-center justify-center gap-1 transition-all shadow-xs"
                      >
                        <Navigation size={11} /> Check-In
                      </Link>
                    </div>
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
