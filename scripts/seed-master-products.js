const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "root",
  database: "sfa_demo",
});

const MASTER_PRODUCTS = [
  {
    id: "a0000001-0000-0000-0000-000000000001",
    sku: "FB-950-01",
    name: "Amarena Fabbri Gourmet Sauce 950g",
    category: "Gourmet Sauces & Flavours",
    base_price: 85,
    currency: "AED",
    stock_status: "near_expiry",
    is_promotion: false,
    expiry_date: "2026-08-18",
    description: "Brand: Fabbri | Weight: 950 gram | UOM: BOTTLE | Origin: Italy. Premium gourmet sauce."
  },
  {
    id: "a0000001-0000-0000-0000-000000000002",
    sku: "FB-420-02",
    name: "Amarena Fabbri Nut Brittle Snackolosi 4.2kg",
    category: "Gourmet Sauces & Flavours",
    base_price: 240,
    currency: "AED",
    stock_status: "active",
    is_promotion: false,
    expiry_date: null,
    description: "Brand: Fabbri | Weight: 4.2 KG | UOM: Pail | Origin: Italy. Nut brittle snackolosi."
  },
  {
    id: "a0000001-0000-0000-0000-000000000003",
    sku: "DW-130-01",
    name: "Confibel Apricot Jam 13kg Pail",
    category: "Fruit Jams & Pastes",
    base_price: 195,
    currency: "AED",
    stock_status: "near_expiry",
    is_promotion: false,
    expiry_date: "2026-08-25",
    description: "Brand: Dawn | Weight: 13 KG | UOM: PAL | Origin: Belgium. Confibel Apricot Jam."
  },
  {
    id: "a0000001-0000-0000-0000-000000000004",
    sku: "CSM-250-01",
    name: "BOS Special Bakery Mix 25kg",
    category: "Bakery Mixes & Grains",
    base_price: 165,
    currency: "AED",
    stock_status: "out_of_stock",
    is_promotion: false,
    expiry_date: null,
    description: "Brand: CSM | Weight: 25 kg | UOM: BAG | Origin: Germany. BOS Special Bakery Mix."
  },
  {
    id: "a0000001-0000-0000-0000-000000000005",
    sku: "FB-150-03",
    name: "Delipaste – Salted Butter Caramel 1.5kg",
    category: "Gourmet Sauces & Flavours",
    base_price: 175,
    currency: "AED",
    stock_status: "promo",
    is_promotion: true,
    expiry_date: null,
    description: "Brand: Fabbri | Weight: 1.5 KG | UOM: TIN | Origin: Italy. Salted butter caramel."
  },
  {
    id: "a0000001-0000-0000-0000-000000000006",
    sku: "FB-250-04",
    name: "Top Croccante – Decorations 2.5kg",
    category: "Gourmet Sauces & Flavours",
    base_price: 130,
    currency: "AED",
    stock_status: "active",
    is_promotion: false,
    expiry_date: null,
    description: "Brand: Fabbri | Weight: 2.5 KG | UOM: Pkt | Origin: Italy. Top Croccante decorations."
  },
  {
    id: "a0000001-0000-0000-0000-000000000007",
    sku: "FB-400-05",
    name: "Nutty Wow Dark Chocolate Marbling 4kg",
    category: "Gourmet Sauces & Flavours",
    base_price: 260,
    currency: "AED",
    stock_status: "active",
    is_promotion: false,
    expiry_date: null,
    description: "Brand: Fabbri | Weight: 4 KG | UOM: Pail | Origin: Italy. Dark chocolate marbling."
  },
  {
    id: "a0000001-0000-0000-0000-000000000008",
    sku: "DW-600-02",
    name: "Chocolate Frosting 6kg Pail",
    category: "Bakery Mixes & Frostings",
    base_price: 155,
    currency: "AED",
    stock_status: "active",
    is_promotion: false,
    expiry_date: null,
    description: "Brand: Dawn | Weight: 6 KG | UOM: PAIL | Origin: Belgium. Chocolate frosting."
  },
  {
    id: "a0000001-0000-0000-0000-000000000009",
    sku: "DW-100-03",
    name: "Vegan Muffin Mix – Chocolate 10kg",
    category: "Bakery Mixes & Frostings",
    base_price: 140,
    currency: "AED",
    stock_status: "active",
    is_promotion: false,
    expiry_date: null,
    description: "Brand: Dawn | Weight: 10 KG | UOM: BAG | Origin: Europe. Vegan chocolate muffin mix."
  },
  {
    id: "a0000001-0000-0000-0000-000000000010",
    sku: "DW-108-04",
    name: "Spread N Gloss Chocolate Icing 10.89kg",
    category: "Bakery Mixes & Frostings",
    base_price: 210,
    currency: "AED",
    stock_status: "promo",
    is_promotion: true,
    expiry_date: null,
    description: "Brand: Dawn | Weight: 10.89 KG | UOM: PAL | Origin: USA. Spread N Gloss Chocolate icing."
  },
  {
    id: "a0000001-0000-0000-0000-000000000011",
    sku: "SCH-630-01",
    name: "Spelt Flour Type 630 25kg",
    category: "Specialty Flour & Grains",
    base_price: 145,
    currency: "AED",
    stock_status: "active",
    is_promotion: false,
    expiry_date: null,
    description: "Brand: Schapfen Muhle | Weight: 25 kg | UOM: Bag | Origin: Germany. Spelt Flour 630."
  },
  {
    id: "a0000001-0000-0000-0000-000000000012",
    sku: "SCH-405-02",
    name: "Wheat Flour – Type 405 25kg",
    category: "Specialty Flour & Grains",
    base_price: 120,
    currency: "AED",
    stock_status: "active",
    is_promotion: false,
    expiry_date: null,
    description: "Brand: Schapfen Muhle | Weight: 25 kg | UOM: Bag | Origin: Germany. Wheat flour type 405."
  },
  {
    id: "a0000001-0000-0000-0000-000000000013",
    sku: "SCH-D740-03",
    name: "Organic Spelt Sour Dough D740 25kg",
    category: "Specialty Flour & Grains",
    base_price: 185,
    currency: "AED",
    stock_status: "active",
    is_promotion: false,
    expiry_date: null,
    description: "Brand: Schapfen Muhle | Weight: 25 kg | UOM: Bag | Origin: Germany. Organic spelt sourdough."
  },
  {
    id: "a0000001-0000-0000-0000-000000000014",
    sku: "LES-100-01",
    name: "AROME LEVAIN® Liquid Formula 10kg",
    category: "Sourdough & Yeast",
    base_price: 215,
    currency: "AED",
    stock_status: "active",
    is_promotion: false,
    expiry_date: null,
    description: "Brand: Le Saffre | Weight: 10 kg | UOM: BOX | Origin: France. Liquid levain formula."
  },
  {
    id: "a0000001-0000-0000-0000-000000000015",
    sku: "LES-500-02",
    name: "Livendo 2in1 Rustic Sourdough 5kg",
    category: "Sourdough & Yeast",
    base_price: 135,
    currency: "AED",
    stock_status: "active",
    is_promotion: false,
    expiry_date: null,
    description: "Brand: Lesaffre | Weight: 5 kg | UOM: BAG | Origin: Turkey. 2-in-1 rustic sourdough improver."
  },
  {
    id: "a0000001-0000-0000-0000-000000000016",
    sku: "LES-100-03",
    name: "Magimix™ Light Green improver 10kg",
    category: "Sourdough & Yeast",
    base_price: 175,
    currency: "AED",
    stock_status: "active",
    is_promotion: false,
    expiry_date: null,
    description: "Brand: Lesaffre | Weight: 10 kg | UOM: BAG | Origin: France. Magimix bread improver."
  },
  {
    id: "a0000001-0000-0000-0000-000000000017",
    sku: "DOB-250-01",
    name: "Neropan Bread Darkener 25kg",
    category: "Sourdough & Yeast",
    base_price: 155,
    currency: "AED",
    stock_status: "active",
    is_promotion: false,
    expiry_date: null,
    description: "Brand: Dobele | Weight: 25 kg | UOM: Bag | Origin: Latvia. Neropan bread darkener."
  },
  {
    id: "a0000001-0000-0000-0000-000000000018",
    sku: "CSM-250-02",
    name: "VX-2-VD Bread Improver 25kg",
    category: "Sourdough & Yeast",
    base_price: 190,
    currency: "AED",
    stock_status: "out_of_stock",
    is_promotion: false,
    expiry_date: null,
    description: "Brand: CSM Ingredients | Weight: 25 kg | UOM: BAG | Origin: Germany. Bread improver."
  },
  {
    id: "a0000001-0000-0000-0000-000000000019",
    sku: "15000068",
    name: "Bolivia Lait de terroir 45% Couverture 6kg",
    category: "Couverture & Chocolate",
    base_price: 320,
    currency: "AED",
    stock_status: "active",
    is_promotion: false,
    expiry_date: null,
    description: "Brand: Felchlin | Weight: 6KG | UOM: CTN | Origin: Switzerland. Couverture chocolate 45%."
  },
  {
    id: "a0000001-0000-0000-0000-000000000020",
    sku: "DW-226-05",
    name: "Brownie Mix 22.68kg Bag",
    category: "Bakery Mixes & Frostings",
    base_price: 180,
    currency: "AED",
    stock_status: "promo",
    is_promotion: true,
    expiry_date: null,
    description: "Brand: Dawn | Weight: 22.68 KG | UOM: BAG | Origin: USA. Premium brownie mix."
  },
  {
    id: "a0000001-0000-0000-0000-000000000021",
    sku: "FB-950-06",
    name: "Caramel Gourmet Sauce 950g",
    category: "Gourmet Sauces & Flavours",
    base_price: 88,
    currency: "AED",
    stock_status: "active",
    is_promotion: false,
    expiry_date: null,
    description: "Brand: Fabbri | Weight: 950 gram | UOM: BOTTLE | Origin: Italy. Caramel gourmet sauce."
  }
];

