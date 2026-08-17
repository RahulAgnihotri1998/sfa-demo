const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const docsDir = path.join(__dirname, "..", "public", "docs");
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// 1. Generate SFA_Extended_Scope_Checklist.xlsx
const wb = XLSX.utils.book_new();

// Sheet 1: Extended Scope Deliverables
const scopeData = [
  {
    "Item #": "EXT-01",
    "Scope Area": "Customer Visit Management",
    "Module / Page": "/rep/visit",
    "Feature / Requirement": "Product Audit & Stock Check Form",
    "Technical Architecture / Implementation": "In-visit modal to audit customer stock levels, shelf-life expiry, facing count, and re-order triggers with instant DB commit.",
    "Status": "COMPLETED",
    "Priority": "P1 - Critical",
    "Data Source": "PostgreSQL & Mock Sage X3"
  },
  {
    "Item #": "EXT-02",
    "Scope Area": "Compliance & Verification",
    "Module / Page": "/rep/visit, /manager/audit",
    "Feature / Requirement": "Geo-Fencing Controls & Compliance Mechanisms",
    "Technical Architecture / Implementation": "Haversine GPS distance calculation against customer lat/long with configurable radius (200m). Non-compliant check-in prompts reason & logs override to audit_log table.",
    "Status": "COMPLETED",
    "Priority": "P1 - Critical",
    "Data Source": "PostgreSQL audit_log"
  },
  {
    "Item #": "EXT-03",
    "Scope Area": "Customer Intelligence",
    "Module / Page": "/rep/customers/[id]",
    "Feature / Requirement": "Customer 360 & Slow-Moving Stock Indicators",
    "Technical Architecture / Implementation": "Deep customer 360 overview: Sage X3 credit limit, aging balance buckets (0-30, 31-60, 61-90, 90+), dormancy score, and slow-moving stock badge.",
    "Status": "COMPLETED",
    "Priority": "P1 - Critical",
    "Data Source": "Mock Sage X3 & PostgreSQL"
  },
  {
    "Item #": "EXT-04",
    "Scope Area": "Forecasting & Analytics",
    "Module / Page": "/rep/forecasting, /manager/forecasting",
    "Feature / Requirement": "SKU-Level 6M Historical & 3M Demand Forecast",
    "Technical Architecture / Implementation": "Exponential smoothing and moving average model over 6-month historical purchase units to project 3-month future demand with rep vs manager variance.",
    "Status": "COMPLETED",
    "Priority": "P1 - Critical",
    "Data Source": "PostgreSQL & Forecast Model"
  },
  {
    "Item #": "EXT-05",
    "Scope Area": "AI / Next Best Action",
    "Module / Page": "/rep/alerts, /rep/customers/[id]",
    "Feature / Requirement": "Next Best Action (NBA) Recommendation Engine",
    "Technical Architecture / Implementation": "Rule-based and algorithmic NBA engine detecting buying declines (>30% drop), near-expiry batch promotions, re-order cycle milestones, and credit risk.",
    "Status": "COMPLETED",
    "Priority": "P2 - High",
    "Data Source": "NBA Decision Matrix"
  },
  {
    "Item #": "EXT-06",
    "Scope Area": "Cross-Selling & Basket Analysis",
    "Module / Page": "/rep/order/new, /rep/products/[id]",
    "Feature / Requirement": "Market Basket Analysis & Formulation Cross-Sell",
    "Technical Architecture / Implementation": "Association rule mining pairing primary bakery ingredients (e.g., Fabbri Gourmet Sauces) with complementary mixes, improvers, and toppings.",
    "Status": "COMPLETED",
    "Priority": "P2 - High",
    "Data Source": "Product Recommendations Matrix"
  },
  {
    "Item #": "EXT-07",
    "Scope Area": "ERP Integration",
    "Module / Page": "/api/mock-sage, /manager/erp-sync",
    "Feature / Requirement": "Two-Way Sage X3 ERP Sync & Webhook Write-Back",
    "Technical Architecture / Implementation": "Adapter Pattern with Mock Sage X3 service. Full bidirectionality: pushes confirmed orders (SO-2026-X3), syncs credit balances, and accepts status callbacks.",
    "Status": "COMPLETED",
    "Priority": "P1 - Critical",
    "Data Source": "lib/erp/mockSageX3.ts"
  },
  {
    "Item #": "EXT-08",
    "Scope Area": "Competitor Intelligence",
    "Module / Page": "/rep/competitor-intel, /manager/competitor-intel",
    "Feature / Requirement": "Competitor Activity & In-Store Shelf Share",
    "Technical Architecture / Implementation": "Field rep capture of competitor brand, SKU pricing, shelf-share %, promotional activity, and photo evidence with manager heatmaps.",
    "Status": "COMPLETED",
    "Priority": "P2 - High",
    "Data Source": "PostgreSQL competitor_intel"
  },
  {
    "Item #": "EXT-09",
    "Scope Area": "Account Hierarchy",
    "Module / Page": "/rep/visit, /rep/order/new",
    "Feature / Requirement": "Customer Hierarchy & Parent/Child Billing",
    "Technical Architecture / Implementation": "Support for holding groups (e.g. Landmark Hospitality, Americana) with branch-level visits and centralized billing / consolidated credit check.",
    "Status": "COMPLETED",
    "Priority": "P1 - Critical",
    "Data Source": "PostgreSQL customers.parent_id"
  },
  {
    "Item #": "EXT-10",
    "Scope Area": "Knowledge Base & Dispatch",
    "Module / Page": "/rep/documents, /api/documents",
    "Feature / Requirement": "Technical Knowledge Base & SharePoint Document Dispatch",
    "Technical Architecture / Implementation": "Formulation & BOM repository with real local file storage, email SMTP dispatch, WhatsApp template routing, and download audit trail.",
    "Status": "COMPLETED",
    "Priority": "P1 - Critical",
    "Data Source": "PostgreSQL & Local File System"
  },
  {
    "Item #": "EXT-11",
    "Scope Area": "Gamification & Performance",
    "Module / Page": "/rep/leaderboard, /manager/leaderboard",
    "Feature / Requirement": "Rep Performance Leaderboard & Gamification Badges",
    "Technical Architecture / Implementation": "Real-time tier ranking (Bronze, Silver, Gold, Platinum), streak multipliers, visit completion rates, and target quota attainment widgets.",
    "Status": "COMPLETED",
    "Priority": "P3 - Medium",
    "Data Source": "PostgreSQL leaderboards"
  },
  {
    "Item #": "EXT-12",
    "Scope Area": "Lead Management",
    "Module / Page": "/rep/leads, /manager/leads",
    "Feature / Requirement": "Native Lead Lifecycle & Qualification Pipeline",
    "Technical Architecture / Implementation": "Kanban & list views for Lead -> Qualified -> Opportunity -> Customer conversion with territory assignment and touchpoint logging.",
    "Status": "COMPLETED",
    "Priority": "P2 - High",
    "Data Source": "PostgreSQL leads"
  }
];

