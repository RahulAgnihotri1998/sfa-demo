"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Search, MapPin, ChevronRight, Navigation, Globe, Map, List, CheckCircle2, AlertTriangle, Network, Building2 } from "lucide-react";
import { getAccountHierarchy } from "@/lib/hierarchy/accountHierarchy";
import ExportExcelButton from "@/components/ExportExcelButton";

// Dynamically import map component with SSR disabled
const CustomerMap = dynamic(() => import("@/components/CustomerMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[450px] bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center text-sm text-gray-400">
      Loading Interactive Map...
    </div>
  ),
});

// Haversine distance calculator
function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function CustomersPage() {
  const supabase = createClient();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [query, setQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [selectedTerritory, setSelectedTerritory] = useState("All");
  const [viewTab, setViewTab] = useState<"list" | "map">("list");

  // GPS Geolocation parameters
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [sortingNearby, setSortingNearby] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    supabase
      .from("customers")
      .select("id, name, territory, country, status, open_items_amount, latitude, longitude, address")
      .order("name")
      .then(({ data }) => {
        setCustomers(data ?? []);
        setLoading(false);
      });
  }, []);

  // Request browser geolocation to find nearby customers
  function enableNearbySorting() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);

    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (pos && pos.coords) {
            setUserLat(pos.coords.latitude);
            setUserLng(pos.coords.longitude);
            setSortingNearby(true);
          } else {
            // Fallback
            setUserLat(25.2048);
            setUserLng(55.2708);
            setSortingNearby(true);
          }
          setLocating(false);
        },
        (err) => {
          console.warn("Geolocation warning:", err);
          // Fallback to default location so the demo still works
          setUserLat(25.2048);
          setUserLng(55.2708);
          setSortingNearby(true);
          setLocating(false);
        },
        { enableHighAccuracy: false, timeout: 4000, maximumAge: 0 }
      );
    } catch (e) {
      console.warn("Caught geolocation runtime error (likely from location-spoofing Chrome extension):", e);
      // Fallback to default location
      setUserLat(25.2048);
      setUserLng(55.2708);
      setSortingNearby(true);
      setLocating(false);
    }
  }

  function disableNearbySorting() {
    setSortingNearby(false);
  }

  // Get unique lists of Countries and Territories for the dropdown filters
  const countriesList = ["All", ...Array.from(new Set(customers.map((c) => c.country).filter(Boolean)))];
  const territoriesList = ["All", ...Array.from(new Set(customers.map((c) => c.territory).filter(Boolean)))];

  // Map and process customers, appending distances if GPS available
  const processedCustomers = customers.map((c) => {
    if (userLat !== null && userLng !== null && c.latitude && c.longitude) {
      const distance = haversineDistanceKm(userLat, userLng, c.latitude, c.longitude);
      return { ...c, distance };
    }
    return c;
  });

  // Filter list
  let filtered = processedCustomers.filter((c) => {
    const q = query.toLowerCase();
    const matchesQuery = !q || c.name?.toLowerCase().includes(q) || c.address?.toLowerCase().includes(q);
    const matchesCountry = selectedCountry === "All" || c.country === selectedCountry;
    const matchesTerritory = selectedTerritory === "All" || c.territory === selectedTerritory;
    return matchesQuery && matchesCountry && matchesTerritory;
  });

  // Sort list by distance if active
  if (sortingNearby && userLat !== null && userLng !== null) {
    filtered.sort((a, b) => {
      const distA = a.distance ?? 99999;
      const distB = b.distance ?? 99999;
      return distA - distB;
    });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Customers</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage accounts & check-ins</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportExcelButton
            data={filtered.map((c) => {
              const hier = getAccountHierarchy(c.id);
              return {
                "Customer Name": c.name,
                "Group / Hierarchy": hier.group.group_name,
                "Territory": c.territory,
                "Country": c.country,
                "Status": c.status === "at_risk" ? "At Risk" : "Active",
                "Open AR Receivables (AED)": c.open_items_amount || 0,
                "Address": c.address || "—",
                "Distance (km)": c.distance !== undefined ? Number(c.distance.toFixed(1)) : "—",
              };
            })}
            filename="Customer-Accounts-Directory"
            sheetName="Customers"
          />
          <Link href="/rep/customers/new" className="btn-primary py-1.5 px-3 text-xs">
            + Add Customer
          </Link>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setViewTab("list")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            viewTab === "list"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          <List size={14} />
          List View
        </button>
        <button
          onClick={() => setViewTab("map")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            viewTab === "map"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          <Map size={14} />
          Map View
        </button>
      </div>

      {/* Search & Location Sort Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            className="input pl-9"
            placeholder="Search customer name or address…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Nearby locator toggle */}
        <div className="flex gap-2">
          {!sortingNearby ? (
            <button
              onClick={enableNearbySorting}
              disabled={locating}
              className="btn-secondary w-full py-2.5 text-xs flex items-center justify-center gap-1.5"
            >
              <Navigation size={13} className={locating ? "animate-spin" : ""} />
              {locating ? "Locating..." : "Find Nearby Customers"}
            </button>
          ) : (
            <button
              onClick={disableNearbySorting}
              className="btn-primary bg-violet-600 hover:bg-violet-700 w-full py-2.5 text-xs flex items-center justify-center gap-1.5"
            >
              <Navigation size={13} className="rotate-45" />
              Showing Nearby First (Clear)
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Filters (Country & Territory) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
            Country
          </label>
          <div className="relative">
            <Globe size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              className="input pl-8 py-2 text-xs"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              {countriesList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
            Territory / State
          </label>
          <div className="relative">
            <MapPin size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              className="input pl-8 py-2 text-xs"
              value={selectedTerritory}
              onChange={(e) => setSelectedTerritory(e.target.value)}
            >
              {territoriesList.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Render Map View or List View */}
      {viewTab === "map" ? (
        <div className="space-y-2 animate-in">
          {loading ? (
            <div className="w-full h-[450px] bg-gray-50 rounded-2xl flex items-center justify-center text-sm text-gray-400">
              Loading Map View...
            </div>
          ) : (
            <CustomerMap customers={filtered} userLat={userLat} userLng={userLng} />
          )}
        </div>
      ) : (
        <div className="space-y-2 animate-in">
          {loading && (
            <div className="card p-6 text-center text-sm text-gray-400">Loading customers...</div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="card p-6 text-center text-sm text-gray-400">
              No customers match your criteria.
            </div>
          )}

          {filtered.map((c) => {
            const isNearby = c.distance !== undefined && c.distance <= 5;
            return (
              <Link
                key={c.id}
                href={`/rep/customers/${c.id}`}
                className="card-hover p-4 flex items-center gap-3 bg-white"
              >
                {/* Initial Badge */}
                <div className="w-9 h-9 avatar flex-shrink-0 text-xs">
                  {c.name.slice(0, 2).toUpperCase()}
                </div>

                {/* Main details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                    <div className="flex gap-1.5 items-center shrink-0">
                      {c.status === "at_risk" ? (
                        <span className="badge-risk">At risk</span>
                      ) : (
                        <span className="badge-ok">Active</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.2 rounded-md">
                      <Network size={10} /> {getAccountHierarchy(c.id).group.group_name.split(" (")[0]}
                    </span>
                    <span className="flex items-center gap-0.5 text-xs text-gray-400">
                      <MapPin size={11} className="text-gray-400" />
                      {c.territory}, {c.country}
                    </span>
                    {c.distance !== undefined && (
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          isNearby ? "bg-violet-50 text-violet-700" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        📍 {c.distance.toFixed(1)} km away {isNearby && "• Nearby"}
                      </span>
                    )}
                  </div>

                  {c.open_items_amount > 0 && (
                    <p className="text-xs text-warn mt-1">Open items: AED {c.open_items_amount}</p>
                  )}
                </div>

                <ChevronRight size={15} className="text-gray-300 flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
