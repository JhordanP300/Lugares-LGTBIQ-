-- ============================================
-- SCHEMA COMPLETO: Lugares LGTBIQ+
-- Ejecutar este archivo en Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. TABLA users (perfils de usuario)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user', -- 'user' | 'admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger: crear perfil de usuario automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- RLS para users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- 2. TABLA places (lugares aprobados)
-- ============================================
CREATE TABLE IF NOT EXISTS places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  address TEXT NOT NULL,
  barrio TEXT NOT NULL DEFAULT '',
  coordinates JSONB NOT NULL DEFAULT '{"lat": 6.2442, "lng": -75.5812}',
  phone TEXT,
  website TEXT,
  hours TEXT,
  safety_rating INT NOT NULL DEFAULT 5,
  lgbtiq_friendly BOOLEAN NOT NULL DEFAULT true,
  accessibility TEXT[] DEFAULT '{}',
  social_links TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'approved', -- pending | approved | rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para places
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);
CREATE INDEX IF NOT EXISTS idx_places_status ON places(status);
CREATE INDEX IF NOT EXISTS idx_places_barrio ON places(barrio);
CREATE INDEX IF NOT EXISTS idx_places_created_at ON places(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_places_created_by ON places(created_by);

-- RLS para places
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved places
CREATE POLICY "Public can read approved places" ON places
  FOR SELECT USING (status = 'approved' OR auth.uid() = created_by);

-- Authenticated users can insert places
CREATE POLICY "Authenticated insert places" ON places
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can update any place
CREATE POLICY "Admins update places" ON places
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Admins can delete any place
CREATE POLICY "Admins delete places" ON places
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- ============================================
-- 3. TABLA photos (fotos de lugares)
-- ============================================
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  author_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para photos
CREATE INDEX IF NOT EXISTS idx_photos_place_id ON photos(place_id);
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);

-- RLS para photos
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photos are public" ON photos
  FOR SELECT USING (true);

CREATE POLICY "Authenticated insert photos" ON photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own photos" ON photos
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 4. TABLA comments (comentarios de lugares)
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  text TEXT NOT NULL,
  rating INT DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para comments
CREATE INDEX IF NOT EXISTS idx_comments_place_id ON comments(place_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- RLS para comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are public" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated insert comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 5. STORAGE BUCKET para fotos y videos
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('place-media', 'place-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'place-media');

CREATE POLICY "Authenticated upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'place-media'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'place-media'
    AND auth.uid()::text = (string_to_array(name, '_'))[1]
  );

-- ============================================
-- 6. Trigger para updated_at en places
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_places_updated_at ON places;
CREATE TRIGGER update_places_updated_at
  BEFORE UPDATE ON places
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
