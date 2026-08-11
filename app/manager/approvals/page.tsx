"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, X, Clock, Inbox, Loader2 } from "lucide-react";

type DiscountRequest = {
  id: string;
  requested_price: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  decided_at: string | null;
  requester?: { full_name: string } | null;
  customer?: { name: string } | null;
  product?: { name: string; base_price: number } | null;
};

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
];

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "").concat(parts.length > 1 ? parts[parts.length - 1][0] : "").toUpperCase();
}

function colorFor(name?: string) {
  if (!name) return AVATAR_COLORS[0];
  const sum = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function formatAED(value: number) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(value);
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

function StatusPill({ status }: { status: DiscountRequest["status"] }) {
  const styles = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-50 text-rose-700 border-rose-200",
  }[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${styles}`}>
      {status}
    </span>
  );
}

export default function ApprovalsPage() {
  const supabase = createClient();
  const [requests, setRequests] = useState<DiscountRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  useEffect(() => {
    load();

    const channel = supabase
      .channel("discount_requests_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "discount_requests" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function load() {
    const { data } = await supabase
      .from("discount_requests")
      .select(`
        *,
        requester:users!discount_requests_requested_by_fkey(full_name),
        customer:customers(name),
        product:products(name, base_price)
      `)
      .order("created_at", { ascending: false });
    setRequests(data ?? []);
    setLoading(false);
  }

  async function decide(id: string, status: "approved" | "rejected") {
    setDecidingId(id);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // optimistic update so the row moves instantly
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status, decided_at: new Date().toISOString() } : r
      )
    );

    await supabase
      .from("discount_requests")
      .update({ status, approver_id: user?.id, decided_at: new Date().toISOString() })
      .eq("id", id);

    setDecidingId(null);
  }

  const pending = useMemo(() => requests.filter((r) => r.status === "pending"), [requests]);
  const decided = useMemo(() => requests.filter((r) => r.status !== "pending"), [requests]);

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-2">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Special pricing approvals</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review discount requests from your sales team.</p>
      </div>

      {/* Pending section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Pending</h2>
          {pending.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
              {pending.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="card p-4 h-[68px] animate-pulse bg-gray-50" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <div className="card flex flex-col items-center justify-center gap-2 py-10 text-center">
            <Inbox className="text-gray-300" size={28} />
            <p className="text-sm text-gray-400">No pending requests. You're all caught up.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map((r) => {
              const name = r.requester?.full_name;
              const customerName = r.customer?.name;
              const productName = r.product?.name;
              const basePrice = r.product?.base_price;
              const isDeciding = decidingId === r.id;
              
              let parsedProductName = productName;
              if (!parsedProductName && r.reason) {
                const match = r.reason.match(/^\[Product:\s*([^\]]+)\]/);
                if (match) parsedProductName = match[1];
              }
              const displayReason = r.reason ? r.reason.replace(/^\[Product:[^\]]+\]\s*/, "") : "";

              return (
                <div
                  key={r.id}
                  className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-opacity bg-white"
                  style={{ opacity: isDeciding ? 0.6 : 1 }}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${colorFor(name)}`}
                    >
                      {initials(name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {name ?? "Unknown"} <span className="text-gray-400 font-normal">for</span> {customerName ?? "Unknown Customer"}
                      </p>
                      
                      {parsedProductName && (
                        <p className="text-xs font-semibold text-brand-700 mt-0.5">
                          {parsedProductName}
                        </p>
                      )}

                      <p className="text-xs text-gray-500 mt-1">
                        Requested: <span className="font-bold text-indigo-600">{formatAED(r.requested_price)}</span>
                        {basePrice !== undefined && (
                          <span className="text-gray-400 ml-1.5 line-through">
                            (Base: {formatAED(basePrice)})
                          </span>
                        )}
                        {displayReason && (
                          <>
                            <span className="mx-1.5 text-gray-300">·</span>
                            <span className="text-gray-500 italic">"{displayReason}"</span>
                          </>
                        )}
                      </p>

                      <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1.5">
                        <Clock size={11} /> {timeAgo(r.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => decide(r.id, "approved")}
                      disabled={isDeciding}
                      className="btn-primary py-1.5 px-3 flex items-center gap-1 disabled:cursor-not-allowed text-xs"
                    >
                      {isDeciding ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Approve
                    </button>
                    <button
                      onClick={() => decide(r.id, "rejected")}
                      disabled={isDeciding}
                      className="btn-secondary py-1.5 px-3 flex items-center gap-1 disabled:cursor-not-allowed text-xs"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Decided section */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Decided</h2>
        {decided.length === 0 ? (
          <p className="text-sm text-gray-400">Nothing decided yet.</p>
        ) : (
          <div className="card divide-y divide-gray-100">
            {decided.map((r) => {
              const name = r.requester?.full_name;
              const customerName = r.customer?.name;
              const productName = r.product?.name;
              
              let parsedProductName = productName;
              if (!parsedProductName && r.reason) {
                const match = r.reason.match(/^\[Product:\s*([^\]]+)\]/);
                if (match) parsedProductName = match[1];
              }

              return (
                <div key={r.id} className="px-4 py-3 flex items-center justify-between gap-3 bg-white">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold ${colorFor(name)}`}
                    >
                      {initials(name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-700 truncate">
                        <span className="font-semibold">{name ?? "Unknown"}</span>
                        {customerName && <span className="text-gray-400"> for {customerName}</span>}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {parsedProductName && <span className="font-medium text-gray-700">{parsedProductName} · </span>}
                        <span className="font-bold text-indigo-600">{formatAED(r.requested_price)}</span>
                      </p>
                      {r.decided_at && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(r.decided_at)}</p>
                      )}
                    </div>
                  </div>
                  <StatusPill status={r.status} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}