"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Minus,
  AlertCircle,
  Sparkles,
  Tag,
  ShoppingCart,
  Check,
  Clock,
} from "lucide-react";

interface CartLine {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  stock_status: string;
}

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const preselectedCustomer = searchParams.get("customer");

  const [customers, setCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState(preselectedCustomer ?? "");
  const [products, setProducts] = useState<any[]>([]);
  const [pricing, setPricing] = useState<Record<string, number>>({});
  const [alternatives, setAlternatives] = useState<Record<string, any[]>>({});
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [frequentProducts, setFrequentProducts] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [discountFor, setDiscountFor] = useState<string | null>(null);
  const [discountPrice, setDiscountPrice] = useState("");
  const [discountReason, setDiscountReason] = useState("");

  useEffect(() => {
    if (!customerId || products.length === 0) {
      setFrequentProducts([]);
      return;
    }

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

        setFrequentProducts(sortedProds.slice(0, 4));
      });
  }, [customerId, products]);

  useEffect(() => {
    supabase.from("customers").select("id, name").order("name").then(({ data }) => setCustomers(data ?? []));
    supabase.from("products").select("*").then(({ data }) => setProducts(data ?? []));
    supabase.from("product_alternatives").select("product_id, alternative:products!product_alternatives_alternative_product_id_fkey(*)").then(({ data }) => {
      const map: Record<string, any[]> = {};
      data?.forEach((row: any) => {
        map[row.product_id] = [...(map[row.product_id] ?? []), row.alternative];
      });
      setAlternatives(map);
    });
  }, []);

  const [discountRequests, setDiscountRequests] = useState<any[]>([]);

  const loadDiscountRequests = async () => {
    if (!customerId) return;
    const { data } = await supabase
      .from("discount_requests")
      .select("*")
      .eq("customer_id", customerId)
      .is("order_item_id", null);
    setDiscountRequests(data ?? []);
  };

  useEffect(() => {
    if (!customerId) {
      setDiscountRequests([]);
      setPricing({});
      return;
    }

    supabase
      .from("customer_pricing")
      .select("product_id, price")
      .eq("customer_id", customerId)
      .then(({ data }) => {
        const map: Record<string, number> = {};
        data?.forEach((r: any) => (map[r.product_id] = r.price));
        setPricing(map);
      });

    loadDiscountRequests();

    const channel = supabase
      .channel(`discount_requests_${customerId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "discount_requests" },
        () => {
          loadDiscountRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customerId]);

  // Dynamic cross-sell recommendations based on cart contents
  useEffect(() => {
    const productIds = Object.keys(cart);
    if (productIds.length === 0) {
      setRecommendations([]);
      return;
    }
    supabase
      .from("product_recommendations")
      .select("reason, recommended:products!product_recommendations_recommended_product_id_fkey(*)")
      .in("product_id", productIds)
      .then(({ data }) => setRecommendations(data ?? []));
  }, [Object.keys(cart).join(",")]);

  function getDiscountRequestFor(productId: string) {
    return discountRequests
      .filter((r) => r.product_id === productId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  }

  function priceFor(product: any) {
    const req = getDiscountRequestFor(product.id);
    if (req && req.status === "approved") {
      return Number(req.requested_price);
    }
    return pricing[product.id] ?? product.base_price;
  }

  useEffect(() => {
    setCart((prev) => {
      const next = { ...prev };
      let changed = false;
      Object.keys(next).forEach((productId) => {
        const product = products.find((p) => p.id === productId);
        if (product) {
          const currentPrice = priceFor(product);
          if (next[productId].price !== currentPrice) {
            next[productId] = { ...next[productId], price: currentPrice };
            changed = true;
          }
        }
      });
      return changed ? next : prev;
    });
  }, [discountRequests, pricing, products]);

  function addToCart(product: any) {
    if (product.stock_status === "out_of_stock") return;
    setCart((prev) => {
      const existing = prev[product.id];
      return {
        ...prev,
        [product.id]: {
          product_id: product.id,
          name: product.name,
          price: priceFor(product),
          stock_status: product.stock_status,
          quantity: (existing?.quantity ?? 0) + 1,
        },
      };
    });
  }

  const addProductId = searchParams.get("add_product");
  const [hasAutoAdded, setHasAutoAdded] = useState(false);

  useEffect(() => {
    if (addProductId && products.length > 0 && !hasAutoAdded) {
      const product = products.find((p) => p.id === addProductId);
      if (product && product.stock_status !== "out_of_stock") {
        addToCart(product);
        setHasAutoAdded(true);
      }
    }
  }, [products, addProductId, hasAutoAdded]);

  function changeQty(productId: string, delta: number) {
    setCart((prev) => {
      const line = prev[productId];
      if (!line) return prev;
      const qty = line.quantity + delta;
      if (qty <= 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: { ...line, quantity: qty } };
    });
  }

  const total = Object.values(cart).reduce((sum, l) => sum + l.price * l.quantity, 0);
  const cartCount = Object.values(cart).reduce((sum, l) => sum + l.quantity, 0);

  async function submitOrder() {
    if (!customerId || Object.keys(cart).length === 0) return;
    if (hasUnapprovedDiscounts) {
      alert("Cannot submit order. Please wait for manager approval or reset special pricing.");
      return;
    }
    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: order } = await supabase
      .from("orders")
      .insert({
        customer_id: customerId,
        sales_rep_id: user?.id,
        status: "captured",
        total_amount: total,
      })
      .select()
      .single();

    const items = Object.values(cart).map((l) => ({
      order_id: order.id,
      product_id: l.product_id,
      quantity: l.quantity,
      unit_price: l.price,
      line_total: l.price * l.quantity,
    }));

    const { data: insertedItems } = await supabase
      .from("order_items")
      .insert(items)
      .select();

    // Deplete live warehouse stock in PostgreSQL database & update status if out of stock
    for (const line of Object.values(cart)) {
      const prod = products.find((p) => p.id === line.product_id);
      if (prod) {
        const currentStock = Number(prod.stock_units ?? 200);
        const newStock = Math.max(0, currentStock - line.quantity);
        const newStatus = newStock === 0 ? "out_of_stock" : prod.stock_status;

        await supabase
          .from("products")
          .update({
            stock_units: newStock,
            stock_status: newStatus,
          })
          .eq("id", line.product_id);
      }
    }

    router.push(`/rep/order/${order.id}/status`);
  }

  async function submitDiscountRequest(productId: string) {
    const line = cart[productId];
    if (!line || !discountPrice) return;

    const parsedPrice = parseFloat(discountPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      alert("Please enter a valid target discount price.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("discount_requests").insert({
      requested_by: user?.id,
      requested_price: parsedPrice,
      reason: `[Product: ${line.name}] ${discountReason}`,
      status: "pending",
      product_id: productId,
      customer_id: customerId,
    });

    alert("Special price request sent to manager for approval.");
    setDiscountFor(null);
    setDiscountPrice("");
    setDiscountReason("");
    await loadDiscountRequests();
  }

  async function cancelDiscountRequest(requestId: string) {
    await supabase.from("discount_requests").delete().eq("id", requestId);
    await loadDiscountRequests();
  }

  const hasUnapprovedDiscounts = Object.keys(cart).some((productId) => {
    const req = getDiscountRequestFor(productId);
    return req && req.status !== "approved";
  });

  return (
    <div className="bg-[#FAF8F4] -m-4 p-4 min-h-screen">
      <div className={`space-y-5 ${Object.keys(cart).length > 0 ? "pb-24" : ""}`}>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#B8622A]">
            New manifest
          </p>
          <h1 className="text-xl font-bold text-[#1C2321] leading-tight tracking-tight mt-0.5">
            Create sales order
          </h1>
          <p className="text-xs text-[#9A988C] mt-1">Select a customer, then build the order line by line.</p>
        </div>

        {/* Customer Picker */}
        <div className="rounded-md bg-white p-4 ring-1 ring-[#E7E2D9] space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#9A988C] block">
            Customer account
          </label>
          <select
            className="w-full h-10 rounded-sm border border-[#E7E2D9] bg-[#FDFCFA] px-3 text-sm text-[#1C2321] focus:outline-none focus:ring-1 focus:ring-[#B8622A] focus:border-[#B8622A]"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            <option value="">Choose a customer...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {customerId && (
          <div className="space-y-5">
            {/* FREQUENTLY PURCHASED PRODUCTS SECTION */}
            {frequentProducts.length > 0 && (
              <div className="rounded-md bg-amber-50/60 p-4 ring-1 ring-amber-200 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs uppercase tracking-wide">
                    <Sparkles size={14} className="text-amber-600" />
                    <span>Frequently Purchased Items (Client Buying History)</span>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                    ⚡ Quick 1-Click Re-order
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {frequentProducts.map((p) => {
                    const inCart = cart[p.id];
                    const isOutOfStock = p.stock_status === "out_of_stock";

                    return (
                      <div key={`freq-${p.id}`} className="bg-white p-3 rounded-md border border-amber-200/90 shadow-sm flex flex-col justify-between gap-2.5">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 uppercase">
                            ⭐ Frequently Bought
                          </span>
                          <p className="font-bold text-xs text-[#1C2321] leading-tight line-clamp-2">{p.name}</p>
                          <p className="text-[11px] font-bold text-brand-700 font-mono">
                            AED {priceFor(p)} <span className="text-[9px] font-normal text-gray-400">/ {p.uom || 'unit'}</span>
                          </p>
                        </div>

                        {!isOutOfStock ? (
                          inCart ? (
                            <div className="flex items-center justify-between gap-1 border border-amber-300 rounded px-2 py-1 bg-amber-50/50">
                              <button onClick={() => changeQty(p.id, -1)} className="p-0.5 text-gray-600"><Minus size={11} /></button>
                              <span className="text-xs font-bold text-gray-900">{inCart.quantity}</span>
                              <button onClick={() => changeQty(p.id, 1)} className="p-0.5 text-gray-600"><Plus size={11} /></button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => addToCart(p)}
                              className="w-full py-1.5 px-2 bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-bold text-[10px] rounded flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm"
                            >
                              <Plus size={11} /> Quick Re-order
                            </button>
                          )
                        ) : (
                          <span className="text-[9px] font-bold text-red-600 bg-red-50 p-1 rounded text-center block">Out of Stock</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Product selection grid */}
            <div className="space-y-3">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#9A988C]">
                Product catalogue
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {products.map((p) => {
                  const inCart = cart[p.id];
                  const isOutOfStock = p.stock_status === "out_of_stock";

                  return (
                    <div
                      key={p.id}
                      className={`rounded-md bg-white p-4 ring-1 flex flex-col gap-3 ${inCart ? "ring-[#EDCFA3]" : "ring-[#E7E2D9]"
                        }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <p className="font-bold text-sm text-[#1C2321] leading-snug">{p.name}</p>

                        {/* Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          <span className="text-xs font-bold text-[#1C2321] font-mono tabular-nums">
                            AED {priceFor(p)}
                          </span>
                          {pricing[p.id] && pricing[p.id] !== p.base_price && (
                            <span className="text-[10px] text-[#B4B2A9] line-through font-mono">
                              AED {p.base_price}
                            </span>
                          )}
                          {p.stock_status === "near_expiry" && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide bg-[#FBEEDD] text-[#B8622A] px-1.5 py-0.5 rounded-sm border border-[#EDCFA3]">
                              Near expiry
                            </span>
                          )}
                          {p.stock_status === "promo" && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wide bg-[#F0E7ED] text-[#6B3F63] px-1.5 py-0.5 rounded-sm border border-[#DCC2D5]">
                              <Tag size={9} /> Promo offer
                            </span>
                          )}
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wide bg-[#F7E7E3] text-[#A23B2E] px-1.5 py-0.5 rounded-sm border border-[#E4B8AC]">
                              Out of stock (0 Units)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded-sm border border-emerald-200">
                              📦 Live Stock: {p.stock_units ?? 200} Units
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity editor */}
                      {!isOutOfStock && (
                        <div>
                          {inCart ? (
                            <div className="flex items-center justify-between gap-2 border border-[#E7E2D9] rounded-sm px-2 py-1.5">
                              <button
                                onClick={() => changeQty(p.id, -1)}
                                className="p-1 rounded-sm text-[#6B6A63] hover:bg-[#FAF8F4] transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="text-sm font-bold text-center text-[#1C2321] tabular-nums">
                                {inCart.quantity}
                              </span>
                              <button
                                onClick={() => changeQty(p.id, 1)}
                                className="p-1 rounded-sm text-[#6B6A63] hover:bg-[#FAF8F4] transition-colors"
                                aria-label="Increase quantity"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(p)}
                              className="w-full px-3 py-1.5 rounded-sm border border-[#E7E2D9] text-xs font-bold text-[#1C2321] flex items-center justify-center gap-1 hover:bg-[#FAF8F4] transition-colors"
                            >
                              <Plus size={12} /> Add
                            </button>
                          )}
                        </div>
                      )}

                      {/* Scenario 4: Stock / alternative suggestion block */}
                      {isOutOfStock && alternatives[p.id]?.length > 0 && (
                        <div className="bg-[#FBEEDD] rounded-sm p-3 border border-[#EDCFA3] space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A5620] flex items-center gap-1">
                            <AlertCircle size={12} /> Substitute available
                          </p>
                          <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-sm border border-[#EDCFA3]">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[#1C2321] truncate">{alternatives[p.id][0].name}</p>
                              <p className="text-[10px] text-[#9A988C] mt-0.5 font-mono">
                                AED {alternatives[p.id][0].base_price} · In stock
                              </p>
                            </div>
                            <button
                              type="button"
                              className="shrink-0 bg-[#1C2321] hover:bg-[#2A322E] text-white font-bold text-[10px] px-2.5 py-1.5 rounded-sm transition-colors"
                              onClick={() => addToCart(alternatives[p.id][0])}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Special pricing approvals status & details */}
                      {inCart && (() => {
                        const req = getDiscountRequestFor(p.id);
                        if (req) {
                          return (
                            <div className="pt-2 border-t border-[#E7E2D9] flex flex-col gap-2">
                              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                                {req.status === "pending" && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#FBEEDD] text-[#8A5620] px-2 py-0.5 rounded-sm border border-[#EDCFA3]">
                                    <Clock size={11} /> Pending: AED {req.requested_price}
                                  </span>
                                )}
                                {req.status === "approved" && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#E8EFE4] text-[#3F6B4F] px-2 py-0.5 rounded-sm border border-[#C3D6BA]">
                                    <Check size={11} /> Approved: AED {req.requested_price}
                                  </span>
                                )}
                                {req.status === "rejected" && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#F7E7E3] text-[#A23B2E] px-2 py-0.5 rounded-sm border border-[#E4B8AC]">
                                    <AlertCircle size={11} /> Rejected: AED {req.requested_price}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  className="text-[10px] text-[#9A988C] font-bold hover:text-[#A23B2E] transition-colors"
                                  onClick={() => cancelDiscountRequest(req.id)}
                                >
                                  {req.status === "pending" ? "Cancel" : "Reset"}
                                </button>
                              </div>
                              {req.status === "rejected" && (
                                <p className="text-[10px] text-[#9A988C] italic">
                                  Cancel or reset to revert to standard pricing.
                                </p>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div className="pt-1.5 border-t border-[#E7E2D9]">
                            <button
                              type="button"
                              className="text-[11px] text-[#B8622A] font-bold hover:underline"
                              onClick={() => setDiscountFor(discountFor === p.id ? null : p.id)}
                            >
                              {discountFor === p.id ? "Cancel request" : "Request special pricing"}
                            </button>
                          </div>
                        );
                      })()}

                      {discountFor === p.id && !getDiscountRequestFor(p.id) && (
                        <div className="bg-[#FAF8F4] rounded-sm p-3 border border-[#E7E2D9] space-y-2">
                          <p className="text-[10px] font-bold text-[#9A988C] uppercase tracking-wider">
                            Raise discount request
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            <input
                              className="h-9 rounded-sm border border-[#E7E2D9] bg-white px-2.5 text-xs text-[#1C2321] focus:outline-none focus:ring-1 focus:ring-[#B8622A] focus:border-[#B8622A]"
                              placeholder="Target price (AED)"
                              value={discountPrice}
                              onChange={(e) => setDiscountPrice(e.target.value)}
                            />
                            <input
                              className="h-9 rounded-sm border border-[#E7E2D9] bg-white px-2.5 text-xs text-[#1C2321] focus:outline-none focus:ring-1 focus:ring-[#B8622A] focus:border-[#B8622A]"
                              placeholder="Reason for discount"
                              value={discountReason}
                              onChange={(e) => setDiscountReason(e.target.value)}
                            />
                          </div>
                          <button
                            type="button"
                            className="w-full py-2 text-xs font-bold rounded-sm bg-[#1C2321] text-white hover:bg-[#2A322E] transition-colors"
                            onClick={() => submitDiscountRequest(p.id)}
                          >
                            Submit approval request
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scenario 3: AI-Powered upsell recommendations block */}
            {recommendations.length > 0 && (
              <div className="space-y-2.5">
                <h2 className="text-sm font-bold text-[#1C2321] flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#6B3F63]" /> Frequently bought together
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
                  {recommendations.map((r: any, i: number) => (
                    <div
                      key={i}
                      className="rounded-md px-3.5 py-3 shrink-0 bg-white ring-1 ring-[#DCC2D5] max-w-[200px] flex flex-col justify-between gap-2"
                    >
                      <div>
                        <p className="text-xs font-bold text-[#1C2321] line-clamp-1">{r.recommended.name}</p>
                        <p className="text-[10px] text-[#9A988C] mt-1 line-clamp-2 leading-relaxed">{r.reason}</p>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#F0E7ED]">
                        <span className="text-xs font-bold text-[#1C2321] font-mono">AED {r.recommended.base_price}</span>
                        <button
                          onClick={() => addToCart(r.recommended)}
                          className="bg-[#F0E7ED] hover:bg-[#E4D2E0] text-[#6B3F63] font-bold text-[10px] px-2 py-1 rounded-sm transition-colors"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Checkout bar - fixed at bottom of viewport */}
      {Object.keys(cart).length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white ring-1 ring-[#EDCFA3] shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
          <div className="max-w-6xl mx-auto p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FBEEDD] text-[#B8622A] rounded-sm flex items-center justify-center relative">
                <ShoppingCart size={18} />
                <span className="absolute -top-1.5 -right-1.5 bg-[#1C2321] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              </div>
              <div>
                <p className="text-[10px] text-[#9A988C] font-bold uppercase tracking-wider">Cart total</p>
                <p className="text-base font-bold text-[#1C2321] mt-0.5 font-mono tabular-nums">
                  AED {total.toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-1">
              {(() => {
                const pendingCount = Object.keys(cart).filter(pid => {
                  const r = getDiscountRequestFor(pid);
                  return r && r.status === "pending";
                }).length;
                const rejectedCount = Object.keys(cart).filter(pid => {
                  const r = getDiscountRequestFor(pid);
                  return r && r.status === "rejected";
                }).length;

                if (pendingCount > 0) {
                  return (
                    <p className="text-xs font-semibold text-[#B8622A] flex items-center gap-1.5">
                      <Clock size={12} className="animate-spin" /> Special price requested. Please wait for manager approval.
                    </p>
                  );
                } else if (rejectedCount > 0) {
                  return (
                    <p className="text-xs font-semibold text-[#A23B2E] flex items-center gap-1.5">
                      <AlertCircle size={12} /> Special price request was rejected. Please reset price to proceed.
                    </p>
                  );
                }
                return null;
              })()}
              <button
                className={`py-2.5 px-6 font-bold text-sm rounded-sm transition-colors ${hasUnapprovedDiscounts
                  ? "opacity-50 cursor-not-allowed bg-[#B4B2A9] text-white"
                  : "bg-[#1C2321] text-white hover:bg-[#2A322E]"
                  }`}
                onClick={submitOrder}
                disabled={submitting || hasUnapprovedDiscounts}
              >
                {submitting ? "Submitting..." : "Submit order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}