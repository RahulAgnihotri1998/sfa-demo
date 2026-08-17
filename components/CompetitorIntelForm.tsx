"use client";

import { useState } from "react";
import { 
  ShieldAlert, 
  Camera, 
  Tag, 
  TrendingDown, 
  CheckCircle2, 
  Percent, 
  DollarSign, 
  Image as ImageIcon 
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export function CompetitorIntelForm({
  customerId,
  visitId,
}: {
  customerId: string;
  visitId?: string | null;
}) {
  const supabase = createClient();
  const [competitorName, setCompetitorName] = useState("");
  const [productCategory, setProductCategory] = useState("Gourmet Sauces & Flavours");
  const [competitorProduct, setCompetitorProduct] = useState("");
  const [observedPrice, setObservedPrice] = useState("");
  const [promotionType, setPromotionType] = useState("None");
  const [shelfShare, setShelfShare] = useState("25");
  const [notes, setNotes] = useState("");
  const [hasPhoto, setHasPhoto] = useState(false);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const COMPETITORS = [
    "Puratos",
    "Barry Callebaut",
    "Dawn Foods",
    "CSM Ingredients",
    "Rich's",
    "Ireks",
    "Master Martini",
    "Other Competitor",
  ];

  const CATEGORIES = [
    "Gourmet Sauces & Flavours",
    "Fruit Jams & Pastes",
    "Bakery Mixes & Frostings",
    "Specialty Flour & Grains",
    "Sourdough & Yeast",
    "Couverture & Chocolate",
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competitorName) return;

    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const repId = userData?.user?.id || "22222222-2222-2222-2222-222222222222";

      await supabase.from("competitor_intelligence").insert({
        visit_id: visitId || null,
        customer_id: customerId,
        rep_id: repId,
        competitor_name: competitorName,
        product_category: productCategory,
        competitor_product_name: competitorProduct || `${competitorName} Special Line`,
        observed_price: parseFloat(observedPrice) || 0,
        currency: "AED",
        promotion_details: promotionType !== "None" ? promotionType : null,
        shelf_share_percentage: parseInt(shelfShare) || 25,
        photo_url: hasPhoto ? "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=400" : null,
        notes: notes || null,
      });

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setCompetitorName("");
        setCompetitorProduct("");
        setObservedPrice("");
        setNotes("");
        setHasPhoto(false);
      }, 2500);
    } catch (err) {
      console.error("Failed to save competitor intelligence:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200/80 space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
            <ShieldAlert size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Competitor Intelligence</h3>
            <p className="text-[11px] text-gray-500">Log competitor pricing, shelf share & campaigns</p>
          </div>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-semibold bg-orange-100 text-orange-800 rounded-md">
          Market Intel
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        {/* Competitor & Category */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-semibold text-gray-600 block mb-1">Competitor Brand</label>
            <select
              value={competitorName}
              onChange={(e) => setCompetitorName(e.target.value)}
              required
              className="w-full text-xs py-1.5 px-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="">Select Brand...</option>
              {COMPETITORS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-gray-600 block mb-1">Category</label>
            <select
              value={productCategory}
              onChange={(e) => setProductCategory(e.target.value)}
              className="w-full text-xs py-1.5 px-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Product & Observed Price */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-semibold text-gray-600 block mb-1">Observed SKU / Product</label>
            <input
              type="text"
              placeholder="e.g. Belcolade Noir 55%"
              value={competitorProduct}
              onChange={(e) => setCompetitorProduct(e.target.value)}
              className="w-full text-xs py-1.5 px-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-gray-600 block mb-1">Shelf Price (AED)</label>
            <input
              type="number"
              placeholder="e.g. 185"
              value={observedPrice}
              onChange={(e) => setObservedPrice(e.target.value)}
              className="w-full text-xs py-1.5 px-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Shelf Share & Promotion */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-semibold text-gray-600 block mb-1">
              Est. Shelf Share: <strong className="text-orange-600">{shelfShare}%</strong>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={shelfShare}
              onChange={(e) => setShelfShare(e.target.value)}
              className="w-full accent-orange-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-gray-600 block mb-1">Active Promotion</label>
            <select
              value={promotionType}
              onChange={(e) => setPromotionType(e.target.value)}
              className="w-full text-xs py-1.5 px-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="None">None</option>
              <option value="Buy 5 Get 1 Free">Buy 5 Get 1 Free</option>
              <option value="15% Discount on Bulk">15% Discount on Bulk</option>
              <option value="Free Dispenser / POP Stand">Free Dispenser / POP Stand</option>
              <option value="Free Sample Kit Included">Free Sample Kit Included</option>
            </select>
          </div>
        </div>

        {/* Photo Upload Simulator */}
        <div>
          <label className="text-[10px] font-semibold text-gray-600 block mb-1">Shelf Photo Verification</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHasPhoto(!hasPhoto)}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                hasPhoto 
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700" 
                  : "border-dashed border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Camera size={15} />
              {hasPhoto ? "Shelf Photo Attached (1.2 MB) ✓" : "Snap / Upload Shelf Photo"}
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-[10px] font-semibold text-gray-600 block mb-1">Field Observation Notes</label>
          <input
            type="text"
            placeholder="e.g. Baker mentioned switching due to lower pricing on 25kg bags..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs py-1.5 px-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-bold shadow-sm hover:from-orange-700 hover:to-amber-700 transition-all flex items-center justify-center gap-2"
        >
          {saved ? (
            <>
              <CheckCircle2 size={15} className="text-white" />
              <span>Competitor Intel Logged ✓</span>
            </>
          ) : (
            <>Log Competitor Intelligence</>
          )}
        </button>
      </form>
    </div>
  );
}
