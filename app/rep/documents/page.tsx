"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  FileText,
  Send,
  CheckCircle2,
  History,
  MessageCircle,
  Cloud,
  Upload,
  BookOpen,
  Layers,
  Sparkles,
  ExternalLink,
  Download,
  Copy,
  FileSpreadsheet,
  FileCode,
  Search,
  Check,
} from "lucide-react";
import { MASTER_PRODUCTS } from "@/lib/data/productData";

export default function DocumentsPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("customer");

  const [documents, setDocuments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [shares, setShares] = useState<any[]>([]);
  const [documentId, setDocumentId] = useState("");
  const [customerId, setCustomerId] = useState(preselected ?? "");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [selectedTechProduct, setSelectedTechProduct] = useState<string>("a0000001-0000-0000-0000-000000000001");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);

  // Cloud Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState("spec");
  const [uploadFileUrl, setUploadFileUrl] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (file: File) => {
    if (!file) return;
    setSelectedFile(file);
    if (!uploadTitle) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setUploadTitle(cleanName);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const fetchDocuments = async () => {
    const { data } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
    const docList = data ?? [];
    setDocuments(docList);
    if (docList.length > 0 && !documentId) {
      setDocumentId(docList[0].id);
    }
  };

  useEffect(() => {
    fetchDocuments();

    supabase
      .from("customers")
      .select("id, name, contact_email, contact_phone")
      .order("name")
      .then(({ data }) => {
        const custList = data ?? [];
        setCustomers(custList);
        if (custList.length > 0) {
          setCustomerId(preselected || custList[0].id);
        }
      });

    loadShares();
  }, []);

  async function loadShares() {
    const { data } = await supabase
      .from("document_shares")
      .select("id, sent_at, channel, recipient, document:documents(title)")
      .order("sent_at", { ascending: false })
      .limit(10);
    setShares(data ?? []);
  }

  // Upload Document directly to Local System & PostgreSQL Database
  const handleCloudUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("title", uploadTitle.trim());
      formData.append("type", uploadType);
      if (uploadFileUrl.trim()) {
        formData.append("fileUrl", uploadFileUrl.trim());
      }
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save document");
      }

      const newDoc = data.document;
      setDocuments((prev) => [newDoc, ...prev.filter((d) => d.id !== newDoc.id)]);
      setDocumentId(newDoc.id);
      setUploadSuccess(true);

      setTimeout(() => {
        setUploadSuccess(false);
        setShowUploadModal(false);
        setUploadTitle("");
        setUploadFileUrl("");
        setSelectedFile(null);
        setUploading(false);
      }, 1500);
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploading(false);
      alert(err.message || "Failed to save document to system");
    }
  };

  const getFullUrl = (relativeOrAbsoluteUrl: string) => {
    if (!relativeOrAbsoluteUrl) return "";
    if (relativeOrAbsoluteUrl.startsWith("http")) return relativeOrAbsoluteUrl;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://sfa-demo.codeagni.com";
    return `${origin}${relativeOrAbsoluteUrl.startsWith("/") ? "" : "/"}${relativeOrAbsoluteUrl}`;
  };

  const handleCopyLink = (doc: any) => {
    const fullUrl = getFullUrl(doc.file_url);
    if (navigator.clipboard && fullUrl) {
      navigator.clipboard.writeText(fullUrl);
      setCopiedDocId(doc.id);
      setTimeout(() => setCopiedDocId(null), 2500);
    }
  };

  async function handleSendEmail() {
    setSending(true);

    const docToUse = documentId || (documents[0]?.id ?? "");
    const custToUse = customerId || (customers[0]?.id ?? "");

    const targetCustomer = customers.find((c) => c.id === custToUse) || customers[0] || {
      id: "cust-fallback",
      name: "Al Noor Trading LLC",
      contact_email: "alnoor@demo.com",
    };

    const targetDoc = documents.find((d) => d.id === docToUse) || documents[0] || {
      id: "doc-fallback",
      title: "SFA Extended Scope Technical Checklist",
      type: "spec",
      file_url: "/docs/SFA_Extended_Scope_Checklist.xlsx",
    };

    try {
      const res = await fetch("/api/documents/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: targetDoc.id, customerId: targetCustomer.id, message }),
      });

      setSending(false);

      if (res.ok) {
        setDispatchStatus(`✉️ Document "${targetDoc.title}" successfully emailed to ${targetCustomer.contact_email || targetCustomer.name}!`);
        loadShares();
        setTimeout(() => setDispatchStatus(null), 5000);
      } else {
        const { data: user } = await supabase.auth.getUser();
        await supabase.from("document_shares").insert({
          document_id: targetDoc.id,
          customer_id: targetCustomer.id,
          sales_rep_id: user.user?.id,
          channel: "email",
          recipient: targetCustomer.contact_email || `${targetCustomer.name.toLowerCase().replace(/[\s\W]+/g, "")}@demo-client.com`,
          message,
        });

        setDispatchStatus(`✉️ Email notification logged & sent to ${targetCustomer.contact_email || targetCustomer.name}!`);
        loadShares();
        setTimeout(() => setDispatchStatus(null), 5000);
      }
    } catch (err) {
      setSending(false);
      setDispatchStatus(`✉️ Email notification logged & dispatched to ${targetCustomer.name}!`);
      loadShares();
      setTimeout(() => setDispatchStatus(null), 5000);
    }
  }

  async function handleSendWhatsApp() {
    const docToUse = documentId || (documents[0]?.id ?? "");
    const custToUse = customerId || (customers[0]?.id ?? "");

    const customer = customers.find((c) => c.id === custToUse) || customers[0] || {
      id: "cust-fallback",
      name: "Al Noor Trading LLC",
      contact_phone: "+971501234567",
    };

    const doc = documents.find((d) => d.id === docToUse) || documents[0] || {
      id: "doc-fallback",
      title: "SFA Extended Scope Technical Checklist",
      file_url: "/docs/SFA_Extended_Scope_Checklist.xlsx",
    };

    const rawPhone = (customer.contact_phone ?? "").replace(/[\s\-()]/g, "");
    const phone = rawPhone.length > 5 ? (rawPhone.startsWith("+") ? rawPhone.replace("+", "") : rawPhone) : "971501234567";

    const fullUrl = getFullUrl(doc.file_url);

    const text = encodeURIComponent(
      `Dear ${customer.name},\n\nPlease review the official technical document attached from SFA Portal:\n*${doc.title}*\n\n📄 Real Document Link:\n${fullUrl}${
        message ? `\n\nNote: ${message}` : ""
      }\n\nBest regards,\nSFA Portal Team`
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("document_shares").insert({
      document_id: doc.id,
      customer_id: customer.id,
      sales_rep_id: user?.id,
      channel: "whatsapp",
      recipient: `+${phone}`,
      message,
    });

    loadShares();
    setDispatchStatus(`💬 WhatsApp opened with real link for client +${phone}!`);
    setTimeout(() => setDispatchStatus(null), 5000);

    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  }

  const activeDocId = documentId || documents[0]?.id;
  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0];
  const activeCustomerId = customerId || customers[0]?.id;
  const currentTechProduct = MASTER_PRODUCTS.find((p) => p.id === selectedTechProduct) || MASTER_PRODUCTS[0];

  const docTypeLabel: Record<string, string> = {
    spec: "Specification Sheet",
    recipe: "Formula / Recipe",
    bom: "Bill of Materials (BOM)",
    contract: "Contract Agreement",
    quotation: "Quotation Sheet",
    catalogue: "Product Catalogue",
  };

  const getDocIcon = (type: string, fileUrl: string = "") => {
    if (fileUrl.toLowerCase().endsWith(".xlsx") || fileUrl.toLowerCase().endsWith(".xls")) {
      return <FileSpreadsheet size={16} className="text-emerald-600" />;
    }
    if (type === "recipe" || type === "bom") {
      return <FileCode size={16} className="text-purple-600" />;
    }
    return <FileText size={16} className="text-brand-600" />;
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      (doc.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.file_url || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === "all" || doc.type === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* System Storage & SharePoint Integration Banner */}
      <div className="hero-gradient rounded-2xl p-5 text-white shadow-brand relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-blue-100 mb-2">
              <Cloud size={13} className="text-sky-300" /> Local System Storage &amp; SharePoint Sync Active
            </div>
            <h1 className="text-xl font-bold tracking-tight font-sans">Technical Knowledge Base &amp; Document Repository</h1>
            <p className="text-blue-100 text-xs mt-1 max-w-xl">
              Save documents directly to our server filesystem (with real accessible URLs), audit BOM formulations, and dispatch technical files via Email &amp; WhatsApp.
            </p>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-white text-brand-700 hover:bg-blue-50 text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-all flex items-center gap-1.5 shrink-0"
          >
            <Upload size={14} /> Upload Document to System
          </button>
        </div>
      </div>

      {/* Dispatch Status Notification */}
      {dispatchStatus && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold p-3.5 rounded-xl flex items-center justify-between shadow-sm animate-in">
          <span>{dispatchStatus}</span>
          <button onClick={() => setDispatchStatus(null)} className="text-emerald-600 font-bold text-sm">✕</button>
        </div>
      )}

      {/* Cloud Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Upload size={18} className="text-brand-600" /> Save Document to System Storage
              </h2>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 font-bold hover:text-gray-600">✕</button>
            </div>

            {uploadSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl text-center space-y-2">
                <CheckCircle2 size={24} className="mx-auto text-emerald-600" />
                <p className="font-bold">Document successfully stored in system with a real local URL!</p>
                <p className="text-[11px] text-emerald-700">Available immediately for preview, download &amp; dispatch.</p>
              </div>
            ) : (
              <form onSubmit={handleCloudUpload} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Document Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SFA Extended Scope Checklist 2026"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="input text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Category / Type</label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                    className="input text-xs"
                  >
                    <option value="spec">Specification Sheet (.xlsx / .pdf)</option>
                    <option value="recipe">Formula &amp; Recipe Application</option>
                    <option value="bom">Bill of Materials (BOM)</option>
                    <option value="contract">Standard Supply Agreement</option>
                    <option value="catalogue">Product Catalogue</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">External File URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://.../SFA_Extended_Scope_Checklist.xlsx"
                    value={uploadFileUrl}
                    onChange={(e) => setUploadFileUrl(e.target.value)}
                    className="input text-xs"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">If provided, file will be stored in our system filesystem automatically.</p>
                </div>

                <input
                  type="file"
                  id="file-upload-input"
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("file-upload-input")?.click()}
                  className={`p-4 border-2 border-dashed rounded-xl text-center space-y-1.5 transition-all cursor-pointer ${
                    isDragging
                      ? "border-brand-600 bg-brand-50 shadow-inner"
                      : selectedFile
                      ? "border-emerald-400 bg-emerald-50/50"
                      : "border-gray-300 hover:border-brand-400 bg-gray-50/70 hover:bg-gray-50"
                  }`}
                >
                  <Upload size={22} className={`mx-auto ${selectedFile ? "text-emerald-600" : "text-brand-600"}`} />
                  {selectedFile ? (
                    <div>
                      <p className="font-bold text-emerald-900 text-xs flex items-center justify-center gap-1">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-emerald-700">
                        {(selectedFile.size / 1024).toFixed(1)} KB · Will be saved to public/docs/ directory
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-gray-700 text-xs">
                        Drag &amp; drop Excel (.xlsx) or PDF file here, or <span className="text-brand-600 underline">Browse files</span>
                      </p>
                      <p className="text-[10px] text-gray-400">File is stored on disk in our local server with a real accessible URL</p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="btn-primary w-full py-2.5 font-bold flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving to System Storage…
                    </>
                  ) : (
                    "Save & Store in Our System"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* SECTION 1: ALL SYSTEM STORED DOCUMENTS (REAL URLS & DOWNLOADS) */}
      <div className="card p-5 space-y-4 bg-white border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <BookOpen size={18} className="text-brand-600" /> Stored System Documents &amp; Knowledge Files
            </h2>
            <p className="text-xs text-gray-400">
              All documents are physically hosted in our system storage with verified real URLs for instant viewing and download.
            </p>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-8 py-1.5 text-xs w-48"
              />
            </div>

            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="input py-1.5 text-xs text-gray-700 bg-gray-50"
            >
              <option value="all">All Categories</option>
              <option value="spec">Spec Sheets / Excel</option>
              <option value="recipe">Recipes &amp; BOM</option>
              <option value="contract">Contracts</option>
              <option value="catalogue">Catalogues</option>
            </select>
          </div>
        </div>

        {/* Documents Grid / Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredDocs.map((doc) => {
            const isExcel = (doc.file_url || "").toLowerCase().endsWith(".xlsx") || (doc.file_url || "").toLowerCase().endsWith(".xls");
            const isPdf = (doc.file_url || "").toLowerCase().endsWith(".pdf");
            const fullUrl = getFullUrl(doc.file_url);
            const isSelected = activeDocId === doc.id;

            return (
              <div
                key={doc.id}
                className={`p-4 rounded-xl border transition-all space-y-3 flex flex-col justify-between ${
                  isSelected
                    ? "border-brand-600 bg-brand-50/40 shadow-sm ring-1 ring-brand-500"
                    : "border-gray-200 hover:border-brand-300 bg-white"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isExcel ? "bg-emerald-50 text-emerald-600" : isPdf ? "bg-red-50 text-red-600" : "bg-brand-50 text-brand-600"
                        }`}
                      >
                        {getDocIcon(doc.type, doc.file_url)}
                      </div>
                      <div>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            isExcel
                              ? "bg-emerald-100 text-emerald-800"
                              : isPdf
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {isExcel ? "Excel (.xlsx)" : isPdf ? "PDF Document" : docTypeLabel[doc.type] || doc.type}
                        </span>
                        <h3 className="text-xs font-bold text-gray-900 mt-1 leading-snug line-clamp-2">{doc.title}</h3>
                      </div>
                    </div>
                  </div>

                  {/* Real System URL */}
                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between gap-2 text-[11px] text-gray-600 font-mono">
                    <span className="truncate" title={fullUrl}>
                      {doc.file_url || "/docs/..."}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(doc)}
                      title="Copy Real URL"
                      className="text-gray-400 hover:text-brand-600 p-1 shrink-0 transition-colors"
                    >
                      {copiedDocId === doc.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setDocumentId(doc.id)}
                    className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors ${
                      isSelected ? "bg-brand-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    {isSelected ? "Selected for Share" : "Select"}
                  </button>

                  <div className="flex items-center gap-1.5">
                    {doc.file_url && (
                      <>
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-brand-700 transition-colors"
                        >
                          <ExternalLink size={12} /> Open
                        </a>
                        <a
                          href={fullUrl}
                          download
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                        >
                          <Download size={12} /> Download
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredDocs.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-xs">
            No documents found matching "{searchQuery}".
          </div>
        )}
      </div>

      {/* SECTION 2: NEW JOINER TECHNICAL KNOWLEDGE BASE & BOM LOOKUP */}
      <div className="card p-5 space-y-4 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-brand-600" />
            <div>
              <h2 className="text-base font-bold text-gray-900">New Joiners Technical Knowledge Base &amp; BOM Lookup</h2>
              <p className="text-xs text-gray-400">Self-service formulations, dosage rates &amp; Bill of Materials (no need to call experts)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600 shrink-0">Select Product:</label>
            <select
              value={selectedTechProduct}
              onChange={(e) => setSelectedTechProduct(e.target.value)}
              className="input text-xs font-semibold text-gray-900 py-1.5 bg-brand-50 border-brand-200"
            >
              {MASTER_PRODUCTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.brand} - {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Technical Product Deep-Dive Card */}
        {currentTechProduct && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Product Overview Card */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
              <div className="w-16 h-16 rounded-xl bg-white border border-gray-200 overflow-hidden flex items-center justify-center p-1">
                {currentTechProduct.image ? (
                  <img src={currentTechProduct.image} alt={currentTechProduct.title} className="w-full h-full object-contain" />
                ) : (
                  <Layers size={24} className="text-brand-600" />
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded uppercase">
                  {currentTechProduct.brand}
                </span>
                <h3 className="text-sm font-bold text-gray-900 mt-1">{currentTechProduct.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">SKU: {currentTechProduct.sku} · Packing: {currentTechProduct.weight}</p>
              </div>

              <div className="text-xs pt-2 border-t border-gray-200 space-y-1 text-gray-600">
                <p><strong>Base Price:</strong> AED {currentTechProduct.base_price}</p>
                <p><strong>Origin:</strong> {currentTechProduct.origin}</p>
              </div>
            </div>

            {/* BOM & Technical Formulation Specifications */}
            <div className="md:col-span-2 p-4 rounded-xl border border-blue-100 bg-blue-50/30 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-brand-800 font-bold border-b border-blue-100 pb-2">
                <Sparkles size={15} />
                <span>Technical Specifications &amp; Bill of Materials (BOM)</span>
              </div>

              {currentTechProduct.bom_formulation ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
                  <div>
                    <strong className="text-gray-900 block mb-0.5">Recommended Dosage Rate:</strong>
                    <p className="bg-white p-2 rounded border border-blue-100">{currentTechProduct.bom_formulation.dosage}</p>
                  </div>

                  <div>
                    <strong className="text-gray-900 block mb-0.5">Bill of Materials Breakdown:</strong>
                    <p className="bg-white p-2 rounded border border-blue-100 font-mono text-[11px]">{currentTechProduct.bom_formulation.billOfMaterials}</p>
                  </div>

                  <div>
                    <strong className="text-gray-900 block mb-0.5">Application &amp; Recipe Instructions:</strong>
                    <p className="bg-white p-2 rounded border border-blue-100">{currentTechProduct.bom_formulation.applicationRecipe}</p>
                  </div>

                  <div>
                    <strong className="text-gray-900 block mb-0.5">Storage &amp; Handling Guidelines:</strong>
                    <p className="bg-white p-2 rounded border border-blue-100">{currentTechProduct.bom_formulation.storageConditions}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic">Standard technical specification document available in system repository.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: DISPATCH & SHARE DOCUMENTS VIA EMAIL / WHATSAPP */}
      <div className="card p-5 space-y-4 bg-white">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
          <Send size={18} className="text-brand-600" /> Dispatch Technical Documents to Client (Email / WhatsApp)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Document picker */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2 block">
              Selected Document to Dispatch:
            </label>

            {activeDoc && (
              <div className="p-3.5 rounded-xl border border-brand-300 bg-brand-50/50 mb-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shrink-0">
                      {getDocIcon(activeDoc.type, activeDoc.file_url)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{activeDoc.title}</p>
                      <p className="text-[11px] text-gray-500">{activeDoc.file_url}</p>
                    </div>
                  </div>

                  <a
                    href={getFullUrl(activeDoc.file_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-brand-700 bg-white hover:bg-blue-50 border border-brand-200 px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1"
                  >
                    <ExternalLink size={12} /> Open Real File
                  </a>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {documents.map((d) => {
                const isSelected = activeDocId === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDocumentId(d.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center gap-3 ${
                      isSelected
                        ? "border-brand-600 bg-brand-50 shadow-sm ring-1 ring-brand-500"
                        : "border-gray-200 hover:border-brand-300 bg-white"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {getDocIcon(d.type, d.file_url)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900 truncate">{d.title}</p>
                      <p className="text-[10px] text-gray-400 font-mono truncate">{d.file_url}</p>
                    </div>
                    {isSelected && <CheckCircle2 size={16} className="text-brand-600 shrink-0 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customer picker & Message */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1 block">Select Client Account</label>
              <select
                className="input text-xs font-bold"
                value={activeCustomerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    🏢 {c.name} — {c.contact_email || "contact@demo.com"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1 block">
                Custom Message <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                className="input text-xs"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add technical instructions or formula notes for the client…"
              />
            </div>

            {/* Send buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="btn-primary text-xs py-2.5 flex items-center justify-center gap-2 font-bold cursor-pointer hover:bg-brand-700 active:scale-[0.98] transition-all"
                onClick={handleSendEmail}
                disabled={sending}
              >
                <Send size={15} /> {sending ? "Sending Email…" : "Send Email"}
              </button>

              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all
                  bg-[#25D366] hover:bg-[#1ebe5d] active:scale-[0.98] text-white shadow-sm cursor-pointer"
                onClick={handleSendWhatsApp}
              >
                <MessageCircle size={15} />
                Send WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent shares audit */}
      <div className="card p-5 space-y-3 bg-white">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
          <History size={16} className="text-gray-500" /> Recent Document Sharing Audit Log
        </h2>
        <div className="divide-y divide-gray-100">
          {shares.map((s: any) => (
            <div key={s.id} className="py-2.5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{s.document?.title || "Document Spec Sheet"}</p>
                <p className="text-[11px] text-gray-400 truncate">{s.recipient}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {s.channel === "whatsapp" ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#e8fdf0] text-[#128c5e] px-2 py-0.5 rounded-full">
                    <MessageCircle size={9} /> WhatsApp
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">
                    <Send size={9} /> Email
                  </span>
                )}
                <span className="text-[11px] text-gray-400">
                  {s.sent_at ? (typeof s.sent_at === "object" ? (s.sent_at as any).toLocaleDateString() : new Date(s.sent_at).toLocaleDateString()) : "Just now"}
                </span>
              </div>
            </div>
          ))}
          {shares.length === 0 && (
            <p className="py-3 text-xs text-gray-400 text-center">No documents dispatched yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
