"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, User, Phone, Mail, MapPin, Navigation, Save } from "lucide-react";
import Link from "next/link";

export default function NewCustomerPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [territory, setTerritory] = useState("");
  const [country, setCountry] = useState("United Arab Emirates");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Try to pre-fill coordinates on mount
  useEffect(() => {
    fetchLocation();
  }, []);

  function fetchLocation() {
    if (!navigator.geolocation) return;
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setGettingLocation(false);

        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
          headers: {
            "Accept-Language": "en",
          },
        })
          .then(async (res) => {
            const text = await res.text().catch(() => "");
            if (!text || text.trim().startsWith("<")) {
              return null;
            }
            try {
              return JSON.parse(text);
            } catch (e) {
              return null;
            }
          })
          .then((data) => {
            if (data && data.address) {
              const addr = data.address;
              const territoryVal = addr.suburb || addr.neighbourhood || addr.city_district || addr.city || addr.town || addr.state || "";
              setTerritory(territoryVal);

              const countryVal = addr.country || "United Arab Emirates";
              setCountry(countryVal);

              // Extract clean address from Nominatim display name
              const displayAddr = data.display_name || "";
              setAddress(displayAddr);
            }
          })
          .catch((err) => {
            console.warn("Nominatim reverse geocoding failed, using offline fallback:", err);
            // Simulated reverse geocoding fallback
            if (Math.abs(lat - 25.2) < 0.2 && Math.abs(lng - 55.27) < 0.2) {
              setTerritory("Downtown Dubai");
              setCountry("United Arab Emirates");
              setAddress("Sheikh Mohammed bin Rashid Blvd, Downtown Dubai");
            } else if (Math.abs(lat - 24.4) < 0.2 && Math.abs(lng - 54.3) < 0.2) {
              setTerritory("Al Khalidiyah");
              setCountry("United Arab Emirates");
              setAddress("Corniche Road, Al Khalidiyah, Abu Dhabi");
            } else {
              setTerritory(`Sector ${lat.toFixed(2)}N`);
              setCountry("United Arab Emirates");
              setAddress(`Zone, Near Coordinates ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`);
            }
          });
      },
      () => {
        setGettingLocation(false);
      }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Customer Name is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to add a customer.");
      }

      const newCustomer = {
        name,
        contact_name: contactName || null,
        contact_phone: contactPhone || null,
        contact_email: contactEmail || null,
        territory: territory || null,
        country: country || "United Arab Emirates",
        address: address || null,
        latitude: latitude ?? 25.2048, // Default Dubai fallback
        longitude: longitude ?? 55.2708,
        geofence_radius_m: 150,
        open_items_amount: 0,
        status: "active",
        account_owner_id: user.id,
      };

      const { error: dbError } = await supabase
        .from("customers")
        .insert(newCustomer);

      if (dbError) throw dbError;

      router.push("/rep/customers");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "An error occurred while creating the customer record.");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Link href="/rep/customers" className="inline-flex items-center gap-1.5 text-xs text-brand-600 font-medium">
        <ArrowLeft size={13} /> Back to customers
      </Link>

      <div>
        <h1 className="text-lg font-semibold text-gray-900">Add New Customer</h1>
        <p className="text-xs text-gray-400 mt-0.5">Register a new client account in SFA Portal</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="alert-strip-risk text-sm py-3 px-4 rounded-xl">
            <span>⚠️ {error}</span>
          </div>
        )}

        <div className="card p-4 space-y-3 bg-white">
          <h2 className="text-sm font-semibold text-gray-700">Account Details</h2>

          {/* Customer Name */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">
              Customer / Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Grand Hypermarket LLC"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Territory */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">
                Territory
              </label>
              <input
                type="text"
                placeholder="e.g. Dubai Marina"
                value={territory}
                onChange={(e) => setTerritory(e.target.value)}
                className="input"
              />
            </div>

            {/* Country */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="input"
              >
                <option value="United Arab Emirates">United Arab Emirates</option>
                <option value="Saudi Arabia">Saudi Arabia</option>
                <option value="Oman">Oman</option>
                <option value="Qatar">Qatar</option>
                <option value="Kuwait">Kuwait</option>
                <option value="Bahrain">Bahrain</option>
                <option value="India">India</option>
                {/* Dynamically handle external countries from geocoding */}
                {![
                  "United Arab Emirates",
                  "Saudi Arabia",
                  "Oman",
                  "Qatar",
                  "Kuwait",
                  "Bahrain",
                  "India",
                ].includes(country) && (
                  <option value={country}>{country}</option>
                )}
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">
              Store Address
            </label>
            <input
              type="text"
              placeholder="e.g. Al Fidi St, Bur Dubai"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div className="card p-4 space-y-3 bg-white">
          <h2 className="text-sm font-semibold text-gray-700">Primary Contact</h2>

          {/* Contact Person Name */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">
              Contact Name
            </label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="input pl-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Contact Phone */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  placeholder="e.g. +971 50 123 4567"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="input pl-9"
                />
              </div>
            </div>

            {/* Contact Email */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="e.g. client@domain.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="input pl-9"
                />
              </div>
            </div>
          </div>
        </div>

        {/* GPS Geofence details */}
        <div className="card p-4 space-y-3 bg-white">
          <h2 className="text-sm font-semibold text-gray-700">Geo-fence Setup</h2>
          <p className="text-xs text-gray-400 leading-normal">
            SFA uses geofencing to verify visits. Pin your current GPS location to register this client's site.
          </p>

          <div className="flex gap-3 items-center">
            <button
              type="button"
              onClick={fetchLocation}
              disabled={gettingLocation}
              className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5"
            >
              <Navigation size={13} className={gettingLocation ? "animate-spin" : ""} />
              {gettingLocation ? "Locating..." : "Get Coordinates"}
            </button>

            {latitude && longitude ? (
              <div className="text-xs text-emerald-600 font-medium">
                📍 Pinned: {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </div>
            ) : (
              <div className="text-xs text-gray-400">
                Location not yet pinned (will fallback to default Dubai coordinates).
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
          <Save size={16} />
          {submitting ? "Saving Customer..." : "Save Customer"}
        </button>
      </form>
    </div>
  );
}
