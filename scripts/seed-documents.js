/**
 * Seed document records now that the storage bucket is live.
 * Run: node scripts/seed-documents.js
 */

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://kbiovidkjnjfwemwithn.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SERVICE_KEY) {
  console.error("Please provide SUPABASE_SERVICE_ROLE_KEY environment variable.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const BASE = `${SUPABASE_URL}/storage/v1/object/public/documents`;

const DOCUMENTS = [
  { title: "Cocoa Powder Recipe / Application Note",   type: "recipe",    file_url: `${BASE}/cocoa-recipe.pdf` },
  { title: "Cocoa Powder Product Specification",        type: "spec",      file_url: `${BASE}/cocoa-spec.pdf` },
  { title: "Vanilla Extract Product Specification",     type: "spec",      file_url: `${BASE}/vanilla-spec.pdf` },
  { title: "Standard Supply Agreement Template",        type: "contract",  file_url: `${BASE}/sample-contract.pdf` },
  { title: "Product Catalogue 2024-2025",              type: "catalogue", file_url: `${BASE}/product-catalogue.pdf` },
];

async function run() {
  // First delete any existing documents so we don't duplicate
  const { error: delError } = await supabase.from("documents").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (delError) console.warn("  Delete warning:", delError.message);

  console.log("Inserting document records...");
  for (const doc of DOCUMENTS) {
    const { error } = await supabase.from("documents").insert(doc);
    if (error) {
      console.error(`  ✗ "${doc.title}": ${error.message}`);
    } else {
      console.log(`  ✓ "${doc.title}"`);
    }
  }
  console.log("\nDocument records seeded.");
}

run().catch(console.error);
