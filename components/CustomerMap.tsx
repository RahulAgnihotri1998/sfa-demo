"use client";

import { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface CustomerMapProps {
  customers: any[];
  userLat: number | null;
  userLng: number | null;
}

// Center maps and fit bounds
function MapController({ customers, userLat, userLng }: CustomerMapProps) {
  const map = useMap();

  useEffect(() => {
    if (customers.length === 0) return;

    const points: L.LatLngExpression[] = [];
    if (userLat && userLng) {
      points.push([userLat, userLng]);
    }
    customers.forEach((c) => {
      if (c.latitude && c.longitude) {
        points.push([c.latitude, c.longitude]);
      }
    });

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [customers, userLat, userLng, map]);

  return null;
}

export default function CustomerMap({ customers, userLat, userLng }: CustomerMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-[400px] bg-gray-50 rounded-2xl flex items-center justify-center text-sm text-gray-400">
        Loading Map View…
      </div>
    );
  }

  // Custom marker for customers
  const createCustomerIcon = (status: string) => {
    const isAtRisk = status === "at_risk";
    const colorClass = isAtRisk ? "bg-red-500" : "bg-brand-600";
    const ringClass = isAtRisk ? "bg-red-500/20 border-red-500" : "bg-brand-600/20 border-brand-600";
    return L.divIcon({
      className: "custom-customer-marker",
      html: `<div class="w-8 h-8 rounded-full ${ringClass} border-2 flex items-center justify-center shadow-md">
        <div class="w-2.5 h-2.5 rounded-full ${colorClass}"></div>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  // Custom marker for sales rep current location
  const repIcon = L.divIcon({
    className: "custom-rep-marker",
    html: `<div class="w-10 h-10 rounded-full bg-violet-500/30 border-2 border-violet-600 flex items-center justify-center shadow-lg animate-pulse">
      <div class="w-3.5 h-3.5 rounded-full bg-violet-600 border border-white"></div>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  const defaultCenter: L.LatLngExpression = [25.2048, 55.2708]; // Dubai

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-card">
      <MapContainer
        center={userLat && userLng ? [userLat, userLng] : defaultCenter}
        zoom={12}
        style={{ height: "450px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Rep Current Location Pin */}
        {userLat && userLng && (
          <Marker position={[userLat, userLng]} icon={repIcon}>
            <Popup>
              <div className="p-1">
                <p className="font-semibold text-xs text-violet-700">You are here</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Current GPS position</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Customer Pins */}
        {customers.map((c) => {
          if (!c.latitude || !c.longitude) return null;
          return (
            <Marker
              key={c.id}
              position={[c.latitude, c.longitude]}
              icon={createCustomerIcon(c.status)}
            >
              <Popup>
                <div className="p-2 space-y-1.5 min-w-[180px]">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 leading-tight">{c.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{c.territory}, {c.country}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {c.status === "at_risk" ? (
                      <span className="inline-block text-[9px] font-semibold bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100">
                        At Risk
                      </span>
                    ) : (
                      <span className="inline-block text-[9px] font-semibold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100">
                        Active
                      </span>
                    )}
                    {c.distance !== undefined && (
                      <span className="text-[10px] text-gray-500 font-medium">
                        📍 {c.distance.toFixed(1)} km away
                      </span>
                    )}
                  </div>

                  {c.open_items_amount > 0 && (
                    <p className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                      Open items: AED {c.open_items_amount}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-gray-100">
                    <a
                      href={`/rep/visit/${c.id}`}
                      className="inline-block text-center text-[10px] font-bold bg-brand-50 text-brand-600 hover:bg-brand-100 px-2 py-1 rounded transition-colors"
                    >
                      Visit
                    </a>
                    <a
                      href={`/rep/order/new?customer=${c.id}`}
                      className="inline-block text-center text-[10px] font-bold bg-violet-50 text-violet-600 hover:bg-violet-100 px-2 py-1 rounded transition-colors"
                    >
                      Order
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <MapController customers={customers} userLat={userLat} userLng={userLng} />
      </MapContainer>
    </div>
  );
}
