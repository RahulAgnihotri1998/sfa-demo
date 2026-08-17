"use client";

import { useEffect, useState, useMemo } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { 
  Building2, 
  Store, 
  MapPin, 
  Navigation, 
  Calendar, 
  ShoppingCart, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
  Compass
} from "lucide-react";
import Link from "next/link";
import { CORPORATE_GROUPS, CorporateGroup, HierarchyBranchNode } from "@/lib/hierarchy/accountHierarchy";

// Haversine formula to compute km distance
function computeHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export interface MapStoreItem {
  id: string;
  name: string;
  code: string;
  type: "headquarters" | "branch";
  group_id: string;
  group_name: string;
  territory: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  contact_name: string;
  contact_phone: string;
  credit_limit: number;
  outstanding: number;
  status: "active" | "at_risk" | "dormant";
  is_flagship?: boolean;
  distanceKm?: number;
}

interface VisitHierarchyMapProps {
  onSelectStoreToPlan?: (storeId: string, storeName: string) => void;
  onSelectStoreToVisit?: (storeId: string) => void;
}

// Controller to auto-fit map view
function MapBoundsController({
  items,
  userLat,
  userLng,
  selectedStore,
}: {
  items: MapStoreItem[];
  userLat: number | null;
  userLng: number | null;
  selectedStore: MapStoreItem | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedStore && selectedStore.latitude && selectedStore.longitude) {
      map.setView([selectedStore.latitude, selectedStore.longitude], 14, { animate: true });
      return;
    }

    const points: L.LatLngExpression[] = [];
    if (userLat && userLng) {
      points.push([userLat, userLng]);
    }
    items.forEach((item) => {
      if (item.latitude && item.longitude) {
        points.push([item.latitude, item.longitude]);
      }
    });

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [items, userLat, userLng, selectedStore, map]);

  return null;
}

