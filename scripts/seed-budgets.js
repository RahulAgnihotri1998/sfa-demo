/**
 * Seed script: Budget vs Actual live data
 * 
 * 1. Creates additional sales reps
 * 2. Adds egg products to the products table
 * 3. Redistributes customers across sales reps
 * 4. Creates customer_product_budgets table
 * 5. Seeds budget targets from purchase_history (actual × 1.10–1.20)
 * 6. Generates purchase_history rows for egg products
 */

const { Pool } = require('pg');
const { randomUUID } = require('crypto');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'root',
  database: 'sfa_demo',
});

// ── New Sales Reps ──
const NEW_REPS = [
  { id: '33333333-3333-3333-3333-333333333333', full_name: 'Sarah Jenkins', email: 'sarah.rep@demo.com', role: 'sales_rep' },
  { id: '44444444-4444-4444-4444-444444444444', full_name: 'Tariq Mansoor', email: 'tariq.rep@demo.com', role: 'sales_rep' },
  { id: '55555555-5555-5555-5555-555555555555', full_name: 'Vikram Patel', email: 'vikram.rep@demo.com', role: 'sales_rep' },
  { id: '66666666-6666-6666-6666-666666666666', full_name: 'Fatima Al Mansoori', email: 'fatima.rep@demo.com', role: 'sales_rep' },
];

// ── Egg Products ──
const EGG_PRODUCTS = [
  { id: 'a0000001-0000-0000-0000-000000000101', sku: 'OV-100-01', name: 'Pasteurized Liquid Whole Egg 10kg', category: 'Liquid & Powder Egg', base_price: 135 },
  { id: 'a0000001-0000-0000-0000-000000000102', sku: 'OV-100-02', name: 'Pasteurized Liquid Egg White (Albumen) 10kg', category: 'Liquid & Powder Egg', base_price: 155 },
  { id: 'a0000001-0000-0000-0000-000000000103', sku: 'OV-100-03', name: 'Pasteurized Liquid Egg Yolk 10kg', category: 'Liquid & Powder Egg', base_price: 185 },
  { id: 'a0000001-0000-0000-0000-000000000104', sku: 'OV-200-04', name: 'High-Whip Dried Egg White Powder 20kg', category: 'Liquid & Powder Egg', base_price: 420 },
];

// ── Customer → Rep assignment (redistribute existing 15 customers) ──
// Rahul Menon keeps 5, others get ~3 each
const REP_ASSIGNMENTS = {
  '22222222-2222-2222-2222-222222222222': [ // Rahul Menon
    'c1111111-0000-0000-0000-000000000001', // Al Noor Trading
    'c1111111-0000-0000-0000-000000000011', // Al Maya Marina Walk
    'c1111111-0000-0000-0000-000000000012', // Al Maya Deira
    'c1111111-0000-0000-0000-000000000013', // Al Maya Barsha
    '6de65e4f-88d5-40e6-b593-2d742469b263', // sfa
  ],
  '33333333-3333-3333-3333-333333333333': [ // Sarah Jenkins
    'c1111111-0000-0000-0000-000000000002', // Gulf Fresh Distributors
    'c1111111-0000-0000-0000-000000000021', // Gulf Fresh Logistics
    'c1111111-0000-0000-0000-000000000022', // Gulf Fresh Gourmet
  ],
  '44444444-4444-4444-4444-444444444444': [ // Tariq Mansoor
    'c1111111-0000-0000-0000-000000000003', // Sharjah Ingredients
    'c1111111-0000-0000-0000-000000000031', // Northern Emirates
    'c1111111-0000-0000-0000-000000000032', // RAK Food
  ],
  '55555555-5555-5555-5555-555555555555': [ // Vikram Patel
    'c1111111-0000-0000-0000-000000000041', // Lulu Al Barsha
    'c1111111-0000-0000-0000-000000000042', // Lulu DIFC
    'c1111111-0000-0000-0000-000000000043', // Lulu Karama
  ],
  '66666666-6666-6666-6666-666666666666': [ // Fatima Al Mansoori
    '564ad037-dfe7-4c4f-8495-ba9371c382a3', // grand hyte
  ],
};

