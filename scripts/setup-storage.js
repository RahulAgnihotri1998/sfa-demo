/**
 * Run once to create the Supabase storage bucket and seed document records.
 * Usage: node scripts/setup-storage.js
 */

const { createClient } = require("@supabase/supabase-js");
const https = require("https");
const path = require("path");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://kbiovidkjnjfwemwithn.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SERVICE_KEY) {
  console.error("Please provide SUPABASE_SERVICE_ROLE_KEY environment variable.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Minimal valid PDF bytes (single-page "Hello" PDF) — no external tools needed
function makePdf(title) {
  const content = `${title}\n\nThis is a demo document for the SFA Platform.`;
  const stream = `BT /F1 14 Tf 50 750 Td (${title}) Tj 0 -30 Td /F1 11 Tf (This is a demo document for the SFA Platform.) Tj ET`;
  const pdf = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj
4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
5 0 obj<</Length ${stream.length}>>
stream
${stream}
endstream
endobj
xref
0 6
0000000000 65535 f 
trailer<</Size 6/Root 1 0 R>>
startxref
0
%%EOF`;
  return Buffer.from(pdf);
}

const DOCUMENTS = [
  { filename: "cocoa-recipe.pdf",    title: "Cocoa Powder Recipe / Application Note",   type: "recipe" },
  { filename: "cocoa-spec.pdf",      title: "Cocoa Powder Product Specification",         type: "spec" },
  { filename: "vanilla-spec.pdf",    title: "Vanilla Extract Product Specification",      type: "spec" },
  { filename: "sample-contract.pdf", title: "Standard Supply Agreement Template",         type: "contract" },
  { filename: "product-catalogue.pdf", title: "Product Catalogue 2024-2025",             type: "catalogue" },
];

async function run() {
  console.log("1. Creating 'documents' storage bucket...");
  const { error: bucketError } = await supabase.storage.createBucket("documents", {
    public: true,
    allowedMimeTypes: ["application/pdf"],
    fileSizeLimit: 10 * 1024 * 1024, // 10 MB
  });
  if (bucketError && !bucketError.message.includes("already exists")) {
    console.error("   Bucket error:", bucketError.message);
    process.exit(1);
  } else {
    console.log("   Bucket ready ✓");
  }

  console.log("\n2. Uploading placeholder PDFs...");
  const uploadedUrls = {};

  for (const doc of DOCUMENTS) {
    const pdfBuffer = makePdf(doc.title);
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(doc.filename, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error(`   ✗ ${doc.filename}: ${uploadError.message}`);
    } else {
      const { data: { publicUrl } } = supabase.storage
        .from("documents")
        .getPublicUrl(doc.filename);
      uploadedUrls[doc.filename] = publicUrl;
      console.log(`   ✓ ${doc.filename} → ${publicUrl}`);
    }
  }

  console.log("\n3. Upserting document records in database...");
  for (const doc of DOCUMENTS) {
    const url = uploadedUrls[doc.filename];
    if (!url) continue;

    const { error: dbError } = await supabase
      .from("documents")
      .upsert(
        { title: doc.title, type: doc.type, file_url: url },
        { onConflict: "title" }
      );

    if (dbError) {
      console.error(`   ✗ DB insert for "${doc.title}": ${dbError.message}`);
    } else {
      console.log(`   ✓ "${doc.title}" saved to documents table`);
    }
  }

  console.log("\nDone! Documents bucket is live and seeded.");
}

run().catch(console.error);
