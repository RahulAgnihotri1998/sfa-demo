const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "root",
  database: "sfa_demo",
});

async function run() {
  console.log("Seeding Customer Negotiated Pricing and 6-Month Purchase History in PostgreSQL...");

  // Fetch all customers & products
  const { rows: customers } = await pool.query("SELECT id, name, currency FROM customers");
  const { rows: products } = await pool.query("SELECT id, name, sku, base_price, category FROM products");

  console.log(`Found ${customers.length} customers and ${products.length} products.`);

  if (customers.length === 0 || products.length === 0) {
    console.error("No customers or products found in DB.");
    process.exit(1);
  }

  // 1. Seed Customer Pricing
  console.log("\n1. Inserting Negotiated Pricing records...");
  await pool.query("DELETE FROM customer_pricing");

  const pricingInserts = [];
  for (const c of customers) {
    // Each customer gets negotiated pricing on 3 to 6 key SKUs with 5% to 15% discount off base_price
    const selectedProds = products.slice(0, 6);
    for (let i = 0; i < selectedProds.length; i++) {
      const p = selectedProds[i];
      const discountPct = 0.05 + (i * 0.02);
      const negotiatedPrice = Math.round(p.base_price * (1 - discountPct));
      
      await pool.query(
        `INSERT INTO customer_pricing (customer_id, product_id, price, currency, valid_from)
         VALUES ($1, $2, $3, $4, $5)`,
        [c.id, p.id, negotiatedPrice, c.currency || "AED", "2026-01-01"]
      );
      pricingInserts.push({ customer: c.name, product: p.name, price: negotiatedPrice });
    }
  }
  console.log(`✓ Inserted ${pricingInserts.length} negotiated pricing records.`);

  // 2. Seed 6-Month Purchase History
  console.log("\n2. Inserting 6-Month Purchase History records...");
  await pool.query("DELETE FROM purchase_history");

  const months = [
    "2026-02-01",
    "2026-03-01",
    "2026-04-01",
    "2026-05-01",
    "2026-06-01",
    "2026-07-01",
  ];

  let historyCount = 0;
  for (const c of customers) {
    // For each customer, generate monthly orders for 2 to 4 core products
    const clientProds = products.slice(0, 4);
    for (const p of clientProds) {
      for (const m of months) {
        const qty = Math.floor(15 + Math.random() * 35); // 15 to 50 units
        const amount = qty * p.base_price;
        await pool.query(
          `INSERT INTO purchase_history (customer_id, product_id, quantity, order_month, amount)
           VALUES ($1, $2, $3, $4, $5)`,
          [c.id, p.id, qty, m, amount]
        );
        historyCount++;
      }
    }
  }
  console.log(`✓ Inserted ${historyCount} purchase history records across 6 months.`);

  // 3. Ensure In-Store Audits and Competitor Intel have samples for visits
  console.log("\n3. Verifying In-Store Shelf Audits & Competitor Intel...");
  const { rows: visits } = await pool.query("SELECT id, customer_id FROM visits LIMIT 10");

  for (let i = 0; i < visits.length; i++) {
    const v = visits[i];
    const p1 = products[0];
    const p2 = products[1] || products[0];

    // Seed audit
    await pool.query(
      `INSERT INTO visit_product_audits (visit_id, product_id, on_shelf_qty, backstore_qty, is_out_of_stock, shelf_price_observed, facing_count, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`,
      [v.id, p1.id, 24, 45, false, p1.base_price, 4, "Shelf facings aligned to Master Baker planogram."]
    );

    await pool.query(
      `INSERT INTO visit_product_audits (visit_id, product_id, on_shelf_qty, backstore_qty, is_out_of_stock, shelf_price_observed, facing_count, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`,
      [v.id, p2.id, 12, 18, false, p2.base_price, 2, "Near expiry batch verified and rotated."]
    );

    // Seed competitor intel
    await pool.query(
      `INSERT INTO competitor_intelligence (customer_id, visit_id, rep_id, competitor_name, competitor_product_name, product_category, observed_price, shelf_share_percentage, promotion_details, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT DO NOTHING`,
      [
        v.customer_id,
        v.id,
        "22222222-2222-2222-2222-222222222222",
        "Puratos / Dawn Foods",
        "Gourmet Pastry & Fruit Filling 10kg",
        "Fruit Jams & Pastes",
        210,
        35,
        "Bundle 5+1 free promo active",
        "Competitor offering temporary volume rebate to switch client from Fabbri lines."
      ]
    );
  }
  console.log("✓ In-store product audits and competitor intelligence seeded.");

  console.log("\nAll pricing, purchase history, and audit data successfully seeded in PostgreSQL!");
  await pool.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
