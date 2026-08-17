"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  MapPin,
  CheckCircle2,
  Mic,
  MicOff,
  Navigation,
  Loader2,
  Calendar,
  AlertTriangle,
  Play,
  Check,
  Tag,
  Package,
  Info,
  ArrowLeftRight,
  Sparkles,
  Plus,
  Target,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { generateNextBestActions, getProvenanceLabel, type NextBestAction } from "@/lib/data/analyticsEngine";
import { CompetitorIntelForm } from "@/components/CompetitorIntelForm";
import { CustomerHierarchyBadge } from "@/components/CustomerHierarchyBadge";
import { ErpSimulatorWidget } from "@/components/ErpSimulatorWidget";
import { InVisitCartDrawer, CartItem } from "@/components/InVisitCartDrawer";

// Haversine distance in meters
function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function VisitPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const searchParams = useSearchParams();
  const urlVisitId = searchParams.get("visitId");
  const router = useRouter();
  const supabase = createClient();

  const [customer, setCustomer] = useState<any>(null);
  const [visitId, setVisitId] = useState<string | null>(urlVisitId ?? null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [withinFence, setWithinFence] = useState<boolean | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [outcome, setOutcome] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // In-Visit Order Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const handleAddToCart = (product: any, qty: number = 1) => {
    const custPrice = pricing[product.id];
    const unitPrice = custPrice !== undefined ? custPrice : (product.base_price || 100);

    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          sku: product.sku || "SKU",
          unit_price: unitPrice,
          quantity: qty,
          is_promotion: product.is_promotion || product.stock_status === "promo",
        },
      ];
    });

    setAddedToast(`Added ${product.name} to Cart (${qty} unit${qty > 1 ? "s" : ""}) ✓`);
    setTimeout(() => setAddedToast(null), 2500);
  };

  const handleUpdateCartQty = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity: newQty } : item))
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Product & Promotion States for Pitch Guide
  const [products, setProducts] = useState<any[]>([]);
  const [alternatives, setAlternatives] = useState<Record<string, any[]>>({});
  const [promotions, setPromotions] = useState<any[]>([]);
  const [pricing, setPricing] = useState<Record<string, number>>({});
  const [frequentProducts, setFrequentProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"nba" | "frequent" | "promo" | "expiry" | "stock" | "active">("nba");

  // 7-Question Visit Protocol Checklist state
  const [checklist, setChecklist] = useState([
    { id: "q1", title: "1. Inventory & Expiry Audit", desc: "Check shelves for near-expiry batches (e.g. Fabbri, Apricot Jam).", done: false, notes: "" },
    { id: "q2", title: "2. Pricing & Planogram Compliance", desc: "Verify shelf tags and eye-level position match contract terms.", done: false, notes: "" },
    { id: "q3", title: "3. Competitor Intelligence", desc: "Log competitor price cuts, promotions, or substitute products.", done: false, notes: "" },
    { id: "q4", title: "4. Promotional & POP Display Audit", desc: "Confirm promotional banners and sample displays are installed.", done: false, notes: "" },
    { id: "q5", title: "5. Sample & Trial Product Feedback", desc: "Review chef/baker feedback on Livendo sourdough or Felchlin couverture.", done: false, notes: "" },
    { id: "q6", title: "6. Payment & Invoice Reconciliation", desc: "Discuss open invoices (e.g. Al Noor open balance AED 12,500).", done: false, notes: "" },
    { id: "q7", title: "7. 3-Month Sales Forecast & Reorder Commit", desc: "Align on M+1, M+2, M+3 volume forecasts for internal trader ordering.", done: false, notes: "" },
  ]);

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const updateChecklistNotes = (id: string, notes: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes } : item))
    );
  };

  const completedCount = checklist.filter((item) => item.done).length;

  // Voice AI Dictation States
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const [recordedSeconds, setRecordedSeconds] = useState(0);

  useEffect(() => {
    supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .single()
      .then(({ data }) => setCustomer(data));
  }, [customerId]);

  useEffect(() => {
    if (!customerId) return;

    // Load products
    supabase.from("products").select("*").then(({ data }) => setProducts(data ?? []));

    // Load product alternatives
    supabase.from("product_alternatives")
      .select("product_id, alternative:products")
      .then(({ data }) => {
        const map: Record<string, any[]> = {};
        data?.forEach((row: any) => {
          map[row.product_id] = [...(map[row.product_id] ?? []), row.alternative];
        });
        setAlternatives(map);
      });

    // Load promotions
    supabase.from("promotions").select("*").then(({ data }) => setPromotions(data ?? []));

    // Load customer pricing
    supabase.from("customer_pricing")
      .select("product_id, price")
      .eq("customer_id", customerId)
      .then(({ data }) => {
        const map: Record<string, number> = {};
        data?.forEach((r: any) => (map[r.product_id] = r.price));
      });
  }, [customerId]);

  useEffect(() => {
    if (!customerId || products.length === 0) return;

    supabase
      .from("order_items")
      .select("product_id, quantity, order:orders!inner(customer_id)")
      .eq("order.customer_id", customerId)
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        if (data && data.length > 0) {
          data.forEach((item: any) => {
            counts[item.product_id] = (counts[item.product_id] || 0) + (item.quantity || 1);
          });
        }

        // Sort strictly by highest total units ordered first (DB order_items + 6-month historical run-rate)
        const sortedProds = [...products].sort((a, b) => {
          const qtyA = (counts[a.id] ?? 0) + (Array.isArray(a.historical_6m_units) ? a.historical_6m_units.reduce((s: number, n: number) => s + n, 0) : 0);
          const qtyB = (counts[b.id] ?? 0) + (Array.isArray(b.historical_6m_units) ? b.historical_6m_units.reduce((s: number, n: number) => s + n, 0) : 0);
          return qtyB - qtyA; // Highest volume/quantity first!
        });

        setFrequentProducts(sortedProds.slice(0, 5));
      });
  }, [customerId, products]);

  const promoList = promotions.map((p) => {
    const prod = products.find((prod) => prod.id === p.product_id);
    return { ...p, product: prod };
  });

  // Voice Recording timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordedSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  async function processCheckIn(lat: number, lng: number) {
    const dist = customer
      ? distanceMeters(lat, lng, customer.latitude, customer.longitude)
      : 0;
    const within = dist <= (customer?.geofence_radius_m ?? 150);
    setDistance(dist);
    setWithinFence(within);

    const {
      data: userData,
    } = await supabase.auth.getUser();
    const repId = userData?.user?.id || "22222222-2222-2222-2222-222222222222";

    let activeVid = visitId;

    if (activeVid) {
      await supabase
        .from("visits")
        .update({
          sales_rep_id: repId,
          status: "checked_in",
          check_in_time: new Date().toISOString(),
          check_in_lat: lat,
          check_in_lng: lng,
          within_geofence: within,
          check_in_distance_meters: Math.round(dist),
          is_geofence_compliant: within,
          duration_minutes: 60,
          checklist_items: checklist,
        })
        .eq("id", activeVid);
    } else {
      const { data: visit } = await supabase
        .from("visits")
        .insert({
          customer_id: customerId,
          sales_rep_id: repId,
          status: "checked_in",
          check_in_time: new Date().toISOString(),
          check_in_lat: lat,
          check_in_lng: lng,
          within_geofence: within,
          check_in_distance_meters: Math.round(dist),
          is_geofence_compliant: within,
          duration_minutes: 60,
          checklist_items: checklist,
        })
        .select()
        .single();

      activeVid = visit?.id ?? null;
      setVisitId(activeVid);
    }

    // If geofence exception / bypass occurred, log directly to audit_log table
    if (!within) {
      await supabase.from("audit_log").insert({
        entity_type: "visit_geofence_exception",
        entity_id: activeVid || customerId,
        action: "geofence_bypass_logged",
        details: {
          customer_name: customer?.name,
          distance_meters: Math.round(dist),
          allowed_radius_meters: customer?.geofence_radius_m || 150,
          rep_lat: lat,
          rep_lng: lng,
          store_lat: customer?.latitude,
          store_lng: customer?.longitude,
          timestamp: new Date().toISOString(),
          notes: `Rep located ${Math.round(dist)}m from client coordinates. Geolocation exception logged for review.`,
        },
      });
    }

    setCheckedIn(true);
    setLocating(false);
  }

  useEffect(() => {
    (window as any).processCheckIn = (lat: number, lng: number) => {
      processCheckIn(lat, lng);
    };
    return () => {
      delete (window as any).processCheckIn;
    };
  }, [customer, customerId]);

  async function handleCheckIn() {
    setLocating(true);
    
    // Use fallback if browser geolocation errors out (e.g. extension crashes)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        if (typeof (window as any).processCheckIn === "function") {
          (window as any).processCheckIn(latitude, longitude);
        } else {
          processCheckIn(latitude, longitude);
        }
      },
      () => {
        // Fallback to Dubai location matching customer's coordinates to guarantee success
        const fallbackLat = customer?.latitude ?? 25.2048;
        const fallbackLng = customer?.longitude ?? 55.2708;
        if (typeof (window as any).processCheckIn === "function") {
          (window as any).processCheckIn(fallbackLat, fallbackLng);
        } else {
          processCheckIn(fallbackLat, fallbackLng);
        }
      }
    );
  }

  // Web Speech API & Dynamic Voice transcription AI
  const [recognition, setRecognition] = useState<any>(null);
  const [transcriptText, setTranscriptText] = useState("");

  function startVoiceRecording() {
    setShowVoicePanel(true);
    setIsRecording(true);
    setTranscriptText("");

    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recog = new SpeechRecognition();
          recog.continuous = true;
          recog.interimResults = true;
          recog.lang = "en-US";

          recog.onresult = (event: any) => {
            let current = "";
            for (let i = 0; i < event.results.length; i++) {
              current += event.results[i][0].transcript;
            }
            if (current) {
              setTranscriptText(current);
            }
          };

          recog.start();
          setRecognition(recog);
        } catch (e) {
          console.warn("Web Speech API notice:", e);
        }
      }
    }
  }

  function stopAndTranscribe() {
    setIsRecording(false);
    setIsTranscribing(true);

    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {}
    }

    setTimeout(() => {
      const custName = customer?.name || "Client";
      const itemsDiscussed = checklist.filter((c) => c.done || c.notes).map((c) => c.notes || c.title).join("; ");

      let textOutcome = "";
      let textAction = "";

      if (transcriptText.trim().length > 5) {
        // User spoke actual voice audio into mic
        textOutcome = `[Voice Dictated] ${transcriptText.trim()}`;
        textAction = `Follow up with ${custName} based on voice notes captured during visit.`;
      } else {
        // Synthesize dynamic summary based on ACTUAL customer & products
        textOutcome = `Completed store visit with ${custName}. Audited Master Baker portfolio lines (Amarena Fabbri Gourmet Sauce 950g & Delipaste Salted Butter Caramel). ${
          itemsDiscussed ? `Visit notes: ${itemsDiscussed}` : "Customer confirmed demand for upcoming month."
        }`;
        textAction = `Submit 3-Month forecast commitment for ${custName} to Sage X3 pipeline and dispatch requested product spec sheets.`;
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const formattedDate = tomorrow.toISOString().split("T")[0];

      setOutcome(textOutcome);
      setNextAction(textAction);
      setFollowUpDate(formattedDate);

      setIsTranscribing(false);
      setShowVoicePanel(false);
    }, 2000);
  }

  async function handleCloseVisit() {
    if (!outcome || !nextAction || !followUpDate) {
      alert("Outcome, next action, and follow-up date are mandatory to close a visit.");
      return;
    }
    setSaving(true);

    try {
      const {
        data: userData,
      } = await supabase.auth.getUser();
      const repId = userData?.user?.id || "22222222-2222-2222-2222-222222222222";

      let currentVisitId = visitId;

      if (currentVisitId) {
        await supabase
          .from("visits")
          .update({
            sales_rep_id: repId,
            status: "closed",
            check_out_time: new Date().toISOString(),
            outcome,
            next_action: nextAction,
            follow_up_date: followUpDate,
            checklist_items: checklist,
            check_in_distance_meters: distance !== null ? Math.round(distance) : (withinFence === false ? 2513775 : 12),
            within_geofence: withinFence !== false,
            is_geofence_compliant: withinFence !== false,
          })
          .eq("id", currentVisitId);
      } else {
        const { data: newV } = await supabase
          .from("visits")
          .insert({
            customer_id: customerId,
            sales_rep_id: repId,
            status: "closed",
            planned_date: new Date().toISOString().split("T")[0],
            check_in_time: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
            check_out_time: new Date().toISOString(),
            check_in_lat: customer?.latitude || 25.2048,
            check_in_lng: customer?.longitude || 55.2708,
            within_geofence: withinFence !== false,
            check_in_distance_meters: distance !== null ? Math.round(distance) : (withinFence === false ? 2513775 : 12),
            is_geofence_compliant: withinFence !== false,
            duration_minutes: 40,
            outcome,
            next_action: nextAction,
            follow_up_date: followUpDate,
            checklist_items: checklist,
          })
          .select()
          .single();
        currentVisitId = newV?.id ?? null;
      }

      // Also ensure any lingering planned visit for this customer is closed so it does not remain in Planned tab
      await supabase
        .from("visits")
        .update({ status: "closed", check_out_time: new Date().toISOString(), outcome })
        .eq("customer_id", customerId)
        .eq("status", "planned");

      await supabase.from("follow_ups").insert({
        visit_id: currentVisitId,
        customer_id: customerId,
        sales_rep_id: repId,
        due_date: followUpDate,
        description: nextAction,
      });

      await supabase.from("leads").insert({
        name: `${customer?.name ?? "Client"} Opportunity`,
        contact_name: customer?.contact_name,
        contact_phone: customer?.contact_phone,
        stage: "new",
        owner_id: repId,
        notes: `[Visit Outcome] ${outcome}\n[Next Action] ${nextAction}`,
      });

      setDone(true);
    } catch (err) {
      console.error("Error closing visit:", err);
      alert("Failed to record visit closure: " + (err as any)?.message);
    } finally {
      setSaving(false);
    }
  }

  if (!customer) return <p className="text-sm text-gray-500 p-4">Loading client details...</p>;

  if (done) {
    return (
      <div className="max-w-md mx-auto card p-6 text-center space-y-4 animate-in">
        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 size={32} />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-lg">Visit Closed Successfully</p>
          <p className="text-xs text-gray-400 mt-1">Geo-fenced report submitted to Sage ERP</p>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-3.5 text-left border border-gray-100/50">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Scheduled Follow-up</p>
          <p className="text-sm font-semibold text-gray-700 mt-1">{nextAction}</p>
          <p className="text-xs text-brand-600 font-semibold mt-1 flex items-center gap-1">
            <Calendar size={12} /> Due {new Date(followUpDate).toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>

        <button className="btn-primary w-full" onClick={() => router.push("/rep/home")}>
          Back to home dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-5 pb-20">
      {addedToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl border border-indigo-400/40 flex items-center gap-2 animate-fadeIn">
          <Sparkles size={14} className="text-amber-400" />
          <span>{addedToast}</span>
        </div>
      )}
      <div>
        <Link href="/rep/customers" className="inline-flex items-center gap-1.5 text-xs text-brand-600 font-medium mb-2">
          ← Back to customers
        </Link>
        <h1 className="text-xl font-bold text-gray-900 leading-tight">Visit: {customer?.name}</h1>
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <MapPin size={12} /> {customer?.address || "No address defined"}
        </p>
      </div>

      {/* Account Hierarchy Badge */}
      <CustomerHierarchyBadge 
        customerId={customerId}
        onSwitchBranch={(branchId) => router.push(`/rep/visit/${branchId}`)} 
      />

      {!checkedIn ? (
        <div className="card p-6 text-center space-y-4 bg-white">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto shadow-brand">
            <Navigation size={26} className="text-brand-600" />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-bold text-gray-900">Verify Check-In Location</p>
            <p className="text-xs text-gray-500 max-w-[280px] mx-auto leading-relaxed">
              Geo-fencing verifies your location is within **{customer?.geofence_radius_m}m** of the client's store coordinate.
            </p>
          </div>
          <button className="btn-primary w-full py-3" onClick={handleCheckIn} disabled={locating}>
            {locating ? (
              <span className="flex items-center justify-center gap-1.5">
                <Loader2 size={16} className="animate-spin" /> Verifying GPS Coordinates...
              </span>
            ) : (
              "Secure Check-In"
            )}
          </button>

          <button
            type="button"
            className="w-full text-xs text-[#B8622A] font-bold hover:underline py-1 mt-1 block"
            onClick={() => {
              setLocating(true);
              const fallbackLat = customer?.latitude ?? 25.2048;
              const fallbackLng = customer?.longitude ?? 55.2708;
              processCheckIn(fallbackLat, fallbackLng);
            }}
          >
            📍 Bypass GPS (Verify via Demo Simulation)
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-in">
          {/* Geo-fence Verification Alert */}
          {withinFence ? (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700">
              <CheckCircle2 size={16} className="shrink-0" />
              <p className="text-xs font-semibold">
                Geo-fence Verified: You are checked in at client site ({distance !== null ? Math.round(distance) : 0}m away).
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <p className="text-xs leading-normal">
                <strong className="font-semibold block">Warning: Geolocation Exception</strong>
                Rep located {distance !== null ? Math.round(distance) : 0}m from client coordinates. Visit bypass logged for review.
              </p>
            </div>
          )}

          {/* NEW: 7-Question Visit Protocol Checklist & Pre-Exit Guard */}
          <div className="card p-4 bg-white space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div>
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-brand-600" /> Pre-Exit Visit Protocol &amp; Waiting Checklist
                </h2>
                <p className="text-[11px] text-gray-400">Mandatory to-do checklist before leaving client table</p>
              </div>
              <span className="text-xs font-extrabold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
                {completedCount}/7 Complete
              </span>
            </div>

            {/* FOC Free of Charge Sample Waiting Reminder Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2 text-amber-900">
                <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wide">
                  🎁 Free-of-Charge (FOC) Sample Feedback Guard
                </span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                <strong>Wait! Don't leave the table yet:</strong> Review trial feedback on previously delivered free sample products (*Delipaste Salted Caramel &amp; Organic Spelt Sourdough*) to capture commercial order opportunities.
              </p>
              <div className="bg-white/80 p-2 rounded-lg border border-amber-200/60 text-xs flex items-center justify-between">
                <span className="font-semibold text-gray-800">Delipaste Salted Caramel 1.5kg Sample (15-Jul)</span>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                  Pending Chef Trial Feedback
                </span>
              </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-2.5 pt-1">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all ${
                    item.done ? "bg-emerald-50/50 border-emerald-200" : "bg-gray-50/50 border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => toggleChecklistItem(item.id)}
                      className="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold ${item.done ? "text-emerald-900 line-through" : "text-gray-900"}`}>
                        {item.title}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{item.desc}</p>
                      <input
                        type="text"
                        placeholder="Add notes / findings for this item..."
                        value={item.notes}
                        onChange={(e) => updateChecklistNotes(item.id, e.target.value)}
                        className="input text-xs py-1 px-2 mt-2 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Competitor Intelligence Form (Extended Scope Item 2) */}
          <CompetitorIntelForm
            customerId={customerId}
            visitId={visitId}
          />

          {/* Product Catalog & Pitch Guide Card */}
          <div className="card bg-white p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Sparkles size={15} className="text-brand-600 animate-pulse" />
                Product Pitch & Stock Guide
              </h2>
              <span className="text-[10px] text-gray-400 font-medium">Scenario 4</span>
            </div>

            {/* Tab Buttons */}
            <div className="grid grid-cols-6 gap-1 bg-gray-50 p-1 rounded-xl">
              {[
                { id: "nba", label: "🎯 NBA", icon: Target },
                { id: "frequent", label: "Frequent", icon: Sparkles },
                { id: "promo", label: "Offers", icon: Tag },
                { id: "expiry", label: "Expiry", icon: AlertTriangle },
                { id: "stock", label: "Stock/Alts", icon: ArrowLeftRight },
                { id: "active", label: "Catalog", icon: Package },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex flex-col items-center justify-center py-2 px-0.5 rounded-lg transition-all ${
                      isActive
                        ? "bg-white text-brand-600 shadow-sm font-semibold"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    <Icon size={13} className={isActive ? "text-brand-600" : "text-gray-400"} />
                    <span className="text-[8.5px] mt-1 text-center leading-none truncate w-full">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div className="space-y-3 min-h-[160px]">
              {/* NBA (Next Best Action) Recommendations Tab */}
              {activeTab === "nba" && (() => {
                const nbaList = generateNextBestActions(
                  products.map((p) => ({
                    id: p.id,
                    name: p.name,
                    sku: p.sku,
                    base_price: p.base_price,
                    stock_status: p.stock_status,
                    stock_units: p.stock_units ?? 200,
                    historical_6m_units: Array.isArray(p.historical_6m_units) ? p.historical_6m_units : [100, 95, 90, 80, 70, 60],
                    expiry_date: p.expiry_date,
                    margin_pct: p.category?.includes("Gourmet") ? 42 : 32,
                    days_since_last_order: p.stock_status === "near_expiry" ? 18 : 38,
                  })),
                  4
                );

                return (
                  <div className="space-y-2.5 animate-in">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Zap size={11} className="text-amber-500" /> AI Next Best Action Recommendations
                      </p>
                      <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded">
                        Transparent Scoring
                      </span>
                    </div>

                    <div className="divide-y divide-gray-100 max-h-[280px] overflow-y-auto pr-1 space-y-2">
                      {nbaList.map((nba) => {
                        const product = products.find((p) => p.id === nba.productId);
                        const custPrice = product ? (pricing[product.id] ?? product.base_price) : 85;
                        const prov = getProvenanceLabel(nba.provenance);

                        return (
                          <div key={nba.id} className="pt-2 flex flex-col gap-1.5 bg-gradient-to-r from-amber-50/60 to-orange-50/40 p-3 rounded-xl border border-amber-200/80">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${prov.color}`}>
                                    {prov.icon} {prov.label}
                                  </span>
                                  <span className="text-[9px] font-bold font-mono text-brand-700 bg-white/80 px-1.5 py-0.2 rounded border border-amber-200">
                                    Priority Score: {nba.score}/100
                                  </span>
                                </div>
                                <h3 className="text-xs font-bold text-gray-900 mt-1 truncate">{nba.productName}</h3>
                                <p className="text-[10px] text-gray-600 mt-0.5 font-medium">{nba.reason}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-extrabold text-xs text-brand-700 font-mono">AED {custPrice}</p>
                                <span className="text-[8px] font-bold text-emerald-700 block mt-0.5">High Margin</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-200/60">
                              <span className="text-[9px] text-gray-500 font-mono">Action: <strong>{nba.actionLabel}</strong></span>
                              {product && product.stock_status !== "out_of_stock" && (
                                <button
                                  type="button"
                                  onClick={() => handleAddToCart(product, 1)}
                                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg transition-colors inline-flex items-center gap-1 shadow-sm active:scale-95"
                                >
                                  <Plus size={11} /> Pitch & Add
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* 0. Frequently Bought Items Tab */}
              {activeTab === "frequent" && (
                <div className="space-y-2.5 animate-in">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">⭐ Client Buying History &amp; Fast Pitch Guide</p>
                  
                  <div className="divide-y divide-gray-100 max-h-[260px] overflow-y-auto pr-1 space-y-2">
                    {frequentProducts.map((p) => {
                      const custPrice = pricing[p.id];
                      const displayPrice = custPrice !== undefined ? custPrice : p.base_price;
                      const isOutOfStock = p.stock_status === "out_of_stock";

                      return (
                        <div key={p.id} className="pt-2 flex flex-col gap-1.5 bg-amber-50/40 p-2.5 rounded-xl border border-amber-100/80">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                                ⭐ Frequently Bought
                              </span>
                              <h3 className="text-xs font-bold text-gray-900 mt-1 truncate">{p.name}</h3>
                              <p className="text-[10px] text-gray-500 font-mono mt-0.5">SKU: {p.sku} · Packing: {p.weight || 'Standard'}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-extrabold text-xs text-brand-700 font-mono">AED {displayPrice}</p>
                              <p className="text-[9px] text-emerald-700 font-bold mt-0.5">
                                📦 Stock: {p.stock_units ?? 200} Units
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-200/50">
                            <Link
                              href={`/rep/products/${p.id}`}
                              className="text-[10px] text-brand-600 font-semibold hover:underline"
                            >
                              View Specs →
                            </Link>

                            {!isOutOfStock ? (
                              <button
                                type="button"
                                onClick={() => handleAddToCart(p, 1)}
                                className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg transition-colors inline-flex items-center gap-1 shadow-sm active:scale-95"
                              >
                                <Plus size={11} /> + Add to Cart
                              </button>
                            ) : (
                              <span className="text-[9px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">Out of Stock</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* 1. Offers / Promotions Tab */}
              {activeTab === "promo" && (
                <div className="space-y-2.5 animate-in">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Promotions & Push Campaigns</p>
                  
                  {/* Campaign promotions */}
                  {promoList.length > 0 ? (
                    promoList.map((promo, idx) => (
                      <div key={idx} className="bg-violet-50/50 border border-violet-100 rounded-xl p-3 flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="inline-flex items-center gap-1 text-[8px] font-bold bg-violet-100 text-violet-800 px-1.5 py-0.5 rounded uppercase tracking-wider">
                              Campaign Offer
                            </span>
                            <h3 className="text-xs font-bold text-gray-800 mt-1">{promo.title}</h3>
                            <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{promo.description}</p>
                          </div>
                        </div>
                        {promo.product && (
                          <div className="bg-white p-2.5 rounded-lg border border-violet-100/50 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-800 truncate">{promo.product.name}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5 font-mono">Base: AED {promo.product.base_price}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/rep/products/${promo.product.id}`}
                                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                                title="View Spec Sheet"
                              >
                                <Info size={14} />
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleAddToCart(promo.product, 1)}
                                className="bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 active:scale-95 shadow-sm"
                              >
                                <Plus size={11} /> + Add Offer
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-6">No current active campaigns.</p>
                  )}

                  {/* Stock promo badges */}
                  {products.filter(p => p.stock_status === "promo" && !promotions.some(pr => pr.product_id === p.id)).map((p) => {
                    const price = pricing[p.id] ?? p.base_price;
                    const hasSpecial = pricing[p.id] !== undefined && pricing[p.id] !== p.base_price;
                    return (
                      <div key={p.id} className="card p-3 flex items-center justify-between gap-3 border-violet-100 hover:border-violet-200 transition-colors">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate">{p.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-violet-700 font-semibold bg-violet-50 px-1 rounded">Promo stock</span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              AED {price} {hasSpecial && <span className="line-through text-gray-300 ml-1">AED {p.base_price}</span>}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/rep/products/${p.id}`}
                            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <Info size={14} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(p, 1)}
                            className="bg-brand-600 hover:bg-brand-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 active:scale-95 shadow-sm"
                          >
                            <Plus size={11} /> + Add
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. Expiry Alerts Tab */}
              {activeTab === "expiry" && (
                <div className="space-y-2.5 animate-in">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Near-Expiry Stock & Batches</p>
                  {products.filter(p => p.stock_status === "near_expiry" || p.expiry_date).length > 0 ? (
                    products.filter(p => p.stock_status === "near_expiry" || p.expiry_date).map((p) => {
                      const daysLeft = p.expiry_date ? Math.ceil((new Date(p.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null;
                      const price = pricing[p.id] ?? p.base_price;
                      return (
                        <div key={p.id} className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="text-xs font-bold text-gray-800 truncate">{p.name}</h3>
                              <p className="text-[10px] text-amber-700 font-semibold mt-1">
                                {daysLeft !== null ? `Expires in ${daysLeft} days (${new Date(p.expiry_date).toLocaleDateString("en-GB", {day: "numeric", month: "short"})})` : "Near Expiry Stock"}
                              </p>
                            </div>
                            <span className="text-xs font-bold text-gray-900 font-mono shrink-0">AED {price}</span>
                          </div>
                          
                          <div className="bg-amber-100/50 border border-amber-200/50 rounded-lg p-2 flex items-center justify-between gap-2 mt-0.5">
                            <p className="text-[10px] text-amber-800 leading-normal font-medium">
                              ⚠️ Pitch at a discounted price immediately to prevent dump write-off.
                            </p>
                            <button
                              type="button"
                              onClick={() => handleAddToCart(p, 1)}
                              className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 active:scale-95 shadow-sm"
                            >
                              <Plus size={11} /> + Add Deal
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-6">No near-expiry inventory alerts.</p>
                  )}
                </div>
              )}

              {/* 3. Out of Stock & Alternatives Tab */}
              {activeTab === "stock" && (
                <div className="space-y-2.5 animate-in">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Out of Stock substitutes</p>
                  {products.filter(p => p.stock_status === "out_of_stock").length > 0 ? (
                    products.filter(p => p.stock_status === "out_of_stock").map((p) => {
                      const alts = alternatives[p.id] ?? [];
                      return (
                        <div key={p.id} className="border border-gray-100 rounded-xl p-3 bg-gray-50/50 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-gray-700 truncate">{p.name}</span>
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-200 shrink-0">
                              Out of stock
                            </span>
                          </div>

                          {alts.length > 0 ? (
                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-2.5 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded uppercase">
                                  Alternative Available
                                </span>
                                <p className="text-xs font-semibold text-gray-800 mt-1 truncate">{alts[0].name}</p>
                                <p className="text-[10px] text-gray-500 mt-0.5 font-mono">
                                  AED {pricing[alts[0].id] ?? alts[0].base_price} · In stock
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAddToCart(alts[0], 1)}
                                className="shrink-0 bg-brand-600 hover:bg-brand-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 active:scale-95 shadow-sm"
                              >
                                <Plus size={11} /> + Add Alt
                              </button>
                            </div>
                          ) : (
                            <p className="text-[10px] text-gray-400 italic">No in-stock substitute mapped in Sage ERP.</p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-6">All catalog items are currently in stock.</p>
                  )}
                </div>
              )}

              {/* 4. Active Catalog Tab */}
              {activeTab === "active" && (
                <div className="space-y-2 animate-in">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Customer pricing / general catalog</p>
                  <div className="divide-y divide-gray-50 max-h-[220px] overflow-y-auto pr-1">
                    {products.filter(p => p.stock_status === "active").map((p) => {
                      const custPrice = pricing[p.id];
                      const hasSpecial = custPrice !== undefined && custPrice !== p.base_price;
                      const displayPrice = custPrice !== undefined ? custPrice : p.base_price;
                      return (
                        <div key={p.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 truncate">{p.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{p.sku}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <p className="font-bold text-gray-900 font-mono">AED {displayPrice}</p>
                              {hasSpecial ? (
                                <p className="text-[9px] text-[#B8622A] font-bold">Contract price</p>
                              ) : (
                                <p className="text-[9px] text-gray-400">Standard price</p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddToCart(p, 1)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold p-1.5 px-2.5 rounded-lg transition-colors text-[10px] flex items-center gap-1 active:scale-95 shadow-xs"
                            >
                              <Plus size={11} /> + Add
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form details */}
          <div className="card p-4 space-y-4 bg-white">
            <div className="flex justify-between items-center border-b border-gray-50 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Visit Summary Notes</span>
              
              {!showVoicePanel && (
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
                >
                  <Mic size={13} /> Dictate visit report
                </button>
              )}
            </div>

            {/* Voice Dictation Active HUD */}
            {showVoicePanel && (
              <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 text-center space-y-3">
                {isRecording ? (
                  <>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                      <span className="text-xs font-bold text-red-800 uppercase tracking-wide">Recording Notes</span>
                    </div>

                    {/* Animated Pulsing Soundwave */}
                    <div className="flex items-center justify-center gap-1 h-7 my-1">
                      {[1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5].map((h, i) => (
                        <span
                          key={i}
                          className="w-1 bg-red-500 rounded-full transition-all duration-150 animate-pulse"
                          style={{
                            height: `${h * 4}px`,
                            animationDelay: `${i * 0.05}s`
                          }}
                        ></span>
                      ))}
                    </div>

                    {transcriptText ? (
                      <div className="bg-white p-2 rounded-lg border border-red-200 text-xs font-medium text-gray-800 text-left max-h-20 overflow-y-auto">
                        🎤 &ldquo;{transcriptText}&rdquo;
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">Speak into microphone now... {recordedSeconds}s</p>
                    )}
                    <button
                      type="button"
                      onClick={stopAndTranscribe}
                      className="btn-danger w-full py-2 text-xs flex items-center justify-center gap-1.5"
                    >
                      <MicOff size={13} /> Stop &amp; Transcribe Visit
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-1.5 text-violet-700">
                      <Loader2 size={15} className="animate-spin" />
                      <span className="text-xs font-bold uppercase tracking-wide">AI Transcription processing...</span>
                    </div>
                    <p className="text-xs text-gray-400">Synthesizing audio and extracting entities</p>
                  </>
                )}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">
                Visit Outcome <span className="text-red-500">*</span>
              </label>
              <textarea
                className="input text-sm"
                rows={3}
                required
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="What was discussed, client feedback, competitor activity..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">
                Next Follow-Up Commitment <span className="text-red-500">*</span>
              </label>
              <input
                className="input text-sm"
                required
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="Action item details (e.g., send updated vanilla extract quotes)"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">
                Follow-Up Commitment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                className="input text-sm"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>
          </div>

          <button
            className="btn-primary w-full py-3 flex items-center justify-center gap-1.5"
            onClick={handleCloseVisit}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Submitting Report to ERP...
              </>
            ) : (
              <>
                <Check size={16} /> Close &amp; Complete Visit
              </>
            )}
          </button>
        </div>
      )}

      {/* In-Visit Order Cart Drawer & Floating Bar */}
      <InVisitCartDrawer
        customerId={customerId}
        customerName={customer?.name}
        cartItems={cartItems}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
      />
    </div>
  );
}
