"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle2,
  Circle,
  Loader2,
  Database,
  ShieldCheck,
  XCircle,
  Receipt,
  Copy,
  Check,
} from "lucide-react";
import { ErpSimulatorWidget } from "@/components/ErpSimulatorWidget";

const STAGES = [
  { key: "captured", label: "Order captured", desc: "Saved to local client cache" },
  { key: "validated", label: "Validated", desc: "Pricing and credit checks passed" },
  { key: "sent_to_erp", label: "Sent to Sage X3", desc: "Transmitted to ERP middleware" },
  { key: "confirmed", label: "Confirmed by Sage X3", desc: "Booked into Sage master ledger" },
];

function LogLine({ text }: { text: string }) {
  const tone = text.startsWith("✓")
    ? "text-emerald-400"
    : text.startsWith("✗")
      ? "text-red-400"
      : text.startsWith("⚙")
        ? "text-amber-300"
        : "text-gray-500";
  return <p className={`${tone} tracking-tight`}>{text}</p>;
}

export default function OrderStatusPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data } = await supabase.from("orders").select("*").eq("id", id).single();
      if (!cancelled) setOrder(data);

      const { data: orderItems } = await supabase
        .from("order_items")
        .select("*, product:products(name)")
        .eq("order_id", id);
      if (!cancelled) setItems(orderItems || []);
    }
    load();

    fetch(`/api/orders/${id}/advance`, { method: "POST" })
      .then(async (res) => {
        const text = await res.text().catch(() => "");
        return text;
      })
      .catch(() => null)
      .then(() => {
      const poll = setInterval(async () => {
        const { data } = await supabase.from("orders").select("*").eq("id", id).single();
        if (!cancelled) setOrder(data);
        if (data?.status === "confirmed" || data?.status === "failed") {
          clearInterval(poll);
          const { data: orderItems } = await supabase
            .from("order_items")
            .select("*, product:products(name)")
            .eq("order_id", id);
          if (!cancelled) setItems(orderItems || []);
        }
      }, 1200);
      return () => clearInterval(poll);
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!order) return;
    const l: string[] = ["Initializing Sage X3 API sync..."];

    if (["captured", "validated", "sent_to_erp", "confirmed"].includes(order.status)) {
      l.push("✓ Order captured locally on SFA mobile client.");
    }
    if (["validated", "sent_to_erp", "confirmed"].includes(order.status)) {
      l.push("✓ Local pricing validations passed successfully.");
      l.push("✓ Credit limit validation: approved.");
    }
    if (["sent_to_erp", "confirmed"].includes(order.status)) {
      l.push("⚙ Processing payload mapping to Sage SOAP web services...");
      l.push("⚙ Sending HTTP POST to SOAP endpoint /AdxWss/services/CplWss...");
    }
    if (order.status === "confirmed") {
      l.push("✓ Sage X3 response: 200 OK. Transaction committed.");
      l.push(`✓ ERP ledger sales order assigned: ${order.sage_order_number || "SO-MOCK-REF"}`);
    }
    if (order.status === "failed") {
      l.push("✗ Sage X3 response: 400 Bad Request. Validation failed.");
    }
    setLogs(l);
  }, [order?.status, order?.sage_order_number]);

  function copyOrderId() {
    if (!order?.sage_order_number) return;
    navigator.clipboard.writeText(order.sage_order_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center gap-3 py-24">
        <Loader2 className="animate-spin text-indigo-500" size={22} />
        <p className="text-sm text-gray-400">Loading order tracking pipeline...</p>
      </div>
    );
  }

  const currentIndex = STAGES.findIndex((s) => s.key === order.status);
  const isFailed = order.status === "failed";
  const isConfirmed = order.status === "confirmed";
  const progressPct = isConfirmed ? 100 : (currentIndex / (STAGES.length - 1)) * 100;

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Order tracking</h1>
          <p className="text-xs text-gray-400 mt-0.5">Sage X3 integration pipeline</p>
        </div>
        <span
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${isFailed
            ? "bg-red-50 text-red-600 border-red-100"
            : isConfirmed
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : "bg-indigo-50 text-indigo-600 border-indigo-100"
            }`}
        >
          {isFailed ? "Failed" : isConfirmed ? "Confirmed" : "In progress"}
        </span>
      </div>

      {/* Stepper card */}
      <div className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_16px_rgba(16,24,40,0.04)] ring-1 ring-gray-100 space-y-5">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
          Sage X3 sync steps
        </h2>

        <div className="relative pl-8 space-y-6">
          <div className="absolute left-[13px] top-2.5 bottom-2.5 w-px bg-gray-100 overflow-hidden rounded-full">
            <div
              className="w-full bg-gradient-to-b from-indigo-400 to-indigo-600 transition-all duration-700 ease-out"
              style={{ height: `${progressPct}%` }}
            />
          </div>

          {STAGES.map((stage, i) => {
            const isDone = i < currentIndex || isConfirmed;
            const isActive = i === currentIndex && !isConfirmed && !isFailed;

            return (
              <div key={stage.key} className="relative flex items-start gap-4">
                <div className="absolute -left-8">
                  {isDone ? (
                    <div className="w-[26px] h-[26px] rounded-full bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center shrink-0 transition-transform duration-300 scale-100">
                      <CheckCircle2 size={15} className="text-emerald-600" />
                    </div>
                  ) : isActive ? (
                    <div className="relative w-[26px] h-[26px] flex items-center justify-center shrink-0">
                      <span className="absolute inset-0 rounded-full bg-indigo-100 animate-ping opacity-60" />
                      <div className="relative w-[26px] h-[26px] rounded-full bg-indigo-50 ring-1 ring-indigo-100 flex items-center justify-center">
                        <Loader2 size={14} className="text-indigo-600 animate-spin" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-[26px] h-[26px] rounded-full bg-white ring-1 ring-gray-200 flex items-center justify-center shrink-0">
                      <Circle size={12} className="text-gray-300" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 pt-0.5">
                  <p
                    className={`text-sm font-semibold leading-tight tracking-tight ${isDone || isActive ? "text-gray-900" : "text-gray-400"
                      }`}
                  >
                    {stage.label}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{stage.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {isFailed && (
          <div className="flex items-start gap-3 p-3.5 bg-red-50/70 ring-1 ring-red-100 rounded-xl text-red-700">
            <XCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold">Sage X3 sync failed</p>
              <p className="text-[11px] text-red-600/80 mt-0.5">
                Check network connection or pricing terms in ERP master data.
              </p>
            </div>
          </div>
        )}

        {isConfirmed && (
          <div className="mt-1 pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                Sage X3 order ID
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-lg font-bold text-indigo-700 tracking-tight">
                  {order.sage_order_number}
                </p>
                <button
                  onClick={copyOrderId}
                  className="text-gray-300 hover:text-indigo-500 transition-colors"
                  aria-label="Copy order ID"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center">
              <ShieldCheck size={20} className="text-emerald-600" />
            </div>
          </div>
        )}
      </div>

      {/* 2-Way Sage X3 ERP Webhook Simulator */}
      <ErpSimulatorWidget orderId={id as string} />

      {/* Invoice value */}
      <div className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ring-1 ring-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
            <Receipt size={16} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
              Total invoice value
            </p>
            <p className="text-sm font-bold text-gray-900 mt-0.5 tabular-nums">
              AED {Number(order.total_amount || 0).toLocaleString("en-AE", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <span className="text-xs text-gray-400 font-semibold">{order.currency || "AED"}</span>
      </div>

      {/* Invoice Items details */}
      <div className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ring-1 ring-gray-100 space-y-4">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
          Items Invoice Manifest
        </h2>
        
        <div className="divide-y divide-gray-100">
          {items.map((item: any, i: number) => (
            <div key={i} className="flex justify-between items-center py-2.5 text-xs first:pt-0 last:pb-0">
              <div className="min-w-0 pr-4">
                <p className="font-semibold text-[#1C2321] truncate">{item.product?.name ?? "Product"}</p>
                <p className="text-[10px] text-[#9A988C] mt-0.5 font-mono">
                  {item.quantity} units · AED {Number(item.unit_price).toFixed(2)} / unit
                </p>
              </div>
              <span className="font-bold text-[#1C2321] shrink-0 font-mono">
                AED {Number(item.line_total || (item.quantity * item.unit_price)).toLocaleString("en-AE", { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-xs text-gray-400 italic text-center py-2">Loading invoice items...</p>
          )}
        </div>
      </div>

      {/* Diagnostics terminal */}
      <div className="rounded-2xl bg-gray-950 p-4 font-mono text-[11px] leading-relaxed shadow-[0_4px_24px_rgba(0,0,0,0.25)] ring-1 ring-gray-800">
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider border-b border-gray-800/80 pb-2 mb-2.5 flex items-center gap-1.5">
          <Database size={12} /> System diagnostics log
        </p>
        <div className="space-y-1 max-h-[140px] overflow-y-auto">
          {logs.map((log, i) => (
            <LogLine key={i} text={log} />
          ))}
          {!isConfirmed && !isFailed && (
            <p className="text-gray-500 animate-pulse">⚙ Awaiting next callback...</p>
          )}
        </div>
      </div>

      {(isConfirmed || isFailed) && (
        <button
          className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold shadow-[0_1px_2px_rgba(16,24,40,0.05)] hover:bg-gray-800 active:scale-[0.99] transition-all duration-150"
          onClick={() => router.push("/rep/home")}
        >
          Return to dashboard
        </button>
      )}
    </div>
  );
}