const wsScope = XLSX.utils.json_to_sheet(scopeData);
XLSX.utils.book_append_sheet(wb, wsScope, "Extended Scope Deliverables");

// Sheet 2: Sage X3 Mock Integration
const sageData = [
  {
    "ERP Object": "Sales Order (SOH)",
    "API Method / Route": "POST /api/orders/advance",
    "Direction": "SFA -> Sage X3",
    "Payload Schema": "{ orderId, customerCode, items: [{ sku, qty, unitPrice, discount }] }",
    "Simulated Sage X3 Response": "200 OK -> { sageSoNumber: 'SO-2026-X3001', status: 'VALIDATED', arImpact: true }",
    "Latency / Reliability": "120ms (Deterministic Mock)"
  },
  {
    "ERP Object": "Customer Financials (BPC)",
    "API Method / Route": "GET /api/mock-sage/customer/:id",
    "Direction": "Sage X3 -> SFA",
    "Payload Schema": "Query param: customer_id",
    "Simulated Sage X3 Response": "{ creditLimit: 250000, currentBalance: 114500, aging: { current: 45000, 30days: 35000, 60days: 22000, 90plus: 12500 }, blocked: false }",
    "Latency / Reliability": "85ms (Deterministic Mock)"
  },
  {
    "ERP Object": "Inventory & Stock Batches (ITM)",
    "API Method / Route": "GET /api/mock-sage/inventory",
    "Direction": "Sage X3 -> SFA",
    "Payload Schema": "Query param: sku",
    "Simulated Sage X3 Response": "{ sku: 'FB-950-01', totalPhysical: 450, allocated: 120, available: 330, batchLots: [{ lot: 'LOT-2026-08', expiry: '2026-08-18', qty: 45 }] }",
    "Latency / Reliability": "90ms (Deterministic Mock)"
  },
  {
    "ERP Object": "Price List & Trade Agreements (PPL)",
    "API Method / Route": "GET /api/mock-sage/pricing",
    "Direction": "Sage X3 -> SFA",
    "Payload Schema": "{ customerCategory, tierCode }",
    "Simulated Sage X3 Response": "{ basePrice: 85, negotiatedDiscountMax: 0.15, volumeDiscounts: [{ minQty: 50, rate: 0.08 }] }",
    "Latency / Reliability": "75ms (Deterministic Mock)"
  }
];

const wsSage = XLSX.utils.json_to_sheet(sageData);
XLSX.utils.book_append_sheet(wb, wsSage, "Sage X3 ERP Mocks");

