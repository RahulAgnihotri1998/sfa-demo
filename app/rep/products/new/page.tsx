"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Package,
  PlusCircle,
  Upload,
  Globe,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Layers,
} from "lucide-react";
import { MASTER_PRODUCTS } from "@/lib/data/productData";

export default function AddProductPage() {
  const router = useRouter();
  const supabase = createClient();

  const [sku, setSku] = useState("");
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("Fabbri");
  const [customBrand, setCustomBrand] = useState("");
  const [category, setCategory] = useState("Gourmet Sauces & Flavours");
  const [weight, setWeight] = useState("1 KG");
  const [uom, setUom] = useState("BOTTLE");
  const [origin, setOrigin] = useState("Italy");
  const [basePrice, setBasePrice] = useState<number>(100);
  const [stockStatus, setStockStatus] = useState<"active" | "near_expiry" | "promo" | "out_of_stock" | "non_moving">("active");
  const [stockUnits, setStockUnits] = useState<number>(200);
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>(
    "https://i0.wp.com/www.masterbakerme.com/wp-content/uploads/2025/03/Fabbri-Amarena-Fabbri-Gourmet-Sauce.jpg?fit=500%2C500&ssl=1"
  );

  // Technical Knowledge Base for New Joiners
  const [dosage, setDosage] = useState("30g - 50g per 1kg finished preparation");
  const [keyIngredients, setKeyIngredients] = useState("Fruit Pulp, Sugar Syrup, Natural Extracts");
  const [billOfMaterials, setBillOfMaterials] = useState("BOM-NEW-01: 60% Active Base, 35% Flavoring, 5% Stabilizers");
  const [applicationRecipe, setApplicationRecipe] = useState("Fold directly into finished bakery batter, gelato or pastry filling.");
  const [storageConditions, setStorageConditions] = useState("Store between 15°C and 22°C in a cool, dry ambient room.");
  const [technicalNotes, setTechnicalNotes] = useState("High thermo-stability; maintains gloss and texture after freezing and baking.");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBrand = brand === "Other" ? customBrand : brand;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sku.trim() || !title.trim()) {
      setError("SKU and Product Title are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate standard hex UUID for PostgreSQL primary key compatibility
      const hexId = `a0000001-0000-0000-0000-${Math.floor(100000000000 + Math.random() * 900000000000)}`;

      const newProductPayload = {
        id: hexId,
        sku: sku.trim(),
        name: title.trim(),
        title: title.trim(),
        brand: selectedBrand,
        category,
        weight,
        uom,
        origin,
        image: imageUrl.trim(),
        item_code: sku.trim(),
        base_price: Number(basePrice),
        currency: "AED",
        stock_status: stockStatus,
        stock_units: Number(stockUnits),
        is_promotion: stockStatus === "promo",
        expiry_date: expiryDate ? expiryDate : null,
      };

      // Insert into local PostgreSQL products table
      const { error: dbError } = await supabase.from("products").insert(newProductPayload);

      if (dbError) {
        console.warn("DB insert notice:", dbError);
      }

      // Also add to local array memory state for instant availability
      const richProductObj = {
        ...newProductPayload,
        url: "https://www.masterbakerme.com/products/",
        substitute: null,
        bom_formulation: {
          dosage,
          keyIngredients: keyIngredients.split(",").map((s) => s.trim()),
          billOfMaterials,
          applicationRecipe,
          storageConditions,
          technicalNotes,
        },
        historical_6m_units: [40, 45, 50, 55, 60, 65] as [number, number, number, number, number, number],
        forecast_3m_units: [70, 75, 80] as [number, number, number],
      };

      MASTER_PRODUCTS.unshift(richProductObj);

      router.push("/rep/products");
      router.refresh();
    } catch (err: any) {
      console.error("Error creating product:", err);
      setError(err?.message || "Failed to create product record.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Back Nav */}
      <Link href="/rep/products" className="inline-flex items-center gap-1.5 text-xs text-brand-600 font-medium">
        <ArrowLeft size={13} /> Back to Product Catalog
      </Link>

      {/* Hero Title */}
      <div className="hero-gradient rounded-2xl p-5 text-white shadow-brand relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-blue-100 mb-2">
              <PlusCircle size={13} className="text-yellow-300" /> Master Baker Portfolio Management
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Add New Master Product SKU</h1>
            <p className="text-blue-100 text-xs mt-1">
              Create a new ingredients SKU complete with warehouse stock levels, batch dates, and technical BOM specs for new joiners.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3.5 rounded-xl">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: CORE PRODUCT IDENTIFICATION */}
        <div className="card p-5 space-y-4 bg-white border border-gray-200">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
            <Package size={18} className="text-brand-600" /> Core Product Identification &amp; Master Branding
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Product Title / Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Amarena Fabbri Gourmet Sauce 950g"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">SKU / Item Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. FB-950-08"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="input text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Brand Manufacturer</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="input text-xs font-semibold"
              >
                <option value="Fabbri">Fabbri (Italy)</option>
                <option value="Dawn">Dawn Foods (Belgium / USA)</option>
                <option value="CSM">CSM Ingredients (Germany)</option>
                <option value="Schapfen Muhle">Schapfen Mühle (Germany)</option>
                <option value="Lesaffre">Lesaffre (France)</option>
                <option value="Dobele">Dobele (Latvia)</option>
                <option value="Felchlin">Felchlin (Switzerland)</option>
                <option value="Other">Other / Custom Brand</option>
              </select>
            </div>

            {brand === "Other" && (
              <div>
                <label className="font-bold text-gray-700 block mb-1">Custom Brand Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter brand name"
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  className="input text-xs"
                />
              </div>
            )}

            <div>
              <label className="font-bold text-gray-700 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input text-xs"
              >
                <option value="Gourmet Sauces & Flavours">Gourmet Sauces &amp; Flavours</option>
                <option value="Bakery Mixes & Grains">Bakery Mixes &amp; Grains</option>
                <option value="Fruit Jams & Pastes">Fruit Jams &amp; Pastes</option>
                <option value="Specialty Flour & Grains">Specialty Flour &amp; Grains</option>
                <option value="Sourdough & Yeast">Sourdough &amp; Yeast</option>
                <option value="Couverture & Chocolate">Couverture &amp; Chocolate</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Packing Weight</label>
              <input
                type="text"
                placeholder="e.g. 950 gram, 25 kg, 13 KG"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="input text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Unit of Measure (UOM)</label>
              <select
                value={uom}
                onChange={(e) => setUom(e.target.value)}
                className="input text-xs"
              >
                <option value="BOTTLE">BOTTLE</option>
                <option value="BAG">BAG</option>
                <option value="Pail">Pail / PAIL</option>
                <option value="PAL">PAL</option>
                <option value="TIN">TIN</option>
                <option value="CTN">CTN</option>
                <option value="Pkt">Pkt</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Country of Origin</label>
              <input
                type="text"
                placeholder="e.g. Italy, Germany, France, USA"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="input text-xs"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: PRICING, INVENTORY & BATCH STATUS */}
        <div className="card p-5 space-y-4 bg-white border border-gray-200">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
            <Tag size={18} className="text-brand-600" /> Commercial Pricing, Warehouse Inventory &amp; Expiry
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Base Price (AED) *</label>
              <input
                type="number"
                required
                min="1"
                value={basePrice}
                onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                className="input text-xs font-bold text-brand-700"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Stock Status Flag</label>
              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value as any)}
                className="input text-xs font-bold"
              >
                <option value="active">🟢 Active (In Stock)</option>
                <option value="near_expiry">⚠️ Near Expiry Alert</option>
                <option value="promo">🏷️ Promo Push Campaign</option>
                <option value="out_of_stock">🚨 Out of Stock</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Warehouse Stock Units</label>
              <input
                type="number"
                min="0"
                value={stockUnits}
                onChange={(e) => setStockUnits(parseInt(e.target.value) || 0)}
                className="input text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Batch Expiry Date (Optional)</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="input text-xs"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-bold text-gray-700 block mb-1">Product Image URL</label>
              <input
                type="url"
                placeholder="https://i0.wp.com/www.masterbakerme.com/..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="input text-xs"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: NEW JOINERS TECHNICAL KNOWLEDGE BASE & BOM SPECS */}
        <div className="card p-5 space-y-4 bg-white border border-gray-200">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <BookOpen size={18} className="text-brand-600" /> Technical Knowledge Base &amp; BOM (for New Joiners)
              </h2>
              <p className="text-xs text-gray-400">Enables new sales reps to access technical formulas without calling experts</p>
            </div>
            <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
              Self-Service Formulation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Recommended Dosage Rate</label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="input text-xs"
                placeholder="e.g. 30g - 50g per 1kg finished gelato base"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Key Ingredients (Comma Separated)</label>
              <input
                type="text"
                value={keyIngredients}
                onChange={(e) => setKeyIngredients(e.target.value)}
                className="input text-xs"
                placeholder="e.g. Cherry Pulp, Invert Sugar, Pectin"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-bold text-gray-700 block mb-1">Bill of Materials (BOM) Formula</label>
              <textarea
                rows={2}
                value={billOfMaterials}
                onChange={(e) => setBillOfMaterials(e.target.value)}
                className="input text-xs font-mono"
                placeholder="e.g. BOM-FB-950: 65% Wild Cherries, 30% Invert Sugar, 5% Natural Gelling Agents"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Application &amp; Recipe Instructions</label>
              <textarea
                rows={2}
                value={applicationRecipe}
                onChange={(e) => setApplicationRecipe(e.target.value)}
                className="input text-xs"
                placeholder="How chefs should apply this product in baking..."
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Storage &amp; Handling Guidelines</label>
              <textarea
                rows={2}
                value={storageConditions}
                onChange={(e) => setStorageConditions(e.target.value)}
                className="input text-xs"
                placeholder="Temperature, humidity and storage requirements..."
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/rep/products" className="btn-secondary text-xs py-2.5 px-4">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary text-xs py-2.5 px-6 font-bold flex items-center gap-1.5"
          >
            {loading ? "Saving Product SKU..." : "Save Product SKU to Catalog"}
          </button>
        </div>
      </form>
    </div>
  );
}
