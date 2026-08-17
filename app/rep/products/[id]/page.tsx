import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Package,
  Tag,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  FileText,
  ShoppingCart,
  ArrowLeft,
  Info,
  ChevronRight,
  Globe,
  ExternalLink,
  BookOpen,
  Sparkles,
  Layers,
  Calendar,
  TrendingUp,
  Boxes,
  ShieldCheck,
  Send,
} from "lucide-react";
import { MASTER_PRODUCTS } from "@/lib/data/productData";
import ExportExcelButton from "@/components/ExportExcelButton";

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: any }> = {
  active:       { label: "Active (In Stock)", cls: "bg-emerald-50 text-emerald-700 border-emerald-200",  icon: CheckCircle2 },
  promo:        { label: "Promo Push",       cls: "bg-violet-50 text-violet-700 border-violet-200",     icon: Tag },
  near_expiry:  { label: "Near Expiry Alert", cls: "bg-amber-50 text-amber-700 border-amber-200",        icon: AlertTriangle },
  out_of_stock: { label: "Out of Stock",      cls: "bg-red-50 text-red-700 border-red-200",              icon: XCircle },
  non_moving:   { label: "Non-Moving",        cls: "bg-gray-100 text-gray-500 border-gray-200",          icon: Package },
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: dbProduct } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  // Find rich master product object or fallback
  const masterProd = MASTER_PRODUCTS.find((p) => p.id === id || p.sku === dbProduct?.sku);
  const product = masterProd
    ? {
        ...masterProd,
        base_price: dbProduct?.base_price ?? masterProd.base_price,
        stock_status: dbProduct?.stock_status ?? masterProd.stock_status,
        stock_units: dbProduct?.stock_units ?? masterProd.stock_units,
        expiry_date: dbProduct?.expiry_date ?? masterProd.expiry_date,
      }
    : dbProduct;

  const { data: docs } = await supabase
    .from("documents")
    .select("id, title, type, file_url")
    .eq("product_id", id);

  const { data: alternatives } = await supabase
    .from("product_alternatives")
    .select("alternative:products!product_alternatives_alternative_product_id_fkey(id, name, base_price, stock_status)")
    .eq("product_id", id);

  const { data: recommendations } = await supabase
    .from("product_recommendations")
    .select("reason, recommended:products!product_recommendations_recommended_product_id_fkey(id, name, base_price)")
    .eq("product_id", id);

  if (!product) {
    return <p className="text-sm text-gray-500 p-4">Product not found.</p>;
  }

  const status = STATUS_CONFIG[product.stock_status] ?? STATUS_CONFIG.active;
  const StatusIcon = status.icon;

  const docTypeLabel: Record<string, string> = {
    spec: "Specification Sheet",
    recipe: "Recipe / Application Note",
    contract: "Contract Template",
    quotation: "Quotation",
    catalogue: "Catalogue",
  };

  const historical6M = product.historical_6m_units || [40, 45, 50, 55, 60, 65];
  const forecast3M = product.forecast_3m_units || [70, 75, 80];

  return (
    <div className="space-y-6 pb-10">
      {/* Back Nav */}
      <Link
        href="/rep/products"
        className="inline-flex items-center gap-1.5 text-xs text-brand-600 font-medium hover:underline"
      >
        <ArrowLeft size={13} /> Back to Product Catalog
      </Link>

      {/* SECTION 1: PRODUCT HERO HEADER CARD */}
      <div className="card p-6 space-y-4 bg-white border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6">
          {/* High-Res Product Image */}
          {product.image && (
            <div className="w-full md:w-64 h-64 rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden flex-shrink-0 relative flex items-center justify-center p-3 shadow-inner">
              <img
                src={product.image}
                alt={product.title || product.name}
                className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}

          {/* Details & Metadata */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
                {product.brand || "Master Baker"}
              </span>

              <div className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${status.cls}`}>
                <StatusIcon size={13} />
                {status.label}
              </div>
            </div>

            <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
              {product.title || product.name}
            </h1>

            <p className="text-xs font-medium text-gray-500">
              Category: <strong className="text-gray-800">{product.category || "Bakery Ingredients"}</strong>
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs bg-gray-50/80 p-3 rounded-xl border border-gray-100">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Item Code / SKU</span>
                <strong className="text-gray-900 font-mono text-xs">{product.sku}</strong>
              </div>

              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Packing Weight</span>
                <strong className="text-gray-900">{product.weight} ({product.uom})</strong>
              </div>

              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Country of Origin</span>
                <span className="font-bold text-gray-900 flex items-center gap-1">
                  <Globe size={12} className="text-brand-600" /> {product.origin}
                </span>
              </div>
            </div>

            {/* Pricing & Stock Units */}
            <div className="pt-2 flex items-center justify-between gap-4 flex-wrap border-t border-gray-100">
              <div>
                <span className="text-2xl font-extrabold text-brand-700">
                  AED {Number(product.base_price).toLocaleString("en-AE")}
                </span>
                <span className="text-xs text-gray-400 ml-1.5">per unit ({product.uom})</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  📦 Warehouse Stock: {product.stock_units ?? 200} Units
                </span>
                {product.expiry_date && (
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1">
                    <Calendar size={12} /> Best Before: {typeof product.expiry_date === 'object' && product.expiry_date ? new Date(product.expiry_date).toLocaleDateString("en-GB") : String(product.expiry_date)}
                  </span>
                )}
              </div>
            </div>

            {product.url && (
              <a
                href={product.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-brand-600 font-semibold hover:underline pt-1"
              >
                View official product page on Master Baker website <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      </div>



      {/* SECTION 2: NEW JOINER TECHNICAL KNOWLEDGE BASE & BOM SPECIFICATIONS */}
      <div className="card p-6 space-y-4 bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-brand-600" />
            <div>
              <h2 className="text-base font-bold text-gray-900">Technical Knowledge Base &amp; Bill of Materials (BOM)</h2>
              <p className="text-xs text-gray-400">Self-service formulation details for new sales reps and technical advisors</p>
            </div>
          </div>
          <span className="text-xs font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            Formulation Matrix
          </span>
        </div>

        {product.bom_formulation ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1">
              <strong className="text-gray-900 font-bold block flex items-center gap-1.5 text-xs">
                <Sparkles size={13} className="text-brand-600" /> Recommended Dosage Rate
              </strong>
              <p className="text-gray-700 leading-relaxed font-medium bg-white p-2.5 rounded-lg border border-blue-100">
                {product.bom_formulation.dosage}
              </p>
            </div>

            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1">
              <strong className="text-gray-900 font-bold block flex items-center gap-1.5 text-xs">
                <Boxes size={13} className="text-brand-600" /> Bill of Materials (BOM) Breakdown
              </strong>
              <p className="text-gray-800 font-mono text-[11px] bg-white p-2.5 rounded-lg border border-blue-100 leading-relaxed">
                {product.bom_formulation.billOfMaterials}
              </p>
            </div>

            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1">
              <strong className="text-gray-900 font-bold block flex items-center gap-1.5 text-xs">
                <Layers size={13} className="text-brand-600" /> Application &amp; Recipe Instructions
              </strong>
              <p className="text-gray-700 leading-relaxed bg-white p-2.5 rounded-lg border border-blue-100">
                {product.bom_formulation.applicationRecipe}
              </p>
            </div>

            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1">
              <strong className="text-gray-900 font-bold block flex items-center gap-1.5 text-xs">
                <ShieldCheck size={13} className="text-brand-600" /> Storage &amp; Handling Conditions
              </strong>
              <p className="text-gray-700 leading-relaxed bg-white p-2.5 rounded-lg border border-blue-100">
                {product.bom_formulation.storageConditions}
              </p>
            </div>

            {product.bom_formulation.keyIngredients && (
              <div className="md:col-span-2 p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <strong className="text-gray-900 font-bold block text-xs">Key Ingredients Profile:</strong>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {product.bom_formulation.keyIngredients.map((ing: string, i: number) => (
                    <span key={i} className="bg-white text-gray-800 font-semibold px-2.5 py-1 rounded-md border border-gray-200 text-[11px]">
                      • {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-xl text-xs text-gray-500 space-y-1">
            <p className="font-semibold text-gray-700">Standard Technical Specification Sheet Available</p>
            <p>Full formulation documents synced to Master Baker SharePoint Repository.</p>
          </div>
        )}
      </div>

      {/* SECTION 3: 6-MONTH HISTORICAL BUYING & 3-MONTH FORECAST matrix */}
      <div className="card p-6 space-y-4 bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp size={18} className="text-brand-600" /> Historical Sales Velocity &amp; 3-Month Demand Forecast
          </h2>
          <ExportExcelButton
            data={[{
              "Product SKU": product.sku,
              "Product Name": product.name,
              "Brand": product.brand || "—",
              "Category": product.category || "—",
              "Unit Price (AED)": product.base_price,
              "M-6 (Units)": historical6M[0],
              "M-5 (Units)": historical6M[1],
              "M-4 (Units)": historical6M[2],
              "M-3 (Units)": historical6M[3],
              "M-2 (Units)": historical6M[4],
              "M-1 Last Month (Units)": historical6M[5],
              "Month +1 Proj (Units)": forecast3M[0],
              "Month +2 Proj (Units)": forecast3M[1],
              "Month +3 Proj (Units)": forecast3M[2],
            }]}
            filename={`${product.sku}-Demand-Forecast`}
            sheetName="Forecast"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                <th className="p-2.5 text-center bg-gray-100">M-6</th>
                <th className="p-2.5 text-center bg-gray-100">M-5</th>
                <th className="p-2.5 text-center bg-gray-100">M-4</th>
                <th className="p-2.5 text-center bg-gray-100">M-3</th>
                <th className="p-2.5 text-center bg-gray-100">M-2</th>
                <th className="p-2.5 text-center bg-gray-200 font-extrabold text-gray-900">M-1 (Last Month)</th>
                <th className="p-2.5 text-center bg-blue-50 text-brand-800">Month +1 (Proj)</th>
                <th className="p-2.5 text-center bg-blue-50 text-brand-800">Month +2 (Proj)</th>
                <th className="p-2.5 text-center bg-blue-50 text-brand-800">Month +3 (Proj)</th>
              </tr>
            </thead>
            <tbody className="bg-white font-mono">
              <tr>
                <td className="p-2.5 text-center bg-gray-50/50 text-gray-600">{historical6M[0]} units</td>
                <td className="p-2.5 text-center bg-gray-50/50 text-gray-600">{historical6M[1]} units</td>
                <td className="p-2.5 text-center bg-gray-50/50 text-gray-600">{historical6M[2]} units</td>
                <td className="p-2.5 text-center bg-gray-50/50 text-gray-600">{historical6M[3]} units</td>
                <td className="p-2.5 text-center bg-gray-50/50 text-gray-600">{historical6M[4]} units</td>
                <td className="p-2.5 text-center bg-gray-100 font-bold text-gray-900">{historical6M[5]} units</td>

                <td className="p-2.5 text-center bg-blue-50/40 font-bold text-brand-700">{forecast3M[0]} units</td>
                <td className="p-2.5 text-center bg-blue-50/40 font-bold text-brand-700">{forecast3M[1]} units</td>
                <td className="p-2.5 text-center bg-blue-50/40 font-bold text-brand-700">{forecast3M[2]} units</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Alternatives */}
      {alternatives && alternatives.length > 0 && (
        <div className="card p-5 space-y-3 bg-white border border-gray-200">
          <h2 className="text-sm font-bold text-gray-900">Recommended Alternative Products (In-Stock)</h2>
          <div className="space-y-2">
            {alternatives.map((a: any, i: number) => (
              <Link
                key={i}
                href={`/rep/products/${a.alternative?.id}`}
                className="card-hover p-3 flex items-center gap-3 border border-gray-200 rounded-xl"
              >
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                  <Package size={14} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900">{a.alternative?.name}</p>
                  <p className="text-[11px] text-gray-400">AED {a.alternative?.base_price}</p>
                </div>
                <ChevronRight size={14} className="text-gray-300" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