// Sheet 3: Verification & Presentation
const demoData = [
  {
    "Step": 1,
    "Demo Segment": "Login & Territory Overview",
    "Route": "/rep/dashboard",
    "Action": "Review morning targets, route plan, and NBA priority notifications",
    "Expected Result": "Live metrics load instantly with zero external dependencies"
  },
  {
    "Step": 2,
    "Demo Segment": "Geo-Fenced Customer Check-In",
    "Route": "/rep/visit",
    "Action": "Perform GPS check-in at client location with stock audit",
    "Expected Result": "Green compliance status if within 200m; override modal if outside"
  },
  {
    "Step": 3,
    "Demo Segment": "Order Capture & Sage X3 Write-Back",
    "Route": "/rep/order/new",
    "Action": "Add products, verify credit limit, apply basket promo, submit",
    "Expected Result": "Order generated with Sage X3 tracking reference SO-2026-X3"
  },
  {
    "Step": 4,
    "Demo Segment": "Technical Knowledge Base & Dispatch",
    "Route": "/rep/documents",
    "Action": "Lookup Fabbri formulation BOM and dispatch spec sheet via WhatsApp & Email",
    "Expected Result": "Real local URL generated and instant dispatch logged to audit"
  }
];

const wsDemo = XLSX.utils.json_to_sheet(demoData);
XLSX.utils.book_append_sheet(wb, wsDemo, "Demo Presentation Guide");

const excelPath = path.join(docsDir, "SFA_Extended_Scope_Checklist.xlsx");
XLSX.writeFile(wb, excelPath);
console.log(`✓ Created Excel workbook: ${excelPath}`);

// Helper to create valid sample PDF binary
function createSamplePdf(title, subtitle) {
  const content = `%PDF-1.4
1 0 obj
<< /Title (${title})
   /Author (Master Baker Technical Services)
   /Subject (${subtitle})
   /Creator (Master Baker SFA Platform)
   /CreationDate (D:20260814120000Z)
>>
endobj
2 0 obj
<< /Type /Catalog
   /Pages 3 0 R
>>
endobj
3 0 obj
<< /Type /Pages
   /Kids [4 0 R]
   /Count 1
>>
endobj
4 0 obj
<< /Type /Page
   /Parent 3 0 R
   /MediaBox [0 0 612 792]
   /Resources <<
      /Font <<
         /F1 5 0 R
         /F2 6 0 R
      >>
   >>
   /Contents 7 0 R
>>
endobj
5 0 obj
<< /Type /Font
   /Subtype /Type1
   /BaseFont /Helvetica-Bold
>>
endobj
6 0 obj
<< /Type /Font
   /Subtype /Type1
   /BaseFont /Helvetica
>>
endobj
7 0 obj
<< /Length 380 >>
stream
BT
/F1 20 Tf
50 720 Td
(${title}) Tj
/F2 12 Tf
0 -30 Td
(${subtitle}) Tj
0 -25 Td
(Document Classification: Official Technical Release - Master Baker SFA) Tj
0 -25 Td
(Status: Verified & Synced with SharePoint Repository) Tj
0 -40 Td
(Description:) Tj
0 -20 Td
(This document contains formulation guidelines, quality standards, dosage rates,) Tj
0 -18 Td
(and standard operating specifications for field commercial execution.) Tj
0 -40 Td
(Generated via Master Baker SFA Local Document System) Tj
ET
endstream
endobj
xref
0 8
0000000000 65535 f
0000000009 00000 n
0000000150 00000 n
0000000201 00000 n
0000000262 00000 n
0000000420 00000 n
0000000500 00000 n
0000000575 00000 n
trailer
<< /Size 8
   /Root 2 0 R
   /Info 1 0 R
>>
startxref
1008
%%EOF`;
  return Buffer.from(content, "utf-8");
}

const sampleDocs = [
  { file: "cocoa-spec.pdf", title: "Premium Cocoa Powder - Spec Sheet", subtitle: "Technical Specifications & Microbiological Profile" },
  { file: "cocoa-recipe.pdf", title: "Chocolate Cake Recipe - Technical Formula", subtitle: "Formulation and Processing Instructions" },
  { file: "vanilla-spec.pdf", title: "Vanilla Extract Spec Sheet", subtitle: "Purity Profile and Dosage Rates" },
  { file: "sample-contract.pdf", title: "Standard Supply Agreement Template", subtitle: "Commercial Supply & Payment Terms 2026" },
  { file: "product-catalogue.pdf", title: "Master Baker Product Catalogue 2026", subtitle: "Comprehensive Commercial Ingredients & Solutions" },
  { file: "new-doc-.pdf", title: "Technical Application Note 2026", subtitle: "Formulation Guide & Batch Parameters" },
  { file: "for-training-.pdf", title: "SFA Field Rep Training Guide", subtitle: "Standard Operating Procedures & Visit Protocol" },
  { file: "DocScanner 29 Jul 2026 6-53 pm (1).pdf", title: "Quality Assurance Certificate", subtitle: "ISO & HACCP Compliance Release" }
];

for (const doc of sampleDocs) {
  const filePath = path.join(docsDir, doc.file);
  const pdfBuffer = createSamplePdf(doc.title, doc.subtitle);
  fs.writeFileSync(filePath, pdfBuffer);
  console.log(`✓ Created PDF document: ${filePath}`);
}

console.log("\nAll documents generated successfully in public/docs/!");
