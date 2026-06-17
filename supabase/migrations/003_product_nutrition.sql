-- Ürünler tablosuna kalori ve besin değeri alanlarını ekle
ALTER TABLE products ADD COLUMN IF NOT EXISTS calories INT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS protein_g NUMERIC(5,1);
ALTER TABLE products ADD COLUMN IF NOT EXISTS carbs_g NUMERIC(5,1);
ALTER TABLE products ADD COLUMN IF NOT EXISTS fat_g NUMERIC(5,1);

-- Çok dilli içindekiler alanlarını ekle
ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients_ka TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients_tr TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients_en TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients_ru TEXT;
