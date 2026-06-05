-- ============================================
-- STORAGE BUCKET para fotos y videos
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('place-media', 'place-media', true)
ON CONFLICT (id) DO NOTHING;

-- Política: cualquiera puede ver archivos públicos
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'place-media');

-- Política: usuarios autenticados pueden subir archivos
CREATE POLICY "Authenticated upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'place-media'
    AND auth.role() = 'authenticated'
  );

-- Política: usuarios pueden eliminar sus propios archivos
CREATE POLICY "Users delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'place-media'
    AND auth.uid()::text = (string_to_array(name, '_'))[1]
  );

-- ============================================
-- RLS para TABLA comments
-- ============================================
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are public" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated insert comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS para TABLA photos
-- ============================================
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photos are public" ON photos
  FOR SELECT USING (true);

CREATE POLICY "Authenticated insert photos" ON photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own photos" ON photos
  FOR DELETE USING (auth.uid() = user_id);