export default function VisitHierarchyMap({
  onSelectStoreToPlan,
  onSelectStoreToVisit,
}: VisitHierarchyMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(25.2048); // Dubai default
  const [userLng, setUserLng] = useState<number | null>(55.2708);
  const [locating, setLocating] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const [selectedTier, setSelectedTier] = useState<"all" | "hq" | "branch">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState<MapStoreItem | null>(null);

  useEffect(() => {
    setIsMounted(true);

    // Try to obtain real device GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (pos && pos.coords) {
            setUserLat(pos.coords.latitude);
            setUserLng(pos.coords.longitude);
          }
        },
        () => {},
        { enableHighAccuracy: false, timeout: 4000 }
      );
    }
  }, []);

  const requestGpsLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (pos && pos.coords) {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
        }
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Flatten all corporate groups + child branches into a unified store directory
  const allStores: MapStoreItem[] = useMemo(() => {
    const list: MapStoreItem[] = [];

    CORPORATE_GROUPS.forEach((group) => {
      // 1. Group Corporate HQ (represented by first branch coordinates or slight offset)
      const primaryBranch = group.branches[0];
      if (primaryBranch) {
        list.push({
          id: `hq-${group.group_id}`,
          name: group.group_name,
          code: group.group_code,
          type: "headquarters",
          group_id: group.group_id,
          group_name: group.group_name,
          territory: "Executive Corporate HQ",
          city: "Dubai",
          address: group.hq_address,
          latitude: primaryBranch.latitude + 0.0035, // Slightly offset so HQ pin sits prominently above first branch
          longitude: primaryBranch.longitude + 0.0035,
          contact_name: group.hq_contact_name,
          contact_phone: group.hq_contact_phone,
          credit_limit: group.group_credit_limit,
          outstanding: group.group_outstanding,
          status: "active",
          is_flagship: true,
        });
      }

      // 2. Child Outlets / Branches
      group.branches.forEach((branch) => {
        list.push({
          id: branch.id,
          name: branch.name,
          code: branch.code,
          type: "branch",
          group_id: group.group_id,
          group_name: group.group_name,
          territory: branch.territory,
          city: branch.city,
          address: branch.address,
          latitude: branch.latitude,
          longitude: branch.longitude,
          contact_name: branch.contact_name,
          contact_phone: branch.contact_phone,
          credit_limit: branch.individual_credit_limit,
          outstanding: branch.individual_outstanding,
          status: branch.status,
          is_flagship: branch.is_flagship,
        });
      });
    });

    // Compute distance from user if GPS available
    return list.map((store) => {
      if (userLat && userLng && store.latitude && store.longitude) {
        return {
          ...store,
          distanceKm: computeHaversineKm(userLat, userLng, store.latitude, store.longitude),
        };
      }
      return store;
    });
  }, [userLat, userLng]);

  // Filtered stores
  const filteredStores = useMemo(() => {
    return allStores.filter((store) => {
      const matchGroup = selectedGroupId === "all" || store.group_id === selectedGroupId;
      const matchTier =
        selectedTier === "all" ||
        (selectedTier === "hq" && store.type === "headquarters") ||
        (selectedTier === "branch" && store.type === "branch");
      const matchQuery =
        !searchQuery ||
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.group_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.territory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchGroup && matchTier && matchQuery;
    });
  }, [allStores, selectedGroupId, selectedTier, searchQuery]);

  // Set default selected store if none selected
  useEffect(() => {
    if (!selectedStore && filteredStores.length > 0) {
      setSelectedStore(filteredStores[0]);
    }
  }, [filteredStores, selectedStore]);

  // Custom Markers
  const createStorePinIcon = (store: MapStoreItem, isSelected: boolean) => {
    const isHQ = store.type === "headquarters";
    const isAtRisk = store.status === "at_risk";

    let bgGrad = isHQ
      ? "bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-amber-300"
      : isAtRisk
      ? "bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-red-300"
      : "bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-indigo-300";

    const ringEffect = isSelected
      ? "ring-4 ring-orange-500 scale-125 z-50 animate-bounce"
      : "hover:scale-110";

    return L.divIcon({
      className: "custom-hierarchy-store-marker",
      html: `
        <div class="relative flex flex-col items-center cursor-pointer transition-transform duration-200 ${ringEffect}">
          <div class="w-8 h-8 rounded-xl ${bgGrad} flex items-center justify-center shadow-lg border-2 border-white">
            ${isHQ ? "⭐" : isAtRisk ? "⚠️" : "🏢"}
          </div>
          <div class="w-2 h-2 rotate-45 -mt-1 bg-gray-800 border-r border-b border-white"></div>
        </div>
      `,
      iconSize: [36, 42],
      iconAnchor: [18, 42],
      popupAnchor: [0, -40],
    });
  };

  const repLocationIcon = L.divIcon({
    className: "rep-gps-pulse-marker",
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-12 h-12 rounded-full bg-blue-500/25 animate-ping"></div>
        <div class="w-9 h-9 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white shadow-xl">
          📍
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  if (!isMounted) {
    return (
      <div className="w-full h-[520px] bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
        <span>Initializing Territory &amp; Store Map…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* FILTER & HIERARCHY CONTROLS */}
      <div className="bg-white border border-[#E7E2D9] rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#B8622A]">
              <Sparkles size={13} />
              <span>Interactive Store Selector &amp; Map</span>
            </div>
            <h2 className="text-base font-bold text-[#1C2321]">
              Select Client Store directly from Map (HQ &amp; Child Branches)
            </h2>
            <p className="text-xs text-[#9A988C]">
              Click any store pin on the territory map to inspect corporate balance, navigate, or initiate a store check-in.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={requestGpsLocation}
              disabled={locating}
              className="px-3 py-1.5 rounded-lg bg-[#FAF8F4] border border-[#E7E2D9] hover:bg-slate-100 text-xs font-bold text-[#1C2321] flex items-center gap-1.5 transition-colors"
            >
              <Compass size={13} className={locating ? "animate-spin text-[#B8622A]" : "text-[#B8622A]"} />
              <span>{locating ? "Locating..." : "My GPS Location"}</span>
            </button>

            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-800 rounded-md border border-indigo-200 font-mono">
              {filteredStores.length} Stores Found
            </span>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#E7E2D9]">
          {/* 1. Corporate Group Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-[#9A988C] flex items-center gap-1">
              <Building2 size={11} /> Corporate Holding Group
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full h-9 rounded-md border border-[#E7E2D9] bg-white px-2.5 text-xs text-[#1C2321] focus:outline-none focus:ring-1 focus:ring-[#B8622A] font-medium"
            >
              <option value="all">🌐 All Corporate Groups ({CORPORATE_GROUPS.length})</option>
              {CORPORATE_GROUPS.map((g) => (
                <option key={g.group_id} value={g.group_id}>
                  {g.group_name} ({g.branches.length} branches)
                </option>
              ))}
            </select>
          </div>

          {/* 2. Hierarchy Level Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-[#9A988C] flex items-center gap-1">
              <Layers size={11} /> Store Hierarchy Level
            </label>
            <div className="grid grid-cols-3 gap-1 bg-[#FAF8F4] p-0.5 rounded-md border border-[#E7E2D9]">
              <button
                type="button"
                onClick={() => setSelectedTier("all")}
                className={`py-1 text-[10px] font-bold rounded ${
                  selectedTier === "all" ? "bg-white text-[#B8622A] shadow-xs" : "text-[#9A988C]"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelectedTier("hq")}
                className={`py-1 text-[10px] font-bold rounded ${
                  selectedTier === "hq" ? "bg-white text-[#B8622A] shadow-xs" : "text-[#9A988C]"
                }`}
              >
                ⭐ HQs
              </button>
              <button
                type="button"
                onClick={() => setSelectedTier("branch")}
                className={`py-1 text-[10px] font-bold rounded ${
                  selectedTier === "branch" ? "bg-white text-[#B8622A] shadow-xs" : "text-[#9A988C]"
                }`}
              >
                🏢 Outlets
              </button>
            </div>
          </div>

          {/* 3. Search input */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-[#9A988C] flex items-center gap-1">
              <Search size={11} /> Search Store / Area
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#B4B2A9]" />
              <input
                type="text"
                placeholder="Filter by store, territory, or area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 rounded-md border border-[#E7E2D9] bg-white pl-8 pr-2.5 text-xs text-[#1C2321] focus:outline-none focus:ring-1 focus:ring-[#B8622A]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* MAP + SIDEBAR DETAIL SPLIT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* MAP CONTAINER (8 Columns on desktop) */}
        <div className="lg:col-span-8 bg-white border border-[#E7E2D9] rounded-2xl overflow-hidden shadow-sm relative">
          <div className="h-[460px] w-full">
            <MapContainer
              center={userLat && userLng ? [userLat, userLng] : [25.2048, 55.2708]}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Rep GPS Marker */}
              {userLat && userLng && (
                <Marker position={[userLat, userLng]} icon={repLocationIcon}>
                  <Popup>
                    <div className="p-1 text-center">
                      <p className="font-bold text-xs text-blue-700">📍 You Are Here</p>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">Live Rep GPS Beacon</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Store & Branch Markers */}
              {filteredStores.map((store) => {
                if (!store.latitude || !store.longitude) return null;
                const isSelected = selectedStore?.id === store.id;

                return (
                  <Marker
                    key={store.id}
                    position={[store.latitude, store.longitude]}
                    icon={createStorePinIcon(store, isSelected)}
                    eventHandlers={{
                      click: () => {
                        setSelectedStore(store);
                      },
                    }}
                  >
                    <Popup>
                      <div className="p-2 space-y-2 min-w-[210px] max-w-[240px]">
                        <div>
                          <div className="flex items-center gap-1">
                            <span
                              className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                store.type === "headquarters"
                                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                                  : "bg-indigo-100 text-indigo-900 border border-indigo-200"
                              }`}
                            >
                              {store.type === "headquarters" ? "⭐ Corporate HQ" : "🏢 Child Branch"}
                            </span>
                            {store.distanceKm !== undefined && (
                              <span className="text-[9px] text-gray-500 font-mono ml-auto">
                                📍 {store.distanceKm} km
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-xs text-gray-900 mt-1 leading-tight">{store.name}</h4>
                          <p className="text-[10px] text-gray-500 mt-0.5 font-medium">{store.group_name}</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">{store.address}</p>
                        </div>

                        <div className="pt-1.5 border-t border-gray-100 grid grid-cols-2 gap-1 text-[10px]">
                          <div className="bg-slate-50 p-1 rounded">
                            <span className="text-[8px] text-gray-400 block font-semibold">Open AR</span>
                            <span className="font-bold text-amber-700 font-mono">AED {store.outstanding.toLocaleString()}</span>
                          </div>
                          <div className="bg-slate-50 p-1 rounded">
                            <span className="text-[8px] text-gray-400 block font-semibold">Credit Limit</span>
                            <span className="font-bold text-slate-800 font-mono">AED {store.credit_limit.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="pt-1 border-t border-gray-100 flex flex-col gap-1">
                          <Link
                            href={`/rep/visit/${store.id.replace('hq-', '')}`}
                            className="w-full py-1 text-center font-bold text-[10px] bg-brand-600 hover:bg-brand-700 text-white rounded transition-colors"
                          >
                            🚀 Start Visit Check-In
                          </Link>
                          {onSelectStoreToPlan && (
                            <button
                              type="button"
                              onClick={() => onSelectStoreToPlan(store.id.replace('hq-', ''), store.name)}
                              className="w-full py-1 text-center font-bold text-[10px] bg-slate-100 hover:bg-slate-200 text-gray-800 rounded transition-colors"
                            >
                              📅 Plan Visit Slot
                            </button>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              <MapBoundsController
                items={filteredStores}
                userLat={userLat}
                userLng={userLng}
                selectedStore={selectedStore}
              />
            </MapContainer>
          </div>

          {/* Map Legend */}
          <div className="absolute bottom-2.5 left-2.5 z-40 bg-white/95 backdrop-blur-sm border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm text-[10px] flex items-center gap-3">
            <div className="flex items-center gap-1 text-slate-700 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span> You
            </div>
            <div className="flex items-center gap-1 text-amber-800 font-semibold">
              <span>⭐</span> Main Corporate HQ
            </div>
            <div className="flex items-center gap-1 text-indigo-800 font-semibold">
              <span>🏢</span> Child Branch
            </div>
            <div className="flex items-center gap-1 text-rose-700 font-semibold">
              <span>⚠️</span> At-Risk Credit
            </div>
          </div>
        </div>

        {/* SIDEBAR: SELECTED STORE DOSSIER & QUICK ACTIONS (4 Columns on desktop) */}
        <div className="lg:col-span-4 bg-white border border-[#E7E2D9] rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3">
          {selectedStore ? (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-start justify-between gap-2 border-b border-[#E7E2D9] pb-3">
                <div>
                  <span
                    className={`inline-flex items-center gap-1 text-[8.5px] font-bold uppercase px-2 py-0.5 rounded ${
                      selectedStore.type === "headquarters"
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : "bg-indigo-100 text-indigo-900 border border-indigo-200"
                    }`}
                  >
                    {selectedStore.type === "headquarters" ? "⭐ Main Corporate HQ" : "🏢 Child Branch"}
                  </span>
                  <h3 className="text-sm font-bold text-[#1C2321] mt-1">{selectedStore.name}</h3>
                  <p className="text-[11px] text-[#9A988C] font-semibold flex items-center gap-1 mt-0.5">
                    <Building2 size={11} className="text-[#B8622A]" /> {selectedStore.group_name}
                  </p>
                </div>

                {selectedStore.distanceKm !== undefined && (
                  <div className="text-right shrink-0 bg-[#FAF8F4] border border-[#E7E2D9] px-2 py-1 rounded-md">
                    <span className="text-[9px] text-[#9A988C] block uppercase font-bold">Distance</span>
                    <span className="text-xs font-bold text-[#B8622A] font-mono">
                      📍 {selectedStore.distanceKm} km
                    </span>
                  </div>
                )}
              </div>

              {/* Store Details Box */}
              <div className="space-y-2 text-xs">
                <div className="bg-[#FAF8F4] p-2.5 rounded-lg border border-[#E7E2D9] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[10px] text-[#9A988C] font-semibold">Store Code:</span>
                    <span className="font-mono font-bold text-[#1C2321]">{selectedStore.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-[#9A988C] font-semibold">Territory:</span>
                    <span className="font-semibold text-[#1C2321]">{selectedStore.territory}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-[#9A988C] font-semibold">Store Contact:</span>
                    <span className="font-semibold text-[#1C2321]">{selectedStore.contact_name} ({selectedStore.contact_phone})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-[#9A988C] font-semibold">Address:</span>
                    <span className="text-[11px] text-[#1C2321] text-right max-w-[170px] truncate">{selectedStore.address}</span>
                  </div>
                </div>

                {/* Credit & AR Bar */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                    <span className="text-[9px] text-gray-500 font-bold uppercase block">Credit Limit</span>
                    <span className="text-xs font-bold text-slate-800 font-mono mt-0.5 block">
                      AED {selectedStore.credit_limit.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                    <span className="text-[9px] text-gray-500 font-bold uppercase block">Outstanding AR</span>
                    <span className="text-xs font-bold text-amber-700 font-mono mt-0.5 block">
                      AED {selectedStore.outstanding.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-[#E7E2D9]">
                <Link
                  href={`/rep/visit/${selectedStore.id.replace('hq-', '')}`}
                  className="w-full py-2.5 px-3 rounded-lg text-xs font-bold text-white bg-[#B8622A] hover:bg-[#A05220] flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98"
                >
                  <Navigation size={13} />
                  <span>Start Field Visit Check-In</span>
                </Link>

                <div className="grid grid-cols-2 gap-2">
                  {onSelectStoreToPlan && (
                    <button
                      type="button"
                      onClick={() => onSelectStoreToPlan(selectedStore.id.replace('hq-', ''), selectedStore.name)}
                      className="py-2 px-2 rounded-lg text-[11px] font-bold text-gray-800 bg-gray-100 hover:bg-gray-200 flex items-center justify-center gap-1 transition-colors"
                    >
                      <Calendar size={12} className="text-[#B8622A]" />
                      <span>Schedule Visit</span>
                    </button>
                  )}

                  <Link
                    href={`/rep/order/new?customer=${selectedStore.id.replace('hq-', '')}`}
                    className="py-2 px-2 rounded-lg text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 flex items-center justify-center gap-1 transition-colors text-center"
                  >
                    <ShoppingCart size={12} />
                    <span>New Order</span>
                  </Link>
                </div>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStore.latitude},${selectedStore.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-1.5 text-center text-[10px] font-semibold text-gray-500 hover:text-gray-800 flex items-center justify-center gap-1 transition-colors"
                >
                  <span>🧭 Open in Google Maps</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 text-xs">
              <MapPin size={24} className="text-gray-300 mb-2" />
              <p className="font-semibold text-gray-600">No Store Selected</p>
              <p className="text-[11px] mt-1 text-gray-400">Click any HQ or child branch marker on the map to view full account dossier.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
