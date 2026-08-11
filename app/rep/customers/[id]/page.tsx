import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Phone, Mail, MapPin, ShoppingCart, CalendarCheck, FileText, AlertCircle, Tag, History } from "lucide-react";

function formatAED(value: number) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMonth(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-AE", { month: "short", year: "numeric" });
}

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "").concat(parts.length > 1 ? parts[parts.length - 1][0] : "").toUpperCase();
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: customer } = await supabase.from("customers").select("*").eq("id", id).single();
  const { data: pricing } = await supabase
    .from("customer_pricing")
    .select("price, product:products(name, sku)")
    .eq("customer_id", id);
  const { data: history } = await supabase
    .from("purchase_history")
    .select("order_month, amount, product:products(name)")
    .eq("customer_id", id)
    .order("order_month", { ascending: false })
    .limit(6);

  if (!customer) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center gap-2 py-20 text-center">
        <AlertCircle className="text-gray-300" size={28} />
        <p className="text-sm text-gray-400">Customer not found.</p>
      </div>
    );
  }

  const hasOpenItems = customer.open_items_amount > 0;

  return (
    <div className="max-w-md mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 shrink-0 rounded-full bg-indigo-50 ring-1 ring-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700">
          {initials(customer.name)}
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-gray-900 tracking-tight truncate">{customer.name}</h1>
          <p className="text-sm text-gray-500">{customer.territory}</p>
        </div>
      </div>

      {/* Contact card */}
      <div className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ring-1 ring-gray-100 space-y-2.5">
        <a
          href={`tel:${customer.contact_phone}`}
          className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-indigo-600 transition-colors w-fit"
        >
          <Phone size={14} className="text-gray-400 shrink-0" /> {customer.contact_phone}
        </a>
        <a
          href={`mailto:${customer.contact_email}`}
          className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-indigo-600 transition-colors w-fit"
        >
          <Mail size={14} className="text-gray-400 shrink-0" /> {customer.contact_email}
        </a>
        <div className="flex items-center gap-2.5 text-sm text-gray-700">
          <MapPin size={14} className="text-gray-400 shrink-0" /> {customer.address}
        </div>

        {hasOpenItems && (
          <div className="mt-1 pt-2.5 border-t border-gray-100 space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700">
                Outstanding open items: <span className="font-semibold">{formatAED(customer.open_items_amount)}</span>
              </p>
            </div>
            <a
              href={`mailto:${customer.contact_email}?subject=Payment Request: Outstanding Balance - ${customer.name}&body=Dear ${customer.contact_name},%0D%0A%0D%0AThis is a friendly request to clear the outstanding balance of ${formatAED(customer.open_items_amount)} on your account.%0D%0A%0D%0APlease make the payment here: https://pay.sfa-platform.com/invoice/pay%0D%0A%0D%0ABest regards,%0D%0ASales Team`}
              className="mt-1.5 flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl border border-indigo-200 bg-indigo-50 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              Send Payment Request
            </a>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2">
        <Link
          href={`/rep/visit/${id}`}
          className="rounded-2xl bg-white p-3.5 flex flex-col items-center gap-1.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ring-1 ring-gray-100 hover:ring-indigo-200 hover:shadow-[0_2px_8px_rgba(79,70,229,0.08)] active:scale-[0.97] transition-all"
        >
          <CalendarCheck size={18} className="text-indigo-600" />
          <span className="text-xs font-medium text-gray-700">Visit</span>
        </Link>
        <Link
          href={`/rep/order/new?customer=${id}`}
          className="rounded-2xl bg-white p-3.5 flex flex-col items-center gap-1.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ring-1 ring-gray-100 hover:ring-indigo-200 hover:shadow-[0_2px_8px_rgba(79,70,229,0.08)] active:scale-[0.97] transition-all"
        >
          <ShoppingCart size={18} className="text-indigo-600" />
          <span className="text-xs font-medium text-gray-700">New order</span>
        </Link>
        <Link
          href={`/rep/documents?customer=${id}`}
          className="rounded-2xl bg-white p-3.5 flex flex-col items-center gap-1.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ring-1 ring-gray-100 hover:ring-indigo-200 hover:shadow-[0_2px_8px_rgba(79,70,229,0.08)] active:scale-[0.97] transition-all"
        >
          <FileText size={18} className="text-indigo-600" />
          <span className="text-xs font-medium text-gray-700">Send doc</span>
        </Link>
      </div>

      {/* Negotiated pricing */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Negotiated pricing</h2>
        {!pricing || pricing.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ring-1 ring-gray-100 flex flex-col items-center gap-2 text-center">
            <Tag className="text-gray-300" size={22} />
            <p className="text-xs text-gray-400">No negotiated pricing on file for this customer.</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] ring-1 ring-gray-100 divide-y divide-gray-100 overflow-hidden">
            {pricing.map((p: any, i: number) => (
              <div key={i} className="px-4 py-2.5 flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <p className="text-gray-700 truncate">{p.product?.name}</p>
                  {p.product?.sku && (
                    <p className="text-[11px] text-gray-400 font-mono">{p.product.sku}</p>
                  )}
                </div>
                <span className="font-semibold text-gray-900 tabular-nums shrink-0 pl-3">
                  {formatAED(p.price)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Purchase history */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Recent purchase history</h2>
        {!history || history.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ring-1 ring-gray-100 flex flex-col items-center gap-2 text-center">
            <History className="text-gray-300" size={22} />
            <p className="text-xs text-gray-400">No purchase history yet.</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] ring-1 ring-gray-100 divide-y divide-gray-100 overflow-hidden">
            {history.map((h: any, i: number) => (
              <div key={i} className="px-4 py-2.5 flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <p className="text-gray-700 truncate">{h.product?.name}</p>
                  <p className="text-[11px] text-gray-400">{formatMonth(h.order_month)}</p>
                </div>
                <span className="text-gray-500 tabular-nums shrink-0 pl-3">{formatAED(h.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}