function randBetween(min, max) {
  return min + Math.random() * (max - min);
}

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert new sales reps (skip if exists)
    console.log('1. Inserting new sales reps...');
    for (const rep of NEW_REPS) {
      const exists = await client.query('SELECT id FROM users WHERE id = $1', [rep.id]);
      if (exists.rows.length === 0) {
        await client.query(
          'INSERT INTO users (id, full_name, email, role, created_at) VALUES ($1, $2, $3, $4, NOW())',
          [rep.id, rep.full_name, rep.email, rep.role]
        );
        console.log(`   + Created rep: ${rep.full_name}`);
      } else {
        console.log(`   = Rep exists: ${rep.full_name}`);
      }
    }

    // 2. Insert egg products (skip if exists)
    console.log('\n2. Inserting egg products...');
    for (const prod of EGG_PRODUCTS) {
      const exists = await client.query('SELECT id FROM products WHERE id = $1', [prod.id]);
      if (exists.rows.length === 0) {
        await client.query(
          `INSERT INTO products (id, sku, name, category, base_price, currency, stock_status, is_promotion, description, created_at) 
           VALUES ($1, $2, $3, $4, $5, 'AED', 'active', false, $3, NOW())`,
          [prod.id, prod.sku, prod.name, prod.category, prod.base_price]
        );
        console.log(`   + Created product: ${prod.name}`);
      } else {
        console.log(`   = Product exists: ${prod.name}`);
      }
    }

    // 3. Reassign customers to reps
    console.log('\n3. Reassigning customers to sales reps...');
    for (const [repId, customerIds] of Object.entries(REP_ASSIGNMENTS)) {
      for (const custId of customerIds) {
        await client.query(
          'UPDATE customers SET account_owner_id = $1 WHERE id = $2',
          [repId, custId]
        );
      }
      const repName = repId === '22222222-2222-2222-2222-222222222222' ? 'Rahul Menon' :
                      NEW_REPS.find(r => r.id === repId)?.full_name || 'Unknown';
      console.log(`   ✓ ${repName}: ${customerIds.length} customers`);
    }

    // 4. Generate purchase_history for egg products (6 months, Jan–Jun 2026)
    console.log('\n4. Generating purchase history for egg products...');
    const allCustomers = await client.query('SELECT id FROM customers');
    const months = [
      '2026-01-15', '2026-02-15', '2026-03-15', '2026-04-15', '2026-05-15', '2026-06-15'
    ];

    let eggPhCount = 0;
    for (const cust of allCustomers.rows) {
      for (const eggProd of EGG_PRODUCTS) {
        // Check if already seeded
        const existing = await client.query(
          'SELECT id FROM purchase_history WHERE customer_id = $1 AND product_id = $2 LIMIT 1',
          [cust.id, eggProd.id]
        );
        if (existing.rows.length > 0) continue;

        for (const month of months) {
          const qty = Math.floor(randBetween(8, 50));
          const amount = Math.round(qty * eggProd.base_price * randBetween(0.85, 1.0));
          await client.query(
            'INSERT INTO purchase_history (id, customer_id, product_id, quantity, order_month, amount) VALUES ($1, $2, $3, $4, $5, $6)',
            [randomUUID(), cust.id, eggProd.id, qty, month, amount]
          );
          eggPhCount++;
        }
      }
    }
    console.log(`   + Inserted ${eggPhCount} egg purchase_history rows`);

    // 5. Create customer_product_budgets table
    console.log('\n5. Creating customer_product_budgets table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS customer_product_budgets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES customers(id),
        product_id UUID NOT NULL REFERENCES products(id),
        budget_year INT NOT NULL DEFAULT 2026,
        budget_amount NUMERIC NOT NULL DEFAULT 0,
        budget_qty INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(customer_id, product_id, budget_year)
      )
    `);
    console.log('   ✓ Table created');

    // 6. Populate budget targets from actual purchase_history
    console.log('\n6. Populating budget targets...');
    // Clear existing
    await client.query('DELETE FROM customer_product_budgets WHERE budget_year = 2026');

    const salesAgg = await client.query(`
      SELECT customer_id, product_id, SUM(amount) as total_sales, SUM(quantity) as total_qty
      FROM purchase_history
      GROUP BY customer_id, product_id
    `);

    let budgetCount = 0;
    for (const row of salesAgg.rows) {
      const multiplier = randBetween(1.10, 1.25); // Budget is 10-25% above actual
      const budgetAmount = Math.round(parseFloat(row.total_sales) * multiplier);
      const budgetQty = Math.round(parseFloat(row.total_qty) * multiplier);
      
      await client.query(
        `INSERT INTO customer_product_budgets (customer_id, product_id, budget_year, budget_amount, budget_qty)
         VALUES ($1, $2, 2026, $3, $4)
         ON CONFLICT (customer_id, product_id, budget_year) DO UPDATE SET budget_amount = $3, budget_qty = $4`,
        [row.customer_id, row.product_id, budgetAmount, budgetQty]
      );
      budgetCount++;
    }
    console.log(`   + Inserted ${budgetCount} budget rows`);

    await client.query('COMMIT');
    console.log('\n✅ Seed complete!');

    // Verify
    const verify = await client.query('SELECT COUNT(*) as cnt FROM customer_product_budgets');
    console.log(`   Budget rows: ${verify.rows[0].cnt}`);
    const userCount = await client.query("SELECT COUNT(*) as cnt FROM users WHERE role = 'sales_rep'");
    console.log(`   Sales reps: ${userCount.rows[0].cnt}`);
    const prodCount = await client.query('SELECT COUNT(*) as cnt FROM products');
    console.log(`   Products: ${prodCount.rows[0].cnt}`);

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('SEED ERROR:', e.message);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
})();
