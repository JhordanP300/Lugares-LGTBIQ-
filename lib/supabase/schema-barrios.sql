-- ============================================
-- TABLA DE BARRIOS DE MEDELLÍN Y VALLE DE ABURRÁ
-- ============================================

-- Crear tabla de barrios
CREATE TABLE IF NOT EXISTS barrios (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  municipio TEXT NOT NULL DEFAULT 'Medellín',
  region TEXT DEFAULT 'Valle de Aburrá',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsquedas rápidas
CREATE INDEX idx_barrios_nombre ON barrios(nombre);
CREATE INDEX idx_barrios_municipio ON barrios(municipio);

-- Insertar barrios de Medellín (comuna 1-16)
INSERT INTO barrios (nombre, municipio) VALUES
-- Comuna 1 - Popular
('Popular', 'Medellín'),
('Santa Cruz', 'Medellín'),
('Manrique', 'Medellín'),
('Aranzazu', 'Medellín'),
('San José de la Montaña', 'Medellín'),
('Santo Domingo', 'Medellín'),
('Santa María de los Ángeles', 'Medellín'),

-- Comuna 2 - Santa Cruz
('Barrio Abajo', 'Medellín'),
('San Francisco', 'Medellín'),
('Dolores', 'Medellín'),
('Pereira', 'Medellín'),
('San José del Prado', 'Medellín'),
('Álamos', 'Medellín'),
('Briceño', 'Medellín'),
('Estación Central', 'Medellín'),

-- Comuna 3 - Manrique
('Manrique', 'Medellín'),
('San Diego', 'Medellín'),
('Chagualo', 'Medellín'),
('Granjas de Tequendama', 'Medellín'),
('Kennedy', 'Medellín'),
('Villa Nueva', 'Medellín'),
('Villa Hermosa', 'Medellín'),

-- Comuna 4 - Aranjuez
('Aranjuez', 'Medellín'),
('San Pedro', 'Medellín'),
('Pueblito Latino', 'Medellín'),
('Barcelona', 'Medellín'),
('Granada', 'Medellín'),
('Córdoba', 'Medellín'),
('Llanaditas', 'Medellín'),
('Los Ángeles', 'Medellín'),

-- Comuna 5 - Castilla
('Castilla', 'Medellín'),
('San José', 'Medellín'),
('Santa Rosa de Osos', 'Medellín'),
('Obrero', 'Medellín'),
('Caribe', 'Medellín'),
('Alfonso López', 'Medellín'),
('Belalcázar', 'Medellín'),
('Picota', 'Medellín'),

-- Comuna 6 - Doce de Octubre
('Doce de Octubre', 'Medellín'),
('San Martín de Porres', 'Medellín'),
('María Cano', 'Medellín'),
('El Compromiso', 'Medellín'),
('Betania', 'Medellín'),
('Altavista', 'Medellín'),
('Santa Gema', 'Medellín'),

-- Comuna 7 - Robledo
('Robledo', 'Medellín'),
('San Bernardo', 'Medellín'),
('La Esperanza', 'Medellín'),
('El Paraíso', 'Medellín'),
('San Gabriel', 'Medellín'),
('Las Acacias', 'Medellín'),
('La Palma', 'Medellín'),
('Pueblo Nuevo', 'Medellín'),

-- Comuna 8 - Villa Hermosa
('Villa Hermosa', 'Medellín'),
('Buenos Aires', 'Medellín'),
('La Francesa', 'Medellín'),
('Patricia', 'Medellín'),
('Río Negro', 'Medellín'),
('Santander', 'Medellín'),

-- Comuna 9 - Buenos Aires
('Buenos Aires', 'Medellín'),
('San Diego', 'Medellín'),
('Manila', 'Medellín'),
('El Poblado', 'Medellín'),
('Provenza', 'Medellín'),
('La 70', 'Medellín'),

-- Comuna 10 - La Candelaria
('La Candelaria', 'Medellín'),
('Centro', 'Medellín'),
('San Nicolás', 'Medellín'),
('Villa de Guadalupe', 'Medellín'),
('Aguacatala', 'Medellín'),
('Terrón', 'Medellín'),
('San Benito', 'Medellín'),

-- Comuna 11 - Laureles-Estadio
('Laureles', 'Medellín'),
('Estadio', 'Medellín'),
('San Fernando', 'Medellín'),
('Conquistadores', 'Medellín'),
('Floresta', 'Medellín'),
('La America', 'Medellín'),
('El Retiro', 'Medellín'),
('Suramericana', 'Medellín'),

-- Comuna 12 - La América
('La América', 'Medellín'),
('San Germán', 'Medellín'),
('Santos', 'Medellín'),
('Manila', 'Medellín'),
('Poblado', 'Medellín'),
('Envigado', 'Medellín'),

-- Comuna 13 - San Javier
('San Javier', 'Medellín'),
('La Portuguesa', 'Medellín'),
('San José', 'Medellín'),
('Diego Echavarría', 'Medellín'),
('Morato', 'Medellín'),
('Alejandro Echavarría', 'Medellín'),
('Otilio Urdaneta', 'Medellín'),

-- Comuna 14 - El Poblado
('El Poblado', 'Medellín'),
('Provenza', 'Medellín'),
('La 70', 'Medellín'),
('Manila', 'Medellín'),
('Castilla', 'Medellín'),
('La Magnolia', 'Medellín'),
('Calasanz', 'Medellín'),
('Belo Horizonte', 'Medellín'),
('Santa María de los Ángeles', 'Medellín'),

-- Comuna 15 - Guayabal
('Guayabal', 'Medellín'),
('Santa Gema', 'Medellín'),
('La Iguanita', 'Medellín'),
('El Salado', 'Medellín'),
('Los Balsos', 'Medellín'),
('La Herradura', 'Medellín'),

-- Comuna 16 - Belén
('Belén', 'Medellín'),
('San Bernardo', 'Medellín'),
('La 80', 'Medellín'),
('Granjas de Tequendama', 'Medellín'),
('Los Alcázares', 'Medellín'),
('San José del Prado', 'Medellín'),
('Villa del Sol', 'Medellín'),
('Aranjuez', 'Medellín'),

-- Municipios del Valle de Aburrá
('Envigado', 'Envigado'),
('Sabaneta', 'Sabaneta'),
('Itagüí', 'Itagüí'),
('La Estrella', 'La Estrella'),
('Caldas', 'Caldas'),
('Bello', 'Bello'),
('Copacabana', 'Copacabana'),
('Girardota', 'Girardota'),
('Barbosa', 'Barbosa'),
('Santa Fe de Antioquia', 'Santa Fe de Antioquia'),
('Turbo', 'Turbo'),
('Apartadó', 'Apartadó'),
('Carepa', 'Carepa'),
('Chigorodó', 'Chigorodó');

-- Habilitar RLS (Row Level Security)
ALTER TABLE barrios ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública (cualquiera puede leer los barrios)
CREATE POLICY "Barrios son visibles públicamente" ON barrios
  FOR SELECT USING (true);

-- Política para insertar (solo usuarios autenticados)
CREATE POLICY "Usuarios autenticados pueden insertar barrios" ON barrios
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Comentario de la tabla
COMMENT ON TABLE barrios IS 'Barrios de Medellín y municipios del Valle de Aburrá';
