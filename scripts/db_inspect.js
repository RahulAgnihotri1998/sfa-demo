// Runs from the sfa-demo project root so require('pg') resolves from node_modules
const { Pool } = require('pg');
const p = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: 'root', database: 'sfa_demo' });

(async () => {
  try {
    const tables = await p.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
    console.log("=== TABLES ===");
    tables.rows.forEach(x => console.log(x.table_name));

    const custCols = await p.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='customers' ORDER BY ordinal_position");
    console.log("\n=== CUSTOMERS COLUMNS ===");
    custCols.rows.forEach(x => console.log(x.column_name + " (" + x.data_type + ")"));

    const custs = await p.query("SELECT id, name, territory, contact_name FROM customers LIMIT 20");
    console.log("\n=== SAMPLE CUSTOMERS (20) ===");
    custs.rows.forEach(x => console.log(JSON.stringify(x)));

    const users = await p.query("SELECT id, full_name, email, role FROM users LIMIT 10");
    console.log("\n=== SAMPLE USERS ===");
    users.rows.forEach(x => console.log(JSON.stringify(x)));

    const prodCols = await p.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='products' ORDER BY ordinal_position");
    console.log("\n=== PRODUCTS COLUMNS ===");
    prodCols.rows.forEach(x => console.log(x.column_name + " (" + x.data_type + ")"));

    const prods = await p.query("SELECT id, sku, name, category FROM products LIMIT 15");
    console.log("\n=== SAMPLE PRODUCTS (15) ===");
    prods.rows.forEach(x => console.log(JSON.stringify(x)));

    const orderCount = await p.query("SELECT COUNT(*) as cnt FROM orders");
    console.log("\n=== ORDER COUNT ===", orderCount.rows[0].cnt);

    const phCount = await p.query("SELECT COUNT(*) as cnt FROM purchase_history");
    console.log("=== PURCHASE_HISTORY COUNT ===", phCount.rows[0].cnt);

    // Check if there's a budget table
    const budgetCheck = await p.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '%budget%'");
    console.log("\n=== BUDGET TABLES ===");
    budgetCheck.rows.forEach(x => console.log(x.table_name));

  } catch (e) {
    console.error("ERROR:", e.message);
  }
  await p.end();
})();
