const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "root",
  database: "sfa_demo",
});

async function run() {
  const res = await pool.query("SELECT status, count(id) as count FROM visits GROUP BY status");
  console.table(res.rows);

  const planned = await pool.query(`
    SELECT v.id, v.customer_id, c.name as customer_name, v.status, v.planned_date, v.scheduled_time_start, v.created_at
    FROM visits v
    LEFT JOIN customers c ON v.customer_id = c.id
    WHERE v.status = 'planned'
    ORDER BY v.created_at DESC
  `);
  console.log("Planned visits in DB:", planned.rows.length);
  console.table(planned.rows.slice(0, 10));

  await pool.end();
}

run().catch(console.error);
