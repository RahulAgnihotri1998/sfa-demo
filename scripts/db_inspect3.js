const { Pool } = require('pg');
const p = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: 'root', database: 'sfa_demo' });

(async () => {
  try {
    // Total sales from purchase_history
    const totalSales = await p.query("SELECT SUM(amount) as total FROM purchase_history");
    console.log("=== TOTAL SALES (purchase_history) ===", totalSales.rows[0].total);

    // Sales by customer
    const salesByCust = await p.query(`
      SELECT c.id, c.name, c.territory, c.open_items_amount,
             SUM(ph.amount) as actual_sales, 
             SUM(ph.quantity) as total_qty,
             COUNT(*) as txn_count
      FROM purchase_history ph
      JOIN customers c ON ph.customer_id = c.id
      GROUP BY c.id, c.name, c.territory, c.open_items_amount
      ORDER BY actual_sales DESC
    `);
    console.log("\n=== SALES BY CUSTOMER ===");
    salesByCust.rows.forEach(x => console.log(JSON.stringify(x)));

    // Sales by product
    const salesByProd = await p.query(`
      SELECT p.id, p.sku, p.name, p.category, p.base_price,
             SUM(ph.amount) as actual_sales, 
             SUM(ph.quantity) as total_qty,
             COUNT(*) as txn_count
      FROM purchase_history ph
      JOIN products p ON ph.product_id = p.id
      GROUP BY p.id, p.sku, p.name, p.category, p.base_price
      ORDER BY actual_sales DESC
    `);
    console.log("\n=== SALES BY PRODUCT ===");
    salesByProd.rows.forEach(x => console.log(JSON.stringify(x)));

    // Sales by customer x product (top 30)
    const salesCustProd = await p.query(`
      SELECT c.name as customer_name, p.sku, p.name as product_name, p.category,
             SUM(ph.amount) as actual_sales, SUM(ph.quantity) as total_qty
      FROM purchase_history ph
      JOIN customers c ON ph.customer_id = c.id
      JOIN products p ON ph.product_id = p.id
      GROUP BY c.name, p.sku, p.name, p.category
      ORDER BY actual_sales DESC
      LIMIT 30
    `);
    console.log("\n=== TOP 30 SALES BY CUSTOMER x PRODUCT ===");
    salesCustProd.rows.forEach(x => console.log(JSON.stringify(x)));

    // Monthly trend
    const monthlyTrend = await p.query(`
      SELECT DATE_TRUNC('month', order_month) as month, SUM(amount) as total_sales
      FROM purchase_history
      GROUP BY DATE_TRUNC('month', order_month)
      ORDER BY month
    `);
    console.log("\n=== MONTHLY SALES TREND ===");
    monthlyTrend.rows.forEach(x => console.log(JSON.stringify(x)));

    // Check product categories for tag mapping
    const categories = await p.query("SELECT DISTINCT category FROM products ORDER BY category");
    console.log("\n=== PRODUCT CATEGORIES ===");
    categories.rows.forEach(x => console.log(x.category));

  } catch (e) {
    console.error("ERROR:", e.message);
  }
  await p.end();
})();