async function main() {
  console.log("Seeding Master Products into local database...");
  try {
    await pool.query(`
      TRUNCATE discount_requests, order_items, orders, customer_pricing,
               product_recommendations, product_alternatives, purchase_history,
               documents, promotions, products CASCADE;
    `);

    for (const p of MASTER_PRODUCTS) {
      await pool.query(
        `INSERT INTO products (id, sku, name, category, base_price, currency, stock_status, is_promotion, expiry_date, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [p.id, p.sku, p.name, p.category, p.base_price, p.currency, p.stock_status, p.is_promotion, p.expiry_date, p.description]
      );
      console.log(`  ✓ Inserted ${p.name}`);
    }

    // Set alternatives
    await pool.query(`INSERT INTO product_alternatives (product_id, alternative_product_id) VALUES ($1, $2)`, [
      "a0000001-0000-0000-0000-000000000004",
      "a0000001-0000-0000-0000-000000000012"
    ]);
    await pool.query(`INSERT INTO product_alternatives (product_id, alternative_product_id) VALUES ($1, $2)`, [
      "a0000001-0000-0000-0000-000000000018",
      "a0000001-0000-0000-0000-000000000016"
    ]);

    // Set recommendations
    await pool.query(`INSERT INTO product_recommendations (product_id, recommended_product_id, reason) VALUES ($1, $2, $3)`, [
      "a0000001-0000-0000-0000-000000000001",
      "a0000001-0000-0000-0000-000000000005",
      "Frequently bought together with Fabbri Sauces"
    ]);

    // Set promotions
    await pool.query(`INSERT INTO promotions (title, description, product_id, priority) VALUES ($1, $2, $3, $4)`, [
      "Fabbri Delipaste Summer Push",
      "Head office focus product campaign. Offer 15% discount on 10+ units.",
      "a0000001-0000-0000-0000-000000000005",
      "focus_product"
    ]);

    console.log("\nMaster Products seed complete!");
  } catch (err) {
    console.error("Error seeding master products:", err.message);
  } finally {
    await pool.end();
  }
}

main();
