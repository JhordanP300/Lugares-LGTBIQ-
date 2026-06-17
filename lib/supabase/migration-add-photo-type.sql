-- ============================================
-- MIGRACIÓN: Agregar columna type a tabla photos
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Agregar columna type con valor por defecto 'user'
ALTER TABLE photos ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'user';

-- 2. Crear índice para búsquedas por type
CREATE INDEX IF NOT EXISTS idx_photos_type ON photos(type);

-- 3. Crear índice compuesto place_id + type para consultas filtradas
CREATE INDEX IF NOT EXISTS idx_photos_place_type ON photos(place_id, type);

-- 4. Migrar fotos existentes: si el user_id coincide con created_by del lugar, marcar como 'admin'
UPDATE photos p
SET type = 'admin'
FROM places pl
WHERE p.place_id::uuid = pl.id
  AND p.user_id = pl.created_by
  AND p.user_id IS NOT NULL
  AND pl.created_by IS NOT NULL;

-- 5. Actualizar política RLS para INSERT: admins pueden insertar fotos sin user_id
DROP POLICY IF EXISTS "Authenticated insert photos" ON photos;
CREATE POLICY "Authenticated insert photos" ON photos
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR (
      EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    )
  );
