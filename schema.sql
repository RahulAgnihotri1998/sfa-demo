-- ============================================================
-- SFA DEMO — DATABASE SCHEMA
-- Covers all 8 mandatory demo scenarios from the RFP:
-- 1. Customer visit (geo-fencing)      5. Special pricing approval
-- 2. Purchase decline alert            6. Order flow -> Sage X3
-- 3. Cross-sell / upsell               7. Dashboard
-- 4. Stock / alternative products      8. Document sharing
-- ============================================================

-- ---------- ENUM TYPES ----------

create type user_role as enum ('sales_rep', 'manager', 'admin');
create type lead_stage as enum ('new', 'qualified', 'converted', 'lost');
create type visit_status as enum ('planned', 'checked_in', 'closed', 'missed');
create type order_status as enum ('captured', 'validated', 'sent_to_erp', 'confirmed', 'failed');
create type discount_status as enum ('pending', 'approved', 'rejected');
create type stock_status as enum ('active', 'near_expiry', 'promo', 'out_of_stock', 'non_moving');
create type document_type as enum ('spec', 'recipe', 'contract', 'quotation', 'catalogue');
create type share_channel as enum ('email', 'whatsapp');
create type contract_status as enum ('draft', 'sent', 'signed', 'expired');

-- ---------- USERS (sales reps / managers) ----------
-- FR-01: territory, country, currency, role, reporting hierarchy

create table users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique not null,
  role user_role not null default 'sales_rep',
  territory text,
  country text,
  currency text default 'AED',
  manager_id uuid references users(id),
  created_at timestamptz default now()
);

-- ---------- CUSTOMERS ----------
-- FR-02: 360-degree view (contacts, address, owner, buying history, pricing, open items)

create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  account_owner_id uuid references users(id),
  territory text,
  country text,
  currency text default 'AED',
  contact_name text,
  contact_phone text,
  contact_email text,
  address text,
  latitude double precision,     -- for geo-fenced check-in
  longitude double precision,
  geofence_radius_m int default 150,
  open_items_amount numeric default 0,   -- outstanding invoices from Sage
  status text default 'active',   -- active / at_risk / dormant
  created_at timestamptz default now()
);

-- ---------- LEADS / PROSPECTS ----------
-- FR-03

create table leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  contact_phone text,
  stage lead_stage default 'new',
  owner_id uuid references users(id),
  converted_customer_id uuid references customers(id),
  notes text,
  created_at timestamptz default now()
);

-- ---------- PRODUCTS ----------
-- FR-11, FR-12, FR-17: alternatives, stock status, knowledge base

create table products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name text not null,
  category text,
  base_price numeric not null,
  currency text default 'AED',
  stock_status stock_status default 'active',
  is_promotion boolean default false,
  expiry_date date,
  description text,
  created_at timestamptz default now()
);

-- product alternatives (self-referencing many-to-many)
create table product_alternatives (
  product_id uuid references products(id) on delete cascade,
  alternative_product_id uuid references products(id) on delete cascade,
  primary key (product_id, alternative_product_id)
);

-- static cross-sell / upsell pairings (FR-10) — simplest reliable way to demo this
create table product_recommendations (
  product_id uuid references products(id) on delete cascade,
  recommended_product_id uuid references products(id) on delete cascade,
  reason text,   -- e.g. "Frequently bought together", "Similar customers also buy"
  primary key (product_id, recommended_product_id)
);

-- ---------- CUSTOMER-SPECIFIC PRICING ----------
-- FR-14: pricing varies customer to customer

create table customer_pricing (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  price numeric not null,
  currency text default 'AED',
  valid_from date default current_date,
  unique (customer_id, product_id)
);

-- ---------- VISITS ----------
-- FR-04, FR-05, FR-06, FR-07: planning, geo-fencing, mandatory closure, voice notes

