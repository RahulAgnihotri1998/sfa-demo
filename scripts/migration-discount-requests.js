const { Client } = require('pg');

async function migrateDb(connectionString, label) {
  if (!connectionString) {
    console.log(`Skipping ${label}: No connection string provided.`);
    return;
  }
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log(`Connected to ${label} database. Running migrations...`);

    // Alter discount_requests table
    await client.query(`
      ALTER TABLE discount_requests
      ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES products(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id) ON DELETE CASCADE;
    `);
    
    console.log(`Migration run successfully for ${label}: product_id and customer_id columns added to discount_requests.`);
  } catch (err) {
    console.warn(`Warning: Migration failed for ${label}:`, err.message);
  } finally {
    await client.end();
  }
}

async function main() {
  // Remote Database
  await migrateDb(
    process.env.DATABASE_URL,
    "REMOTE"
  );
  
  // Local Database
  await migrateDb(
    process.env.LOCAL_DATABASE_URL || "postgresql://postgres:root@localhost:5432/sfa_demo",
    "LOCAL"
  );
}

main().catch((err) => {
  console.error("Migration runner failed:", err);
  process.exit(1);
});
