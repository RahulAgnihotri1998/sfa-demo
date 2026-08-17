const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "root",
  database: "sfa_demo",
});

async function run() {
  console.log("Updating document URLs in PostgreSQL to real local paths...");

  // Update existing entries
  await pool.query(`
    UPDATE documents 
    SET file_url = '/docs/SFA_Extended_Scope_Checklist.xlsx'
    WHERE title ILIKE '%Extended Scope%' OR file_url ILIKE '%SFA_Extended_Scope_Checklist%';
  `);

  await pool.query(`
    UPDATE documents 
    SET file_url = '/docs/new-doc-.pdf'
    WHERE file_url ILIKE '%new-doc-%';
  `);

  await pool.query(`
    UPDATE documents 
    SET file_url = '/docs/for-training-.pdf'
    WHERE file_url ILIKE '%for-training-%';
  `);

  await pool.query(`
    UPDATE documents 
    SET file_url = '/docs/DocScanner 29 Jul 2026 6-53 pm (1).pdf'
    WHERE file_url ILIKE '%DocScanner%';
  `);

  // Ensure default base documents exist
  const baseDocs = [
    {
      id: "d0000001-0000-0000-0000-000000000001",
      title: "Premium Cocoa Powder - Spec Sheet",
      type: "spec",
      file_url: "/docs/cocoa-spec.pdf"
    },
    {
      id: "d0000001-0000-0000-0000-000000000002",
      title: "Chocolate Cake Recipe - Using Premium Cocoa",
      type: "recipe",
      file_url: "/docs/cocoa-recipe.pdf"
    },
    {
      id: "d0000001-0000-0000-0000-000000000003",
      title: "Standard Supply Agreement - Template",
      type: "contract",
      file_url: "/docs/sample-contract.pdf"
    },
    {
      id: "d0000001-0000-0000-0000-000000000004",
      title: "Master Baker Product Catalogue 2026",
      type: "catalogue",
      file_url: "/docs/product-catalogue.pdf"
    },
    {
      id: "d0000001-0000-0000-0000-000000000005",
      title: "SFA Extended Scope Technical Checklist (Excel)",
      type: "spec",
      file_url: "/docs/SFA_Extended_Scope_Checklist.xlsx"
    }
  ];

  for (const doc of baseDocs) {
    await pool.query(`
      INSERT INTO documents (id, title, type, file_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, type = EXCLUDED.type, file_url = EXCLUDED.file_url;
    `, [doc.id, doc.title, doc.type, doc.file_url]);
  }

  const res = await pool.query("SELECT id, title, type, file_url FROM documents ORDER BY created_at DESC");
  console.log("Current documents in database:");
  console.table(res.rows);

  await pool.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
