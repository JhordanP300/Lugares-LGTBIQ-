-- ============================================
-- Tabla de solicitudes de lugares
-- ============================================
CREATE TABLE IF NOT EXISTS place_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para place_requests
CREATE INDEX IF NOT EXISTS idx_place_requests_user_id ON place_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_place_requests_status ON place_requests(status);
CREATE INDEX IF NOT EXISTS idx_place_requests_created_at ON place_requests(created_at DESC);

-- RLS para place_requests
ALTER TABLE place_requests ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver sus propias solicitudes
CREATE POLICY "users_own_requests" ON place_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Los admins pueden ver todas las solicitudes
CREATE POLICY "admins_all_requests" ON place_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Los usuarios autenticados pueden insertar solicitudes
CREATE POLICY "authenticated_insert_requests" ON place_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Los admins pueden actualizar solicitudes (aprobar/rechazar)
CREATE POLICY "admins_update_requests" ON place_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Los admins pueden eliminar solicitudes
CREATE POLICY "admins_delete_requests" ON place_requests
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- ============================================
-- Tabla de notificaciones
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system', -- place_approved | place_rejected | system
  read BOOLEAN NOT NULL DEFAULT false,
  related_place_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS para notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para recrearlas limpiamente
DROP POLICY IF EXISTS "users_own_notifications" ON notifications;
DROP POLICY IF EXISTS "users_update_own_notifications" ON notifications;
DROP POLICY IF EXISTS "authenticated_insert_notifications" ON notifications;
DROP POLICY IF EXISTS "users_delete_own_notifications" ON notifications;

-- Los usuarios pueden ver sus propias notificaciones
CREATE POLICY "users_own_notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Los usuarios pueden marcar sus notificaciones como leídas
CREATE POLICY "users_update_own_notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Cualquier usuario autenticado puede insertar notificaciones (para que el admin pueda crear notificaciones para otros usuarios)
CREATE POLICY "authenticated_insert_notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Los usuarios pueden eliminar sus propias notificaciones
CREATE POLICY "users_delete_own_notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);
