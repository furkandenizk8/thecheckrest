-- Şubeye Google Yorumlar linki alanı ekleniyor
ALTER TABLE branches ADD COLUMN IF NOT EXISTS google_reviews_url TEXT;
