const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, user: 'postgres', password: 'root', database: 'sfa_demo' });

async function check() {
  const cols = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'visits' ORDER BY ordinal_position"
  );
  console.log('Visit columns:', cols.rows.map(r => r.column_name).join(', '));

  const visits = await pool.query(
    'SELECT id, customer_id, sales_rep_id, status, within_geofence, check_in_distance_meters, planned_date, outcome, check_in_time, check_out_time, checklist_items FROM visits ORDER BY created_at DESC LIMIT 10'
  );
  console.log('\nTotal visits returned:', visits.rowCount);
  visits.rows.forEach((v, i) => {
    console.log('\n--- Visit', i + 1, '---');
    console.log('  id:', v.id);
    console.log('  status:', v.status);
    console.log('  within_geofence:', v.within_geofence);
    console.log('  check_in_distance_meters:', v.check_in_distance_meters);
    console.log('  outcome:', v.outcome ? v.outcome.slice(0, 80) + '...' : null);
    console.log('  checklist_items type:', Array.isArray(v.checklist_items) ? 'array' : typeof v.checklist_items, '- length:', v.checklist_items ? v.checklist_items.length : 0);
  });

  // Check other tables
  const audits = await pool.query('SELECT count(*) FROM visit_product_audits');
  const intel  = await pool.query('SELECT count(*) FROM competitor_intelligence');
  const orders = await pool.query('SELECT count(*) FROM orders');
  console.log('\nTotal audits:', audits.rows[0].count);
  console.log('Total competitor_intelligence:', intel.rows[0].count);
  console.log('Total orders:', orders.rows[0].count);

  await pool.end();
}

check().catch(console.error);
