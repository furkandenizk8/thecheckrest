-- Menü fotoğrafları için Supabase Storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-photos',
  'menu-photos',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Public okuma (herkese açık URL'ler için)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='menu_photos_public_read'
  ) THEN
    CREATE POLICY "menu_photos_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'menu-photos');
  END IF;
END $$;

-- Servis rolü her şeyi yapabilir (API route üzerinden yükleme için)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname='menu_photos_service_all'
  ) THEN
    CREATE POLICY "menu_photos_service_all" ON storage.objects FOR ALL USING (true) WITH CHECK (bucket_id = 'menu-photos');
  END IF;
END $$;
