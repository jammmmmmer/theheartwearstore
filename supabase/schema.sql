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
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Orders
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique,
  stripe_payment_intent_id text unique,
  printify_order_id text,
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