create table visits (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  sales_rep_id uuid references users(id),
  status visit_status default 'planned',
  planned_date date,
  check_in_time timestamptz,
  check_in_lat double precision,
  check_in_lng double precision,
  within_geofence boolean,
  check_out_time timestamptz,
  outcome text,                 -- mandatory on close
  products_discussed text[],
  competitor_feedback text,
  next_action text,             -- mandatory on close
  follow_up_date date,          -- mandatory on close
  voice_note_url text,          -- Web Speech API / recorded audio
  voice_note_transcript text,
  ai_summary text,
  created_at timestamptz default now()
);

-- follow-ups / reminders generated from visits (FR-08)
create table follow_ups (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references visits(id),
  customer_id uuid references customers(id),
  sales_rep_id uuid references users(id),
  due_date date,
  description text,
  is_complete boolean default false,
  escalated_to_manager boolean default false,
  created_at timestamptz default now()
);

-- ---------- PURCHASE HISTORY ----------
-- feeds decline alerts (FR-09) and cross-sell (FR-10) and dashboards

create table purchase_history (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  product_id uuid references products(id),
  quantity numeric not null,
  order_month date not null,     -- first-of-month bucket, for trend queries
  amount numeric not null
);

-- ---------- ORDERS (Order Flow -> Sage X3) ----------
-- FR-13, FR-14, Table 6 "Order flow"

create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  sales_rep_id uuid references users(id),
  status order_status default 'captured',
  sage_order_number text,        -- populated once "sent to Sage X3"
  total_amount numeric,
  currency text default 'AED',
  captured_at timestamptz default now(),
  validated_at timestamptz,
  sent_to_erp_at timestamptz,
  confirmed_at timestamptz
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  quantity numeric not null,
  unit_price numeric not null,   -- snapshot of customer_pricing at time of order
  line_total numeric not null
);

-- ---------- SPECIAL PRICING / DISCOUNT APPROVAL ----------
-- FR-15

create table discount_requests (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid references order_items(id),
  requested_by uuid references users(id),
  requested_price numeric not null,
  reason text,
  status discount_status default 'pending',
  approver_id uuid references users(id),
  decided_at timestamptz,
  created_at timestamptz default now()
);

-- ---------- HEAD-OFFICE PROMOTIONS ----------
-- FR-16

create table promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  product_id uuid references products(id),
  start_date date,
  end_date date,
  priority text default 'normal',   -- e.g. 'focus_product', 'slow_moving', 'weekly_priority'
  created_at timestamptz default now()
);

-- ---------- DOCUMENTS & SHARING ----------
-- FR-17, FR-18, FR-19: knowledge base, sharing, contracts

create table documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type document_type not null,
  product_id uuid references products(id),      -- optional link (e.g. spec sheet for a product)
  file_url text not null,                        -- Supabase Storage URL
  created_at timestamptz default now()
);

create table document_shares (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id),
  customer_id uuid references customers(id),
  sales_rep_id uuid references users(id),
  channel share_channel not null,
  recipient text not null,          -- email address or phone number
  message text,
  sent_at timestamptz default now()
);

create table contracts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  document_id uuid references documents(id),
  status contract_status default 'draft',
  sent_at timestamptz,
  signed_at timestamptz,
  expires_at date,
  created_at timestamptz default now()
);

-- ---------- AUDIT LOG ----------
-- Non-functional requirement: auditability of pricing/approvals/orders/visits/contracts

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,     -- 'order', 'discount_request', 'contract', etc.
  entity_id uuid not null,
  action text not null,          -- 'created', 'status_changed', 'approved', etc.
  performed_by uuid references users(id),
  details jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- HELPFUL INDEXES
-- ============================================================
create index idx_orders_customer on orders(customer_id);
create index idx_purchase_history_customer_product on purchase_history(customer_id, product_id, order_month);
create index idx_visits_customer on visits(customer_id);
create index idx_customer_pricing_lookup on customer_pricing(customer_id, product_id);
create index idx_document_shares_customer on document_shares(customer_id);
