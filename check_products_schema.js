const { Pool } = require('pg');

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "root",
  database: "sfa_demo",
});

async function check() {
  try {
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products';");
    console.log('Columns in products table:');
    res.rows.forEach(r => console.log(` - ${r.column_name} (${r.data_type})`));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}

check();
