"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  Search,
  Package,
  ChevronRight,
  Tag,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Globe,
  PlusCircle,
} from "lucide-react";
import { MASTER_PRODUCTS, ProductMaster } from "@/lib/data/productData";
import ExportExcelButton from "@/components/ExportExcelButton";

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  active:       { label: "Active",       cls: "bg-emerald-50 text-emerald-700 border-emerald-200",  icon: <CheckCircle2 size={11} /> },
  promo:        { label: "Promo",        cls: "bg-violet-50 text-violet-700 border-violet-200",     icon: <Tag size={11} /> },
  near_expiry:  { label: "Near Expiry",  cls: "bg-amber-50 text-amber-700 border-amber-200",        icon: <AlertTriangle size={11} /> },
  out_of_stock: { label: "Out of Stock", cls: "bg-red-50 text-red-700 border-red-200",              icon: <XCircle size={11} /> },
  non_moving:   { label: "Non-Moving",   cls: "bg-gray-100 text-gray-500 border-gray-200",          icon: <Package size={11} /> },
};

export default function ProductsPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<ProductMaster[]>(MASTER_PRODUCTS);
  const [query, setQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .order("name")
      .then(({ data }) => {
        if (data && data.length > 0) {
          // Merge db products with MASTER_PRODUCTS ensuring images and specs are preserved
          const dbMap = new Map<string, any>(data.map((p: any) => [p.id, p]));
          const updated = MASTER_PRODUCTS.map((mp) => {
            const dbItem = dbMap.get(mp.id);
            if (dbItem) {
              return {
                ...mp,
                base_price: Number(dbItem.base_price || mp.base_price),
                stock_status: dbItem.stock_status || mp.stock_status,
                is_promotion: dbItem.is_promotion !== undefined ? !!dbItem.is_promotion : mp.is_promotion,
                expiry_date: dbItem.expiry_date || mp.expiry_date,
              };
            }
            return mp;
          });
          setProducts(updated);
        }
      });
  }, []);

  const filtered = products.filter((p) => {
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.title?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.origin?.toLowerCase().includes(q);
    const matchesBrand = brandFilter === "All" || p.brand === brandFilter;
    const matchesStatus = statusFilter === "All" || p.stock_status === statusFilter;
    return matchesQuery && matchesBrand && matchesStatus;
  });

  const liveBrands = ["All", ...Array.from(new Set(products.map((p) => p.brand).filter(Boolean)))];

  return (
    <div className="space-y-4">
      {/* Header with Quick Navigation to Forecasting */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Product Catalog</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Master Baker Portfolio · {filtered.length} products
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportExcelButton
            data={filtered.map((p) => ({
              "SKU Code": p.sku,
              "Product Name": p.name || p.title,
              "Brand": p.brand,
              "Category": p.category,
              "Origin": p.origin || "—",
              "Base Price (AED)": p.base_price,
              "Stock Status": p.stock_status,
              "Stock Units": p.stock_units || "—",
              "Promo Active": p.is_promotion ? "YES" : "NO",
              "Expiry Date": p.expiry_date || "—",
            }))}
            filename="Master-Baker-Product-Catalog"
            sheetName="Products"
          />
          <Link
            href="/rep/products/new"
            className="btn-secondary text-xs flex items-center gap-1 px-3 py-2 border-brand-200 text-brand-700 bg-brand-50 hover:bg-brand-100"
          >
            <PlusCircle size={14} />
            Add Product SKU
          </Link>
          <Link
            href="/rep/forecasting"
            className="btn-primary text-xs flex items-center gap-1.5 px-3 py-2"
          >
            <TrendingUp size={14} />
            View 3M Sales Forecasting
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="relative md:col-span-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            className="input pl-9"
            placeholder="Search products by brand, title, origin, SKU..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div>
          <select
            className="input text-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Stock Statuses</option>
            <option value="near_expiry">Near Expiry Flagged</option>
            <option value="out_of_stock">Out of Stock & Substitutions</option>
            <option value="promo">Promotional / Push Items</option>
            <option value="active">Active Available Stock</option>
          </select>
        </div>
      </div>

      {/* Brand Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {liveBrands.map((b) => (
          <button
            key={b}
            onClick={() => setBrandFilter(b)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              brandFilter === b
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-brand-400"
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      {/* Product List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="card p-8 text-center">
            <Package size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No products match your search criteria.</p>
          </div>
        )}

        {filtered.map((p) => {
          const status = STATUS_CONFIG[p.stock_status] ?? STATUS_CONFIG.active;
          return (
            <div key={p.id} className="card-hover p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Image / Fallback Icon */}
                <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                  {p.image ? (
                    <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={22} className="text-brand-600" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                      {p.brand}
                    </span>
                    <span className="text-xs text-gray-400">{p.sku}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Globe size={11} /> {p.origin}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-gray-900 mt-1">{p.title || p.name}</p>

                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-sm font-bold text-brand-700">AED {p.base_price}</span>
                    <span className="text-xs text-gray-500">
                      Packing: {p.weight} ({p.uom})
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${status.cls}`}
                    >
                      {status.icon}
                      {status.label}
                    </span>
                  </div>

                  {/* Near Expiry / Substitution callouts */}
                  {p.stock_status === "near_expiry" && p.expiry_date && (
                    <p className="text-[11px] text-amber-700 font-medium mt-1 bg-amber-50 px-2 py-1 rounded border border-amber-200 inline-block">
                      ⚠️ Near Expiry: Batch best before {new Date(p.expiry_date).toLocaleDateString("en-GB")}
                    </p>
                  )}

                  {p.stock_status === "out_of_stock" && p.substitute && (
                    <p className="text-[11px] text-brand-700 font-medium mt-1 bg-blue-50 px-2 py-1 rounded border border-blue-200 inline-block flex items-center gap-1">
                      <RefreshCw size={11} /> Recommended Alternative: {p.substitute.name} (AED {p.substitute.price})
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <Link
                  href={`/rep/products/${p.id}`}
                  className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  View Details
                  <ChevronRight size={13} />
                </Link>
                <Link
                  href={`/rep/order/new?productId=${p.id}`}
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  Order
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

