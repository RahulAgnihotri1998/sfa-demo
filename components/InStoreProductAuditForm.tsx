"use client";

import { useState } from "react";
import { 
  PackageCheck, 
  AlertCircle, 
  ShoppingCart, 
  Plus, 
  Minus, 
  CheckCircle2, 
  Sparkles,
  Search
} from "lucide-react";
import { useRouter } from "next/navigation";

export interface AuditRecord {
  product_id: string;
  sku: string;
  name: string;
  category: string;
  base_price: number;
  on_shelf_qty: number;
  backstore_qty: number;
  facing_count: number;
  observed_price: number;
  is_out_of_stock: boolean;
  min_shelf_target: number;
}

import { createClient } from "@/lib/supabase/client";

export function InStoreProductAuditForm({
  customerId,
  visitId,
  products = [],
  onAddToCart,
}: {
  customerId: string;
  visitId?: string | null;
  products: any[];
  onAddToCart?: (product: any, qty: number) => void;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [savingAudit, setSavingAudit] = useState(false);
  const [audits, setAudits] = useState<Record<string, AuditRecord>>(() => {
    const initial: Record<string, AuditRecord> = {};
    products.slice(0, 8).forEach((p) => {
      initial[p.id] = {
        product_id: p.id,
        sku: p.sku || "SKU-001",
        name: p.name,
        category: p.category || "General",
        base_price: p.base_price || 100,
        on_shelf_qty: 4,
        backstore_qty: 12,
        facing_count: 2,
        observed_price: p.base_price || 100,
        is_out_of_stock: false,
        min_shelf_target: 10,
      };
    });
    return initial;
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const updateField = (id: string, field: keyof AuditRecord, value: any) => {
    setAudits((prev) => {
      const current = prev[id] || {
        product_id: id,
        sku: "SKU",
        name: "Product",
        category: "General",
        base_price: 100,
        on_shelf_qty: 0,
        backstore_qty: 0,
        facing_count: 1,
        observed_price: 100,
        is_out_of_stock: false,
        min_shelf_target: 10,
      };
      return {
        ...prev,
        [id]: {
          ...current,
          [field]: value,
          is_out_of_stock: field === "on_shelf_qty" ? Number(value) === 0 : current.is_out_of_stock,
        },
      };
    });
  };

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate restock deficits
  const deficitItems = Object.values(audits).filter((a) => (a.on_shelf_qty + a.backstore_qty) < a.min_shelf_target || a.is_out_of_stock);

  const handleTransferToOrder = () => {
    if (onAddToCart) {
      deficitItems.forEach((item) => {
        const targetQty = Math.max(1, item.min_shelf_target - (item.on_shelf_qty + item.backstore_qty));
        onAddToCart(item, targetQty);
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } else {
      router.push(`/rep/order/new?customer=${customerId}&from_audit=true`);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200/80 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <PackageCheck size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">In-Store Product & Shelf Audit</h3>
            <p className="text-[11px] text-gray-500">Record on-shelf stock, facings & price checks</p>
          </div>
        </div>
        {deficitItems.length > 0 && (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            {deficitItems.length} Low Stock Flagged
          </span>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search products to audit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Product Audit Cards */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {filteredProducts.slice(0, 10).map((product) => {
          const audit = audits[product.id] || {
            product_id: product.id,
            sku: product.sku,
            name: product.name,
            category: product.category,
            base_price: product.base_price,
            on_shelf_qty: 0,
            backstore_qty: 0,
            facing_count: 1,
            observed_price: product.base_price,
            is_out_of_stock: false,
            min_shelf_target: 10,
          };

          const isLow = (audit.on_shelf_qty + audit.backstore_qty) < audit.min_shelf_target || audit.is_out_of_stock;

          return (
            <div 
              key={product.id} 
              className={`p-3 rounded-xl border transition-all ${
                isLow ? "border-amber-300 bg-amber-50/30 ring-1 ring-amber-200/50" : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-gray-400">{product.sku}</span>
                  <h4 className="text-xs font-bold text-gray-900 leading-tight">{product.name}</h4>
                  <p className="text-[10px] text-gray-500">{product.category}</p>
                </div>
                <button
                  type="button"
                  onClick={() => updateField(product.id, "is_out_of_stock", !audit.is_out_of_stock)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors ${
                    audit.is_out_of_stock
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {audit.is_out_of_stock ? "OUT OF STOCK" : "In Stock"}
                </button>
              </div>

              {/* Input Grid */}
              <div className="grid grid-cols-4 gap-2 mt-2.5 pt-2 border-t border-gray-100 text-center">
                {/* On Shelf */}
                <div className="bg-gray-50/80 p-1.5 rounded-lg border border-gray-100">
                  <label className="text-[9px] text-gray-500 font-semibold block uppercase">On Shelf</label>
                  <input
                    type="number"
                    min="0"
                    value={audit.on_shelf_qty}
                    onChange={(e) => updateField(product.id, "on_shelf_qty", parseInt(e.target.value) || 0)}
                    className="w-full text-center text-xs font-bold bg-transparent text-gray-900 focus:outline-none"
                  />
                </div>

                {/* Backstore */}
                <div className="bg-gray-50/80 p-1.5 rounded-lg border border-gray-100">
                  <label className="text-[9px] text-gray-500 font-semibold block uppercase">Storeroom</label>
                  <input
                    type="number"
                    min="0"
                    value={audit.backstore_qty}
                    onChange={(e) => updateField(product.id, "backstore_qty", parseInt(e.target.value) || 0)}
                    className="w-full text-center text-xs font-bold bg-transparent text-gray-900 focus:outline-none"
                  />
                </div>

                {/* Facings */}
                <div className="bg-gray-50/80 p-1.5 rounded-lg border border-gray-100">
                  <label className="text-[9px] text-gray-500 font-semibold block uppercase">Facings</label>
                  <input
                    type="number"
                    min="1"
                    value={audit.facing_count}
                    onChange={(e) => updateField(product.id, "facing_count", parseInt(e.target.value) || 1)}
                    className="w-full text-center text-xs font-bold bg-transparent text-gray-900 focus:outline-none"
                  />
                </div>

                {/* Observed Price */}
                <div className="bg-gray-50/80 p-1.5 rounded-lg border border-gray-100">
                  <label className="text-[9px] text-gray-500 font-semibold block uppercase">Store AED</label>
                  <input
                    type="number"
                    min="0"
                    value={audit.observed_price}
                    onChange={(e) => updateField(product.id, "observed_price", parseFloat(e.target.value) || 0)}
                    className="w-full text-center text-xs font-bold bg-transparent text-indigo-700 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footers */}
      <div className="pt-2 border-t border-gray-100 space-y-2">
        {deficitItems.length > 0 && (
          <button
            type="button"
            onClick={handleTransferToOrder}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:from-amber-600 hover:to-orange-700 transition-all active:scale-[0.98]"
          >
            <ShoppingCart size={14} />
            Auto-Generate Restock Order ({deficitItems.length} Deficit Items)
          </button>
        )}

        <button
          type="button"
          disabled={savingAudit}
          onClick={async () => {
            setSavingAudit(true);
            try {
              if (visitId) {
                const rows = Object.values(audits).map((a) => ({
                  visit_id: visitId,
                  product_id: a.product_id,
                  on_shelf_qty: Number(a.on_shelf_qty) || 0,
                  backstore_qty: Number(a.backstore_qty) || 0,
                  is_out_of_stock: Boolean(a.is_out_of_stock),
                  shelf_price_observed: Number(a.observed_price) || a.base_price,
                  facing_count: Number(a.facing_count) || 1,
                  notes: (a.on_shelf_qty + a.backstore_qty < a.min_shelf_target)
                    ? `Deficit alert: below ${a.min_shelf_target} target`
                    : "Stock level optimal",
                }));

                await supabase.from("visit_product_audits").insert(rows);
              }
              setSavedSuccess(true);
              setTimeout(() => setSavedSuccess(false), 2500);
            } catch (err) {
              console.error("Failed to save audit records:", err);
            } finally {
              setSavingAudit(false);
            }
          }}
          className="w-full py-2 px-3 rounded-xl border border-gray-300 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span className="text-emerald-700 font-bold">Audit Saved to Database ✓</span>
            </>
          ) : (
            <>{savingAudit ? "Saving Audit..." : "Save Product Audit Progress"}</>
          )}
        </button>
      </div>
    </div>
  );
}
