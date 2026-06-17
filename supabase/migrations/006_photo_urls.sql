-- Kategorilere fotoğraf URL alanı ekle
ALTER TABLE categories ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Ürünlerde photo_url yoksa ekle (genelde zaten var, IF NOT EXISTS güvenli)
ALTER TABLE products ADD COLUMN IF NOT EXISTS photo_url TEXT;
