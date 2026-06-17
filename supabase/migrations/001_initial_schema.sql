-- Markalar (Çoklu Restoran Zinciri)
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  owner_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Şubeler
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  currency TEXT DEFAULT 'GEL',
  service_fee_percent NUMERIC(5,2) DEFAULT 0,
  languages TEXT[] DEFAULT ARRAY['ka','en','ru','tr'],
  is_open BOOLEAN DEFAULT true,
  working_hours JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Masalar
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INT DEFAULT 4,
  status TEXT DEFAULT 'empty',  -- empty|occupied|needs_cleaning|reserved
  qr_code_url TEXT,
  qr_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Kategoriler
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  name_ka TEXT NOT NULL,
  name_en TEXT,
  name_ru TEXT,
  name_tr TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Ürünler
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  name_ka TEXT NOT NULL,
  name_en TEXT,
  name_ru TEXT,
  name_tr TEXT,
  description_ka TEXT,
  description_en TEXT,
  description_ru TEXT,
  description_tr TEXT,
  photo_url TEXT,
  base_price NUMERIC(10,2) NOT NULL,
  prep_time_minutes INT DEFAULT 15,
  allergens TEXT[],
  is_spicy BOOLEAN DEFAULT false,
  is_vegetarian BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0
);

-- Şubeye özel ürün ayarları (fiyat farklılaştırma, stok)
CREATE TABLE branch_product_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  custom_price NUMERIC(10,2),   -- null ise base_price kullan
  is_active BOOLEAN DEFAULT true,
  stock_count INT,              -- null = sınırsız
  UNIQUE(branch_id, product_id)
);

-- Ürün ek seçenekler (ekstra peynir, sos vs.)
CREATE TABLE product_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name_ka TEXT NOT NULL,
  name_en TEXT,
  name_ru TEXT,
  name_tr TEXT,
  extra_price NUMERIC(10,2) DEFAULT 0,
  is_required BOOLEAN DEFAULT false
);

-- Masa Oturumları (Müşterinin masadaki aktif tarayıcı oturumu)
CREATE TABLE table_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES tables(id),
  branch_id UUID REFERENCES branches(id),
  device_id TEXT,
  customer_name TEXT,
  language TEXT DEFAULT 'tr',
  opened_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Adisyonlar (Masa bazlı hesap)
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES tables(id),
  branch_id UUID REFERENCES branches(id),
  status TEXT DEFAULT 'open',   -- open|closed|paid
  total_amount NUMERIC(10,2) DEFAULT 0,
  paid_amount NUMERIC(10,2) DEFAULT 0,
  service_fee NUMERIC(10,2) DEFAULT 0,
  tip_amount NUMERIC(10,2) DEFAULT 0,
  payment_method TEXT,          -- cash|card|online|mixed
  opened_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  notes TEXT
);

-- Siparişler
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES bills(id),
  table_id UUID REFERENCES tables(id),
  branch_id UUID REFERENCES branches(id),
  session_id UUID REFERENCES table_sessions(id),
  status TEXT DEFAULT 'new',    -- new|preparing|ready|delivered|cancelled
  total_amount NUMERIC(10,2) DEFAULT 0,
  customer_note TEXT,
  cancel_window_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sipariş Kalemleri
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  selected_options UUID[],
  chef_note TEXT,
  status TEXT DEFAULT 'pending', -- pending|preparing|ready|delivered|cancelled
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Garson / Servis İstekleri
CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES tables(id),
  branch_id UUID REFERENCES branches(id),
  session_id UUID REFERENCES table_sessions(id),
  type TEXT NOT NULL,           -- waiter|bill|napkin|salt|cutlery|water|cleaning
  priority TEXT DEFAULT 'yellow',
  status TEXT DEFAULT 'pending', -- pending|acknowledged|done
  assigned_to UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Kullanıcı Rolleri
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  branch_id UUID REFERENCES branches(id),
  role TEXT NOT NULL,           -- super_admin|brand_owner|branch_manager|cashier|kitchen|waiter
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, branch_id)
);

-- Audit log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
