-- ==============================================================================
-- SkinSense v2 Database Schema (Supabase PostgreSQL)
-- Thiết kế & Cấu hình: Trần Thị Ngọc Hà (Super Admin - hattn.23itb@vku.udn.vn)
-- Mục đích: Hệ thống Quản trị 4 vai trò, Dược mỹ phẩm Shopee Mall, Phác đồ Y khoa
-- ==============================================================================

-- 1. Bảng Profiles (Người dùng hệ thống 4 vai trò: customer, specialist, shop, admin)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role text not null default 'customer' check (role in ('customer', 'specialist', 'shop', 'admin')),
  is_approved boolean not null default true,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Bảng Specialists (Bác sĩ Chuyên khoa Da liễu & CCHN)
create table if not exists public.specialists (
  id text primary key,
  full_name text not null,
  license_number text not null,
  specialty text not null,
  hospital text,
  experience_years int not null default 5,
  phone text,
  email text,
  avatar_url text,
  status text not null default 'approved' check (status in ('pending', 'approved', 'rejected')),
  bio text,
  rating numeric(2,1) not null default 5.0,
  review_count int not null default 0,
  cases_count int not null default 0,
  approved_by text default 'Trần Thị Ngọc Hà (Super Admin)',
  created_at timestamptz not null default now()
);

-- 3. Bảng Products (Gian hàng Dược mỹ phẩm chuẩn Shopee Mall Flagship)
create table if not exists public.products (
  id text primary key,
  name text not null,
  brand text not null,
  category text not null,
  price numeric not null,
  original_price numeric,
  image_url text not null,
  rating numeric(2,1) not null default 5.0,
  sold_count int not null default 0,
  stock_count int not null default 100,
  sku text,
  volume text,
  origin text,
  skin_type text,
  license_no text,
  description text,
  is_approved boolean not null default true,
  created_at timestamptz not null default now()
);

-- 4. Bảng Orders (Quản lý Đơn hàng Dược mỹ phẩm & Vận chuyển)
create table if not exists public.orders (
  id text primary key,
  order_code text not null unique,
  customer_name text not null,
  customer_phone text not null,
  shipping_address text not null,
  total_amount numeric not null,
  status text not null default 'processing' check (status in ('pending', 'processing', 'delivering', 'delivered', 'cancelled')),
  carrier text not null default 'Shopee Express',
  tracking_code text,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- 5. Bảng Routine Items (Các bước trong quy trình chăm sóc cá nhân)
create table if not exists public.routine_items (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null,
  label text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- 6. Bảng Routine Entries (Lịch sử tích hoàn thành từng ngày)
create table if not exists public.routine_entries (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null,
  night text not null,
  completed_labels text[] not null default '{}',
  item_count int not null default 0,
  created_at timestamptz not null default now(),
  constraint routine_entries_user_night_unique unique (user_id, night)
);

-- Bật Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.specialists enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.routine_items enable row level security;
alter table public.routine_entries enable row level security;

-- Policies cơ bản cho phép đọc công khai và ghi khi đã xác thực
create policy "Allow public read profiles" on public.profiles for select using (true);
create policy "Allow auth update profiles" on public.profiles for all using (auth.uid() = id or auth.jwt()->>'email' = 'hattn.23itb@vku.udn.vn');

create policy "Allow public read specialists" on public.specialists for select using (true);
create policy "Allow public read products" on public.products for select using (true);
create policy "Allow public read orders" on public.orders for select using (true);

create policy "Allow user access routine_items" on public.routine_items for all using (true);
create policy "Allow user access routine_entries" on public.routine_entries for all using (true);
