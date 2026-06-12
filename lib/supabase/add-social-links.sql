-- ============================================
-- Agregar columna social_links a places y place_requests
-- Ejecutar este script en Supabase SQL Editor
-- ============================================

-- Agregar columna a la tabla places
ALTER TABLE places ADD COLUMN IF NOT EXISTS social_links TEXT[] DEFAULT '{}';

-- Agregar columna a la tabla place_requests
ALTER TABLE place_requests ADD COLUMN IF NOT EXISTS social_links TEXT[] DEFAULT '{}';
