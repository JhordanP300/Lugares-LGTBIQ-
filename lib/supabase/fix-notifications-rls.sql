-- ============================================
-- FIX COMPLETO: Políticas RLS para notifications
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Eliminar TODAS las políticas existentes de notifications
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'notifications'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON notifications', pol.policyname);
  END LOOP;
END $$;

-- 2. Recrear políticas limpiamente
-- SELECT: usuarios ven sus propias notificaciones
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT: cualquier autenticado puede insertar (para que admin cree notificaciones para otros)
CREATE POLICY "notifications_insert_auth" ON notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: usuarios marcan sus propias como leídas
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: usuarios eliminan sus propias
CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE USING (auth.uid() = user_id);
