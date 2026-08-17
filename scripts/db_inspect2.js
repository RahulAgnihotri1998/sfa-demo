const { Pool } = require('pg');
const p = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: 'root', database: 'sfa_demo' });

(async () => {
  try {
    // Customer count
    const custCount = await p.query("SELECT COUNT(*) as cnt FROM customers");
    console.log("=== TOTAL CUSTOMERS ===", custCount.rows[0].cnt);

    // All customers with owner
    const allCusts = await p.query(`
      SELECT c.id, c.name, c.territory, c.account_owner_id, u.full_name as owner_name
      FROM customers c
      LEFT JOIN users u ON c.account_owner_id = u.id
      ORDER BY c.name
    `);
    console.log("\n=== ALL CUSTOMERS WITH OWNER ===");
    allCusts.rows.forEach(x => console.log(JSON.stringify(x)));

    // Product count
    const prodCount = await p.query("SELECT COUNT(*) as cnt FROM products");
    console.log("\n=== TOTAL PRODUCTS ===", prodCount.rows[0].cnt);

    // All products
    const allProds = await p.query("SELECT id, sku, name, category, base_price FROM products ORDER BY name");
    console.log("\n=== ALL PRODUCTS ===");
    allProds.rows.forEach(x => console.log(JSON.stringify(x)));

    // Purchase history structure
    const phCols = await p.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='purchase_history' ORDER BY ordinal_position");
    console.log("\n=== PURCHASE_HISTORY COLUMNS ===");
    phCols.rows.forEach(x => console.log(x.column_name + " (" + x.data_type + ")"));

    // Sample purchase history
    const ph = await p.query("SELECT * FROM purchase_history LIMIT 5");
    console.log("\n=== SAMPLE PURCHASE_HISTORY ===");
    ph.rows.forEach(x => console.log(JSON.stringify(x)));

    // Order items structure
    const oiCols = await p.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='order_items' ORDER BY ordinal_position");
    console.log("\n=== ORDER_ITEMS COLUMNS ===");
    oiCols.rows.forEach(x => console.log(x.column_name + " (" + x.data_type + ")"));

    // Aggregate sales by customer from purchase_history
    const salesByCust = await p.query(`
      SELECT c.name, SUM(ph.total_amount) as total_sales, COUNT(*) as txn_count
      FROM purchase_history ph
      JOIN customers c ON ph.customer_id = c.id
      GROUP BY c.name
      ORDER BY total_sales DESC
      LIMIT 20
    `);
    console.log("\n=== TOP 20 SALES BY CUSTOMER ===");
    salesByCust.rows.forEach(x => console.log(JSON.stringify(x)));

    // Aggregate sales by product from purchase_history
    const salesByProd = await p.query(`
      SELECT p.name, p.sku, p.category, SUM(ph.total_amount) as total_sales, SUM(ph.quantity) as total_qty
      FROM purchase_history ph
      JOIN products p ON ph.product_id = p.id
      GROUP BY p.name, p.sku, p.category
      ORDER BY total_sales DESC
      LIMIT 20
    `);
    console.log("\n=== TOP 20 SALES BY PRODUCT ===");
    salesByProd.rows.forEach(x => console.log(JSON.stringify(x)));

  } catch (e) {
    console.error("ERROR:", e.message);
  }
  await p.end();
})();
