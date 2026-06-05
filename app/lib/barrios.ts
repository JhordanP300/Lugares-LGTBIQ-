import { createClient } from '@/lib/supabase/client';

export interface Barrio {
  id: number;
  nombre: string;
  comuna: string;
}

/**
 * Cargar todos los barrios desde Supabase
 */
export async function cargarBarrios(): Promise<Barrio[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('barrios')
    .select('*')
    .order('comuna', { ascending: true })
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error al cargar barrios:', error);
    return [];
  }

  return data || [];
}

/**
 * Buscar barrios por nombre (para autocompletado)
 */
export async function buscarBarrios(busqueda: string): Promise<Barrio[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('barrios')
    .select('*')
    .ilike('nombre', `%${busqueda}%`)
    .order('nombre', { ascending: true })
    .limit(10);

  if (error) {
    console.error('Error al buscar barrios:', error);
    return [];
  }

  return data || [];
}

/**
 * Obtener barrios únicos de una comuna
 */
export async function obtenerBarriosPorComuna(comuna: string): Promise<Barrio[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('barrios')
    .select('*')
    .eq('comuna', comuna)
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error al obtener barrios por comuna:', error);
    return [];
  }

  return data || [];
}

/**
 * Obtener comunas únicas
 */
export async function obtenerComunas(): Promise<string[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('barrios')
    .select('comuna')
    .order('comuna', { ascending: true });

  if (error) {
    console.error('Error al obtener comunas:', error);
    return [];
  }

  // Obtener valores únicos
  const comunas = [...new Set(data?.map(b => b.comuna) || [])];
  return comunas;
}
