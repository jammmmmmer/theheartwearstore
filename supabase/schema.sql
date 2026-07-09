-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Products (synced from Printify)
create table if not exists products (
  id text primary key default gen_random_uuid()::text,
  printify_id text unique not null,
  title text not null,
  description text default '',
  tags text[] default '{}',
  options jsonb default '[]',
  variants jsonb not null default '[]',
  images jsonb not null default '[]',
  price_from integer not null default 0,
  is_enabled boolean default true,
  -- Public-uploaded custom tees: orderable by link, hidden from the shop collection.
  is_custom boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- Idempotent for existing databases (create table above is skipped if it exists).
alter table products add column if not exists is_custom boolean not null default false;

-- Orders
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique,
  stripe_payment_intent_id text unique,
  printify_order_id text,
  tracking_number text,
  tracking_carrier text,
  tracking_url text,
  customer_email text,
  customer_name text,
  shipping_address jsonb,
  line_items jsonb not null default '[]',
  total_amount integer not null default 0,
  currency text default 'cad',
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists products_is_enabled_idx on products(is_enabled);
create index if not exists orders_stripe_session_idx on orders(stripe_session_id);
create index if not exists orders_printify_order_idx on orders(printify_order_id);
create index if not exists orders_status_idx on orders(status);

-- Updated at trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply trigger to products
create trigger products_updated_at
  before update on products
  for each row execute function update_updated_at();

-- Apply trigger to orders
create trigger orders_updated_at
  before update on orders
  for each row execute function update_updated_at();

-- Row Level Security
alter table products enable row level security;
alter table orders enable row level security;

-- Products: publicly readable (only enabled ones via anon key)
create policy "Products are publicly readable"
  on products for select
  using (is_enabled = true);

-- Orders: only accessible via service role (no public access)
create policy "Orders are private"
  on orders for all
  using (false);

-- Pending products (awaiting Jamie's approval before going live)
create table if not exists pending_products (
  id uuid primary key default gen_random_uuid(),
  printify_id text not null,
  title text not null,
  topic text not null,
  mockup_url text,
  status text default 'pending',  -- 'pending' | 'approved' | 'rejected'
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

create index if not exists pending_products_status_idx on pending_products(status);

alter table pending_products enable row level security;

create policy "Pending products are private"
  on pending_products for all
  using (false);

-- Catalog configuration: which garments/providers/variants new products use.
-- Replaces the hardcoded blueprint/variant constants; refreshed from
-- Printify's catalog API via /api/admin/catalog-sync.
create table if not exists catalog_items (
  id uuid primary key default gen_random_uuid(),
  blueprint_id integer not null,
  print_provider_id integer not null,
  label text not null,
  price integer not null,                       -- retail price in CAD cents
  enabled_variant_ids integer[] not null default '{}',
  all_variant_ids integer[] not null default '{}',
  variants jsonb,                               -- cached Printify catalog variants
  variants_synced_at timestamptz,
  shipping jsonb,                               -- cached Printify shipping profiles (USD cents)
  shipping_synced_at timestamptz,
  is_default boolean not null default false,
  is_enabled boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (blueprint_id, print_provider_id)
);

create trigger catalog_items_updated_at
  before update on catalog_items
  for each row execute function update_updated_at();

alter table catalog_items enable row level security;

create policy "Catalog items are private"
  on catalog_items for all
  using (false);

-- ── Artist platform (P3) ──────────────────────────────────────────────

-- Artist profiles, 1:1 with Supabase Auth users
create table if not exists artists (
  id uuid primary key references auth.users(id) on delete cascade,
  slug text unique not null,
  display_name text not null,
  bio text not null default '',
  commission_pct numeric not null default 10,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger artists_updated_at
  before update on artists
  for each row execute function update_updated_at();

alter table artists enable row level security;

create policy "Artist profiles are publicly readable"
  on artists for select
  using (true);

create policy "Artists can insert own profile"
  on artists for insert
  with check (auth.uid() = id);

create policy "Artists can update own profile"
  on artists for update
  using (auth.uid() = id);

-- Attribution on live products and pending submissions
alter table products add column if not exists artist_id uuid references artists(id);
alter table pending_products add column if not exists artist_id uuid;

create index if not exists products_artist_idx on products(artist_id);

-- Earnings ledger: one row per (order, product) with an attributed artist
create table if not exists artist_earnings (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references artists(id),
  order_id uuid not null references orders(id),
  printify_product_id text not null,
  quantity integer not null default 1,
  item_amount integer not null,        -- item revenue in order currency (cents)
  commission_pct numeric not null,
  commission_amount integer not null,  -- cents, in order currency
  currency text not null default 'cad',
  status text not null default 'accrued',  -- 'accrued' | 'paid'
  created_at timestamptz default now(),
  unique (order_id, printify_product_id)
);

create index if not exists artist_earnings_artist_idx on artist_earnings(artist_id);

alter table artist_earnings enable row level security;

create policy "Artists read own earnings"
  on artist_earnings for select
  using (auth.uid() = artist_id);

-- Community votes on pending artist submissions
create table if not exists design_votes (
  id uuid primary key default gen_random_uuid(),
  pending_product_id uuid not null references pending_products(id) on delete cascade,
  voter_fingerprint text not null,
  created_at timestamptz default now(),
  unique (pending_product_id, voter_fingerprint)
);

create index if not exists design_votes_pending_idx on design_votes(pending_product_id);

alter table design_votes enable row level security;

create policy "Votes are private"
  on design_votes for all
  using (false);

-- Rate-limiting log for anonymous public custom uploads (service-role only).
create table if not exists custom_upload_events (
  id uuid primary key default gen_random_uuid(),
  ip text,
  created_at timestamptz not null default now()
);

create index if not exists custom_upload_events_ip_created_idx
  on custom_upload_events (ip, created_at desc);

alter table custom_upload_events enable row level security;
-- No policies: only the service role (server) reads/writes this table.
