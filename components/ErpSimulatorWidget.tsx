"use client";

import { useState } from "react";
import { 
  Cpu, 
  CheckCircle2, 
  XCircle, 
  Truck, 
  FileCheck, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Zap
} from "lucide-react";

export function ErpSimulatorWidget({
  orderId,
  discountRequestId,
  onEventTriggered,
}: {
  orderId?: string;
  discountRequestId?: string;
  onEventTriggered?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const triggerWebhook = async (
    entityType: "discount_request" | "order",
    entityId: string,
    action: "approve" | "reject" | "dispatch" | "invoice"
  ) => {
    setLoading(action);
    setMessage(null);
    try {
      const res = await fetch("/api/mock-sage/webhook-trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId, action }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`ERP Status Write-Back: ${action.toUpperCase()} processed ✓`);
        if (onEventTriggered) onEventTriggered();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setMessage(`Failed: ${err.message}`);
    } finally {
      setLoading(null);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-3.5 text-white shadow-md border border-indigo-500/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
            <Cpu size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold flex items-center gap-1.5">
              Sage X3 ERP Simulator
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Mock Mode Active
              </span>
            </h4>
            <p className="text-[10px] text-slate-300">Simulate 2-Way Webhook Status Write-Backs</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
        >
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-2.5">
          <p className="text-[10px] text-slate-300">
            Trigger automated ERP event callbacks to test two-way synchronization without waiting for external server queues:
          </p>

          <div className="grid grid-cols-2 gap-2">
            {/* Discount Approval Simulator */}
            {discountRequestId && (
              <>
                <button
                  type="button"
                  disabled={loading !== null}
                  onClick={() => triggerWebhook("discount_request", discountRequestId, "approve")}
                  className="py-1.5 px-2.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 size={13} />
                  {loading === "approve" ? "Syncing..." : "Simulate ERP Approve"}
                </button>

                <button
                  type="button"
                  disabled={loading !== null}
                  onClick={() => triggerWebhook("discount_request", discountRequestId, "reject")}
                  className="py-1.5 px-2.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <XCircle size={13} />
                  {loading === "reject" ? "Syncing..." : "Simulate ERP Reject"}
                </button>
              </>
            )}

            {/* Order Dispatch / Invoice Simulator */}
            {orderId && (
              <>
                <button
                  type="button"
                  disabled={loading !== null}
                  onClick={() => triggerWebhook("order", orderId, "dispatch")}
                  className="py-1.5 px-2.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Truck size={13} />
                  {loading === "dispatch" ? "Dispatching..." : "Simulate Dispatch"}
                </button>

                <button
                  type="button"
                  disabled={loading !== null}
                  onClick={() => triggerWebhook("order", orderId, "invoice")}
                  className="py-1.5 px-2.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <FileCheck size={13} />
                  {loading === "invoice" ? "Invoicing..." : "Simulate Invoiced"}
                </button>
              </>
            )}
          </div>

          {message && (
            <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-semibold text-center animate-fadeIn">
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
