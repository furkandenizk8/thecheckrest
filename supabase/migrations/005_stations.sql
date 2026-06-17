-- Birimler tablosu (şube bazlı hazırlık istasyonları: Mutfak, Bar, Soğuk Mutfak vb.)
CREATE TABLE IF NOT EXISTS stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'amber',   -- UI renk kodu: amber|sky|emerald|rose|violet
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  telegram_chat_id TEXT,        -- Boşsa telegram bildirimi gönderilmez
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Kategorilere hangi birimde hazırlanacağını belirt
ALTER TABLE categories ADD COLUMN IF NOT EXISTS station_id UUID REFERENCES stations(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stations_public_read" ON stations FOR SELECT USING (true);
CREATE POLICY "stations_service_all" ON stations FOR ALL USING (true) WITH CHECK (true);
