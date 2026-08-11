-- ============================================================
-- SFA DEMO — SEED DATA
-- Run this AFTER schema.sql. Designed so every scenario has a
-- believable story to click through during the live demo.
-- ============================================================

-- ---------- USERS ----------
insert into users (id, full_name, email, role, territory, country, currency) values
('11111111-1111-1111-1111-111111111111', 'Ahmed Al Farsi', 'ahmed.manager@demo.com', 'manager', 'Dubai', 'UAE', 'AED'),
('22222222-2222-2222-2222-222222222222', 'Rahul Menon', 'rahul.rep@demo.com', 'sales_rep', 'Dubai', 'UAE', 'AED')
ON CONFLICT (id) DO NOTHING;

update users set manager_id = '11111111-1111-1111-1111-111111111111'
  where id = '22222222-2222-2222-2222-222222222222';

-- ---------- CUSTOMERS ----------
-- Note: replace lat/lng with real coordinates near wherever you'll demo check-in from.
insert into customers (id, name, account_owner_id, territory, country, contact_name, contact_phone, contact_email, address, latitude, longitude, open_items_amount, status) values
('c1111111-0000-0000-0000-000000000001', 'Al Noor Trading LLC', '22222222-2222-2222-2222-222222222222', 'Dubai', 'UAE', 'Fatima Al Noor', '+971501234567', 'fatima@alnoor-demo.com', 'Al Quoz Industrial Area 3, Dubai', 25.1382, 55.2333, 12500, 'at_risk'),
('c1111111-0000-0000-0000-000000000002', 'Gulf Fresh Distributors', '22222222-2222-2222-2222-222222222222', 'Dubai', 'UAE', 'Omar Khalid', '+971502345678', 'omar@gulffresh-demo.com', 'Deira, Dubai', 25.2697, 55.3095, 0, 'active'),
('c1111111-0000-0000-0000-000000000003', 'Sharjah Ingredients Co.', '22222222-2222-2222-2222-222222222222', 'Sharjah', 'UAE', 'Layla Hassan', '+971503456789', 'layla@sharjahing-demo.com', 'Industrial Area 6, Sharjah', 25.3573, 55.4033, 3400, 'active')
ON CONFLICT (id) DO NOTHING;

-- ---------- PRODUCTS ----------
insert into products (id, sku, name, category, base_price, stock_status, is_promotion, expiry_date) values
('a0000001-0000-0000-0000-000000000001', 'SKU-CHOC-01', 'Premium Cocoa Powder 5kg', 'Bakery Ingredients', 180, 'active', false, null),
('a0000001-0000-0000-0000-000000000002', 'SKU-VAN-01', 'Vanilla Extract 1L', 'Bakery Ingredients', 95, 'near_expiry', false, current_date + interval '20 days'),
('a0000001-0000-0000-0000-000000000003', 'SKU-FLR-01', 'Bakers Flour 25kg', 'Bakery Ingredients', 60, 'active', false, null),
('a0000001-0000-0000-0000-000000000004', 'SKU-SUG-01', 'Fine Sugar 25kg', 'Bakery Ingredients', 45, 'out_of_stock', false, null),
('a0000001-0000-0000-0000-000000000005', 'SKU-SUG-02', 'Fine Sugar (Alt Brand) 25kg', 'Bakery Ingredients', 48, 'active', false, null),
('a0000001-0000-0000-0000-000000000006', 'SKU-BUT-01', 'Bakery Butter Blend 10kg', 'Bakery Ingredients', 130, 'promo', true, null)
ON CONFLICT (id) DO NOTHING;

-- alternative for out-of-stock sugar
insert into product_alternatives (product_id, alternative_product_id) values
('a0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000005')
ON CONFLICT DO NOTHING;

-- cross-sell: cocoa buyers also tend to buy vanilla + butter blend
insert into product_recommendations (product_id, recommended_product_id, reason) values
('a0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000002', 'Frequently bought together'),
('a0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 'Similar customers also buy')
ON CONFLICT DO NOTHING;

-- ---------- CUSTOMER-SPECIFIC PRICING ----------
-- Same product, different negotiated price per customer
insert into customer_pricing (customer_id, product_id, price) values
('c1111111-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 170),  -- Al Noor gets cocoa cheaper
('c1111111-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 182),
('c1111111-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 178),
('c1111111-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 58),
('c1111111-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 61),
('c1111111-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 125)
ON CONFLICT DO NOTHING;

-- ---------- PURCHASE HISTORY ----------
-- Al Noor Trading: clear decline story on cocoa powder (for scenario 2)
insert into purchase_history (customer_id, product_id, quantity, order_month, amount) values
('c1111111-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 40, date_trunc('month', current_date - interval '3 months'), 6800),
('c1111111-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 38, date_trunc('month', current_date - interval '2 months'), 6460),
('c1111111-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 15, date_trunc('month', current_date - interval '1 month'), 2550),
-- Gulf Fresh: steady healthy buyer (contrast case, no alert)
('c1111111-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 25, date_trunc('month', current_date - interval '3 months'), 1525),
('c1111111-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 27, date_trunc('month', current_date - interval '2 months'), 1647),
('c1111111-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 26, date_trunc('month', current_date - interval '1 month'), 1586)
ON CONFLICT DO NOTHING;

-- ---------- SAMPLE DOCUMENTS ----------
-- Upload actual PDFs to Supabase Storage first, then point file_url here.
insert into documents (id, title, type, product_id, file_url) values
('d0000001-0000-0000-0000-000000000001', 'Premium Cocoa Powder - Spec Sheet', 'spec', 'a0000001-0000-0000-0000-000000000001', 'https://kbiovidkjnjfwemwithn.supabase.co/storage/v1/object/public/documents/cocoa-spec.pdf'),
('d0000001-0000-0000-0000-000000000002', 'Chocolate Cake Recipe - Using Premium Cocoa', 'recipe', 'a0000001-0000-0000-0000-000000000001', 'https://kbiovidkjnjfwemwithn.supabase.co/storage/v1/object/public/documents/cocoa-recipe.pdf'),
('d0000001-0000-0000-0000-000000000003', 'Standard Supply Agreement - Template', 'contract', null, 'https://kbiovidkjnjfwemwithn.supabase.co/storage/v1/object/public/documents/supply-contract.pdf')
ON CONFLICT (id) DO NOTHING;

-- ---------- PROMOTIONS ----------
insert into promotions (title, description, product_id, start_date, end_date, priority) values
('Bakery Butter Blend - Summer Push', 'Head office focus product this month, offer 8% off on 10+ units', 'a0000001-0000-0000-0000-000000000006', current_date, current_date + interval '30 days', 'focus_product')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Note: leads, visits, orders, discount_requests, follow_ups,
-- document_shares are intentionally left empty here — these get
-- created LIVE during the demo by clicking through the app, which
-- is far more convincing than pre-seeded rows for those scenarios.
-- ============================================================
