const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "root",
  database: "sfa_demo",
});

async function run() {
  const cols = await pool.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'visits'"
  );
  console.log("Visits columns in PostgreSQL:");
  console.log(cols.rows.map(c => c.column_name).join(", "));

  const hasCol = cols.rows.some(c => c.column_name === "scheduled_time_start");
  console.log("Has scheduled_time_start?", hasCol);

  if (!hasCol) {
    console.log("Adding column scheduled_time_start to visits table...");
    await pool.query("ALTER TABLE visits ADD COLUMN IF NOT EXISTS scheduled_time_start text");
    console.log("Column scheduled_time_start added successfully!");
  }

  // Also check duration_minutes
  const hasDuration = cols.rows.some(c => c.column_name === "duration_minutes");
  if (!hasDuration) {
    await pool.query("ALTER TABLE visits ADD COLUMN IF NOT EXISTS duration_minutes integer default 60");
  }

  await pool.end();
}

run().catch(console.error);
