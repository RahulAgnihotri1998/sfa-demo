"use client";

import { useState } from "react";
import { 
  ShoppingCart, 
  ChevronUp, 
  ChevronDown, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle2, 
  Loader2, 
  Send, 
  Receipt,
  Sparkles,
  ShieldCheck,
  Tag,
  Layers
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getCrossSellRecommendations } from "@/lib/data/analyticsEngine";
import { MASTER_PRODUCTS } from "@/lib/data/productData";

export interface CartItem {
  id: string;
  name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  is_promotion?: boolean;
}

export function InVisitCartDrawer({
  customerId,
  customerName = "Customer",
  cartItems = [],
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onOrderPlaced,
}: {
  customerId: string;
  customerName?: string;
  cartItems: CartItem[];
  onUpdateQty: (productId: string, newQty: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onOrderPlaced?: (orderId: string, sageOrderNumber: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<{ id: string; sageNo: string } | null>(null);
  const supabase = createClient();

  function formatAED(value: number) {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalSubtotal = cartItems.reduce((acc, item) => acc + item.quantity * item.unit_price, 0);

  const crossSellSuggestions = getCrossSellRecommendations(
    cartItems.map((i) => i.id),
    2
  );

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const sageOrderNo = `SO-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 89999)}`;

      // 1. Insert order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: customerId,
          sales_rep_id: user?.id,
          total_amount: totalSubtotal,
          status: "confirmed",
          sage_order_number: sageOrderNo,
          currency: "AED",
          captured_at: new Date().toISOString(),
          confirmed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Insert order items
      const itemsToInsert = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.quantity * item.unit_price,
      }));

      await supabase.from("order_items").insert(itemsToInsert);

      // 3. Insert audit log
      await supabase.from("audit_log").insert({
        entity_type: "order",
        entity_id: order.id,
        action: "created_during_visit",
        details: { customer_id: customerId, sage_order_number: sageOrderNo, items_count: cartItems.length },
      });

      setSuccessOrder({ id: order.id, sageNo: sageOrderNo });
      onClearCart();
      if (onOrderPlaced) onOrderPlaced(order.id, sageOrderNo);
    } catch (err: any) {
      alert("Failed to submit order: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0 && !successOrder) {
    return null;
  }

  return (
    <>
      {/* Sticky Bottom Cart Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-indigo-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-3 max-w-md mx-auto animate-fadeIn">
        <div className="flex items-center justify-between gap-3">
          <div 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                <ShoppingCart size={18} />
              </div>
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white">
                {totalItemsCount}
              </span>
            </div>

            <div className="min-w-0">
              <p className="text-[10px] text-gray-500 font-semibold uppercase flex items-center gap-1">
                <span>In-Visit Order Cart</span>
                {isOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
              </p>
              <p className="text-sm font-extrabold text-gray-900 truncate">{formatAED(totalSubtotal)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="px-3 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {isOpen ? "Hide" : "View"}
            </button>

            <button
              type="button"
              disabled={submitting || cartItems.length === 0}
              onClick={handlePlaceOrder}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-sm shadow-indigo-300 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Booking...</span>
                </>
              ) : (
                <>
                  <Send size={13} />
                  <span>Book Order</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Cart Modal Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 bg-slate-900/60 backdrop-blur-xs animate-fadeIn max-w-md mx-auto">
          <div className="w-full bg-white rounded-t-3xl shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-slideUp">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <ShoppingCart size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">In-Visit Order Items</h3>
                  <p className="text-[11px] text-gray-500">Order for {customerName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClearCart}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Items List */}
            <div className="divide-y divide-gray-100 space-y-2 max-h-60 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={item.id} className="pt-2 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-gray-900 truncate">{item.name}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono mt-0.5">
                      <span>{item.sku}</span>
                      <span>·</span>
                      <span className="font-semibold text-indigo-700">{formatAED(item.unit_price)} / unit</span>
                    </div>
                  </div>

                  {/* Quantity Modifier */}
                  <div className="flex items-center gap-1.5 bg-gray-100 rounded-xl p-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-lg bg-white text-gray-700 flex items-center justify-center hover:bg-gray-200 shadow-xs font-bold text-xs"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="w-6 text-center text-xs font-extrabold text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 shadow-xs font-bold text-xs"
                    >
                      <Plus size={11} />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right shrink-0 min-w-[70px]">
                    <p className="text-xs font-extrabold text-gray-900 font-mono">
                      {formatAED(item.quantity * item.unit_price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Cross-Sell Basket Recommendations */}
            {crossSellSuggestions.length > 0 && (
              <div className="bg-violet-50/70 border border-violet-200/80 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-800 flex items-center gap-1">
                    <Layers size={12} className="text-violet-600" /> Frequently Paired Items
                  </span>
                  <span className="text-[9px] font-semibold text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded">Basket Analysis</span>
                </div>
                <div className="space-y-1.5">
                  {crossSellSuggestions.map((rule) => {
                    const prod = MASTER_PRODUCTS.find((p) => p.id === rule.targetProductId);
                    if (!prod) return null;
                    return (
                      <div key={rule.id} className="flex items-center justify-between gap-2 bg-white p-2 rounded-xl border border-violet-100 text-xs">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-900 truncate">{rule.targetProductName}</p>
                          <p className="text-[10px] text-gray-500 font-mono">
                            AED {prod.base_price} · <span className="text-violet-700 font-medium">{Math.round(rule.confidence * 100)}% pair rate</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(prod.id, 1)}
                          className="px-2 py-1 bg-violet-600 hover:bg-violet-700 text-white font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 shrink-0"
                        >
                          <Plus size={11} /> Add
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Subtotal Calculation */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Total Units</span>
                <span className="font-bold text-gray-800">{totalItemsCount} units</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Estimated VAT (5%)</span>
                <span className="font-bold text-gray-800">{formatAED(totalSubtotal * 0.05)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-gray-900 pt-2 border-t border-slate-200">
                <span>Total Amount</span>
                <span className="text-indigo-700 font-mono">{formatAED(totalSubtotal * 1.05)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              type="button"
              disabled={submitting || cartItems.length === 0}
              onClick={handlePlaceOrder}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 shadow-md shadow-indigo-300 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Transmitting to Sage X3...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Confirm & Book Order to ERP</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success Notification Modal */}
      {successOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn max-w-md mx-auto">
          <div className="w-full bg-white rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={32} />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-gray-900">Order Successfully Booked!</h3>
              <p className="text-xs text-gray-500 mt-1">Booked into Sage master ledger during active visit.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Sage X3 Order ID</p>
              <p className="text-sm font-mono font-bold text-indigo-700 mt-0.5">{successOrder.sageNo}</p>
            </div>

            <button
              type="button"
              onClick={() => setSuccessOrder(null)}
              className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors"
            >
              Continue Visit Checklist
            </button>
          </div>
        </div>
      )}
    </>
  );
}
