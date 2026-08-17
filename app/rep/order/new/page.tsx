"use client";

import { getCrossSellRecommendations, type CrossSellRule } from "@/lib/data/analyticsEngine";

import { useEffect, useState, useMemo } from "react";
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
  CheckCircle2,
  Clock,
  Building2,
  Network,
  CreditCard,
  Truck,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  Building,
  Store,
  Layers,
  MapPin
} from "lucide-react";
import { AccountHierarchySelector } from "@/components/AccountHierarchySelector";
import { CustomerHierarchyBadge } from "@/components/CustomerHierarchyBadge";
import { 
  getAccountHierarchy, 
  validateOrderCredit, 
  CORPORATE_GROUPS,
  HierarchyBranchNode,
  CorporateGroup 
} from "@/lib/hierarchy/accountHierarchy";

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
  const [customerId, setCustomerId] = useState(preselectedCustomer ?? "c1111111-0000-0000-0000-000000000001");
  const [billingAccountId, setBillingAccountId] = useState<string>("grp-al-maya");
  const [deliveryAccountId, setDeliveryAccountId] = useState<string>(preselectedCustomer ?? "c1111111-0000-0000-0000-000000000001");
  const [useConsolidatedCredit, setUseConsolidatedCredit] = useState(true);
  const [showHierarchyDetails, setShowHierarchyDetails] = useState(true);

  const [products, setProducts] = useState<any[]>([]);
  const [pricing, setPricing] = useState<Record<string, number>>({});
  const [alternatives, setAlternatives] = useState<Record<string, any[]>>({});
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [frequentProducts, setFrequentProducts] = useState<any[]>([]);

  // Market Basket Cross-Sell
  const crossSellRules = useMemo(() => {
    return getCrossSellRecommendations(Object.keys(cart), 3);
  }, [Object.keys(cart).join(",")]);
  const [submitting, setSubmitting] = useState(false);
  const [discountFor, setDiscountFor] = useState<string | null>(null);
  const [discountPrice, setDiscountPrice] = useState("");
  const [discountReason, setDiscountReason] = useState("");

  // Animation and Feedback States
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const [cartBouncing, setCartBouncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  useEffect(() => {
    if (!customerId || products.length === 0) {
      setFrequentProducts([]);
      return;
    }

    supabase
      .from("orders")
      .select("id")
      .eq("customer_id", customerId)
      .then(async ({ data: orders }) => {
        const orderIds = (orders || []).map((o: any) => o.id);
        const counts: Record<string, number> = {};

        if (orderIds.length > 0) {
          const { data: items } = await supabase
            .from("order_items")
            .select("product_id, quantity")
            .in("order_id", orderIds);

          if (items && items.length > 0) {
            items.forEach((item: any) => {
              counts[item.product_id] = (counts[item.product_id] || 0) + (item.quantity || 1);
            });
          }
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

  function addToCart(product: any, isSubstitute = false) {
    if (product.stock_status === "out_of_stock") return;

    // Trigger instant button animation
    setRecentlyAddedId(product.id);
    setTimeout(() => {
      setRecentlyAddedId(null);
    }, 1600);

    // Trigger cart bounce animation
    setCartBouncing(true);
    setTimeout(() => {
      setCartBouncing(false);
    }, 800);

    // Trigger toast notification
    setToastMessage(
      isSubstitute
        ? `✓ Added substitute: ${product.name}`
        : `✓ Added ${product.name} to cart`
    );
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);

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

        {/* Account Hierarchy & Customer Selector */}
        <div className="space-y-3">
          <AccountHierarchySelector
            selectedAccountId={customerId}
            onSelectAccount={(branch, group) => {
              setCustomerId(branch.id);
              setDeliveryAccountId(branch.id);
              setBillingAccountId(group.group_id);
            }}
          />

          {/* Account Hierarchy & Multi-Tier Credit Engine Details */}
          {customerId && (() => {
            const context = getAccountHierarchy(customerId);
            const activeGroup = context.group;
            const activeBranch = context.currentBranch;
            const creditValidation = validateOrderCredit(customerId, total, useConsolidatedCredit);

            function formatAED(value: number) {
              return new Intl.NumberFormat("en-AE", {
                style: "currency",
                currency: "AED",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(value);
            }

            return (
              <div className="rounded-xl bg-white border border-[#E7E2D9] p-4 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="text-indigo-600" size={18} />
                    <div>
                      <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-900">
                        Corporate Hierarchy & Multi-Tier Credit Control
                      </h2>
                      <p className="text-[11px] text-gray-500">
                        {activeGroup.group_name} · Linked to {activeGroup.branches.length} Retail Outlets
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHierarchyDetails(!showHierarchyDetails)}
                    className="text-[11px] font-bold text-indigo-600 hover:underline"
                  >
                    {showHierarchyDetails ? "Collapse Configuration ▴" : "Expand Configuration ▾"}
                  </button>
                </div>

                {showHierarchyDetails && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Split Invoicing & Delivery Point Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Invoicing / Billing Entity */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/90 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                            <FileCheck size={13} className="text-indigo-600" />
                            Invoicing / Billing Entity
                          </span>
                          <span className="text-[9px] font-extrabold bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded">
                            Contract Invoice
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-xs font-semibold text-gray-800 cursor-pointer p-1.5 bg-white rounded-lg border border-gray-200 hover:border-indigo-300">
                            <input
                              type="radio"
                              name="billing_scope"
                              checked={useConsolidatedCredit}
                              onChange={() => {
                                setUseConsolidatedCredit(true);
                                setBillingAccountId(activeGroup.group_id);
                              }}
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 truncate">Parent HQ: {activeGroup.group_name}</p>
                              <p className="text-[10px] text-gray-500">Consolidated terms ({activeGroup.payment_terms})</p>
                            </div>
                          </label>

                          <label className="flex items-center gap-2 text-xs font-semibold text-gray-800 cursor-pointer p-1.5 bg-white rounded-lg border border-gray-200 hover:border-indigo-300">
                            <input
                              type="radio"
                              name="billing_scope"
                              checked={!useConsolidatedCredit}
                              onChange={() => {
                                setUseConsolidatedCredit(false);
                                setBillingAccountId(activeBranch.id);
                              }}
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 truncate">Branch Billing: {activeBranch.name}</p>
                              <p className="text-[10px] text-gray-500">Individual branch ledger</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Delivery Destination (Shipping Point) */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/90 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                            <Truck size={13} className="text-emerald-600" />
                            Delivery Destination Point
                          </span>
                          <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                            Shipping Drop
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <select
                            value={deliveryAccountId}
                            onChange={(e) => {
                              const newId = e.target.value;
                              setDeliveryAccountId(newId);
                              setCustomerId(newId);
                            }}
                            className="w-full text-xs font-bold text-gray-800 bg-white border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                          >
                            {CORPORATE_GROUPS.map((g) => (
                              <optgroup key={g.group_id} label={`🏢 ${g.group_name}`}>
                                {g.branches.map((b) => (
                                  <option key={b.id} value={b.id}>
                                    {b.name} ({b.territory})
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                          <p className="text-[10px] text-gray-500 flex items-center gap-1">
                            <MapPin size={10} className="text-gray-400 shrink-0" />
                            <span className="truncate">{activeBranch.address}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Real-Time Multi-Tier Credit Validation Banner */}
                    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-3.5 space-y-3 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={16} className="text-emerald-400" />
                          <span className="text-xs font-extrabold tracking-wide uppercase">
                            {useConsolidatedCredit ? "Consolidated Group Credit Engine" : "Individual Branch Credit Engine"}
                          </span>
                        </div>
                        {creditValidation.isApproved ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 self-start sm:self-auto">
                            <Check size={11} /> Credit Approved · {formatAED(creditValidation.availableCreditAfterOrder)} Available
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1 self-start sm:self-auto">
                            <AlertCircle size={11} /> Credit Limit Exceeded by {formatAED(creditValidation.exceededAmount)}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div>
                          <p className="text-[9px] uppercase font-bold text-indigo-300/80">
                            {useConsolidatedCredit ? "Group Credit Limit" : "Branch Credit Limit"}
                          </p>
                          <p className="font-extrabold text-sm font-mono text-white mt-0.5">
                            {formatAED(creditValidation.creditLimit)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-indigo-300/80">Current Open AR</p>
                          <p className="font-extrabold text-sm font-mono text-indigo-200 mt-0.5">
                            {formatAED(creditValidation.currentOutstanding)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-indigo-300/80">Current Cart Impact</p>
                          <p className="font-extrabold text-sm font-mono text-amber-300 mt-0.5">
                            + {formatAED(total)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-indigo-300/80">Post-Order Remaining</p>
                          <p className={`font-extrabold text-sm font-mono mt-0.5 ${
                            creditValidation.availableCreditAfterOrder >= 0 ? "text-emerald-400" : "text-red-400"
                          }`}>
                            {formatAED(creditValidation.availableCreditAfterOrder)}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] text-indigo-200/70 font-mono">
                          <span>0 AED</span>
                          <span>Utilization: {creditValidation.utilizationPctAfter}%</span>
                          <span>{formatAED(creditValidation.creditLimit)}</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              creditValidation.utilizationPctAfter > 90
                                ? "bg-red-500"
                                : creditValidation.utilizationPctAfter > 75
                                ? "bg-amber-400"
                                : "bg-emerald-400"
                            }`}
                            style={{ width: `${Math.min(100, creditValidation.utilizationPctAfter)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sister Outlets Quick Switch Bar */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Sister Branch Outlets in this Corporate Group ({activeGroup.branches.length})
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {activeGroup.branches.map((b) => {
                          const isCur = b.id === customerId;
                          return (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => {
                                setCustomerId(b.id);
                                setDeliveryAccountId(b.id);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all border text-left flex items-center gap-1.5 ${
                                isCur
                                  ? "bg-indigo-600 text-white border-indigo-700 shadow-xs"
                                  : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50"
                              }`}
                            >
                              <Store size={12} className={isCur ? "text-white" : "text-indigo-600"} />
                              <span>{b.name.split(" (")[0]}</span>
                              <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                                isCur ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                              }`}>
                                {b.city}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
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
                      {isOutOfStock && alternatives[p.id]?.length > 0 && (() => {
                        const altProduct = alternatives[p.id][0];
                        const altInCart = cart[altProduct.id];
                        const isJustAdded = recentlyAddedId === altProduct.id;

                        return (
                          <div className={`rounded-xl p-3.5 border transition-all duration-300 space-y-2.5 ${
                            altInCart
                              ? "bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-100"
                              : "bg-[#FBEEDD]/90 border-[#EDCFA3]"
                          }`}>
                            <div className="flex items-center justify-between">
                              <p className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                                altInCart ? "text-emerald-800" : "text-[#8A5620]"
                              }`}>
                                <AlertCircle size={13} className={altInCart ? "text-emerald-600" : "text-[#8A5620]"} />
                                <span>Substitute Available</span>
                              </p>
                              {altInCart && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in zoom-in-95">
                                  <Check size={11} /> In Cart ({altInCart.quantity})
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200/90 shadow-2xs">
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#1C2321] truncate">{altProduct.name}</p>
                                <p className="text-[11px] text-[#6B6A63] mt-0.5 font-mono flex items-center gap-2">
                                  <strong className="text-emerald-700 font-extrabold">AED {priceFor(altProduct)}</strong>
                                  <span className="text-emerald-600 font-semibold text-[10px] bg-emerald-50 px-1.5 py-0.2 rounded">✓ In Stock</span>
                                </p>
                              </div>

                              <div className="shrink-0 flex items-center gap-1.5">
                                {altInCart ? (
                                  <div className="flex items-center gap-1 bg-[#1C2321] text-white rounded-lg p-1 shadow-xs animate-in zoom-in-95">
                                    <button
                                      type="button"
                                      onClick={() => changeQty(altProduct.id, -1)}
                                      className="p-1 rounded hover:bg-white/20 active:scale-90 transition-all text-white"
                                      aria-label="Decrease substitute quantity"
                                    >
                                      <Minus size={12} />
                                    </button>
                                    <span className="text-xs font-bold px-2 font-mono tabular-nums">
                                      {altInCart.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => changeQty(altProduct.id, 1)}
                                      className="p-1 rounded hover:bg-white/20 active:scale-90 transition-all text-white"
                                      aria-label="Increase substitute quantity"
                                    >
                                      <Plus size={12} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => addToCart(altProduct, true)}
                                    className={`relative px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all duration-200 active:scale-95 ${
                                      isJustAdded
                                        ? "bg-emerald-600 text-white scale-105 ring-2 ring-emerald-300 shadow-md"
                                        : "bg-[#1C2321] hover:bg-[#2A322E] text-white hover:shadow-md"
                                    }`}
                                  >
                                    {isJustAdded ? (
                                      <>
                                        <Check size={13} className="animate-bounce" />
                                        <span>Added!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Plus size={13} />
                                        <span>Add Substitute</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

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

            {/* Market Basket Analysis — Cross-Sell Recommendations */}
            {crossSellRules.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <h2 className="text-sm font-bold text-[#1C2321] flex items-center gap-1.5">
                  <Layers size={14} className="text-violet-600" /> Customers Also Bought
                  <span className="text-[9px] font-bold bg-violet-50 text-violet-700 border border-violet-200 px-1.5 py-0.5 rounded-sm uppercase tracking-wider ml-auto">Basket Analysis</span>
                </h2>
                <div className="grid grid-cols-1 gap-2">
                  {crossSellRules.map((rule) => {
                    const targetProduct = products.find((p: any) => p.id === rule.targetProductId);
                    const inCartTarget = cart[rule.targetProductId];
                    if (!targetProduct) return null;
                    return (
                      <div
                        key={rule.id}
                        className={`rounded-lg p-3 border transition-all ${
                          inCartTarget
                            ? "bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-100"
                            : "bg-violet-50/50 border-violet-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[8px] font-bold uppercase tracking-wider bg-violet-100 text-violet-800 px-1.5 py-0.5 rounded border border-violet-200">
                                {rule.provenance === "association_rule" ? "Association Rule" : "Category Affinity"}
                              </span>
                              <span className="text-[9px] font-mono text-violet-600">
                                Confidence: {Math.round(rule.confidence * 100)}% · Lift: {rule.lift.toFixed(1)}x
                              </span>
                            </div>
                            <h3 className="text-xs font-bold text-[#1C2321] mt-1 truncate">{rule.targetProductName}</h3>
                            <p className="text-[10px] text-[#9A988C] mt-0.5 leading-relaxed line-clamp-2">{rule.reason}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-xs font-bold text-[#1C2321] font-mono">AED {priceFor(targetProduct)}</p>
                            {inCartTarget ? (
                              <span className="text-[9px] font-bold text-emerald-700 flex items-center gap-0.5 justify-end mt-0.5">
                                <Check size={10} /> In Cart ({inCartTarget.quantity})
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => addToCart(targetProduct)}
                                className="mt-1 bg-violet-600 hover:bg-violet-700 text-white font-bold text-[10px] px-2.5 py-1 rounded transition-colors flex items-center gap-1 active:scale-95"
                              >
                                <Plus size={10} /> Add
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Feedback Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-950 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold border border-slate-800 animate-in slide-in-from-top-4 duration-300">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0 animate-bounce" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Checkout bar - fixed at bottom of viewport */}
      {Object.keys(cart).length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white ring-1 ring-[#EDCFA3] shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
          {/* Expandable Cart Items Modal Drawer */}
          {isCartDrawerOpen && (
            <div className="max-w-6xl mx-auto p-4 border-b border-gray-100 bg-[#FAF8F4] max-h-64 overflow-y-auto space-y-2 animate-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <span className="text-xs font-extrabold uppercase tracking-wider text-gray-700">
                  Review Cart Items ({cartCount})
                </span>
                <button
                  type="button"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="text-xs font-bold text-gray-500 hover:text-gray-900"
                >
                  ✕ Close
                </button>
              </div>

              <div className="divide-y divide-gray-200/60">
                {Object.values(cart).map((item: any) => (
                  <div key={item.product_id} className="py-2 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">{item.name}</p>
                      <p className="text-[11px] text-gray-500 font-mono">
                        AED {item.price.toFixed(2)} × {item.quantity} = <strong className="text-gray-900">AED {(item.price * item.quantity).toFixed(2)}</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => changeQty(item.product_id, -1)}
                        className="p-1 rounded text-gray-600 hover:bg-gray-100 active:scale-90"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="text-xs font-bold font-mono px-1.5">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => changeQty(item.product_id, 1)}
                        className="p-1 rounded text-gray-600 hover:bg-gray-100 active:scale-90"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="max-w-6xl mx-auto p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsCartDrawerOpen(!isCartDrawerOpen)}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center relative transition-all duration-300 ${
                cartBouncing
                  ? "bg-emerald-500 text-white scale-125 ring-4 ring-emerald-300 shadow-lg"
                  : "bg-[#FBEEDD] text-[#B8622A] shadow-xs"
              }`}>
                <ShoppingCart size={20} className={cartBouncing ? "animate-bounce" : ""} />
                <span className={`absolute -top-1.5 -right-1.5 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                  cartBouncing ? "bg-emerald-700 scale-125" : "bg-[#1C2321]"
                }`}>
                  {cartCount}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-[10px] text-[#9A988C] font-bold uppercase tracking-wider">Cart Total</p>
                  <span className="text-[10px] font-bold text-indigo-600 underline">
                    {isCartDrawerOpen ? "Hide items" : "View items ▾"}
                  </span>
                </div>
                <p className="text-lg font-black text-[#1C2321] mt-0.5 font-mono tabular-nums">
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
                className={`py-2.5 px-6 font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 ${hasUnapprovedDiscounts
                  ? "opacity-50 cursor-not-allowed bg-[#B4B2A9] text-white"
                  : "bg-[#1C2321] hover:bg-[#2A322E] text-white hover:shadow-lg"
                  }`}
                onClick={submitOrder}
                disabled={submitting || hasUnapprovedDiscounts}
              >
                {submitting ? "Submitting..." : "Submit Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}