-- Servis bölgeleri (garson yönlendirmesi: İç Salon, Bahçe, 1. Kat, 2. Kat vb.)
CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  name_tr TEXT NOT NULL,
  name_en TEXT,
  name_ka TEXT,
  name_ru TEXT,
  telegram_chat_id TEXT,        -- Boşsa bu bölgeye Telegram bildirimi gönderilmez
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Masalara bölge ata
ALTER TABLE tables ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES zones(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='zones' AND policyname='zones_public_read'
  ) THEN
    CREATE POLICY "zones_public_read" ON zones FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='zones' AND policyname='zones_service_all'
  ) THEN
    CREATE POLICY "zones_service_all" ON zones FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
