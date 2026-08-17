const { Pool } = require('pg');
const p = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: 'root', database: 'sfa_demo' });
(async () => {
  const r = await p.query("SELECT enum_range(NULL::stock_status)");
  console.log("stock_status enum values:", r.rows[0].enum_range);
  const s = await p.query("SELECT DISTINCT stock_status FROM products");
  console.log("Actual values used:", s.rows.map(x => x.stock_status));
  await p.end();
})();
