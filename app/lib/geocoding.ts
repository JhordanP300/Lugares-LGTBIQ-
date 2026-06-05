/**
 * Servicio de geocodificación usando Nominatim (OpenStreetMap)
 * Documentación: https://nominatim.org/release-docs/latest/api/Search/
 */

export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  address: {
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

export interface Suggestion {
  placeId: number;
  displayName: string;
  lat: number;
  lng: number;
}

/**
 * Geocodificar una dirección (convertir texto a coordenadas)
 */
export async function geocodificarDireccion(direccion: string): Promise<GeocodingResult | null> {
  if (!direccion || direccion.trim().length < 3) {
    return null;
  }

  try {
    // Agregar "Medellín, Colombia" para mejorar la precisión
    const query = encodeURIComponent(`${direccion}, Medellín, Colombia`);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'es',
        'User-Agent': 'LugaresLGBTIQ+App/1.0' // Requerido por Nominatim
      }
    });

    if (!response.ok) {
      throw new Error('Error en la petición');
    }

    const data = await response.json();
    
    if (data.length === 0) {
      return null;
    }

    const result = data[0];
    
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      displayName: result.display_name,
      address: result.address || {}
    };
  } catch (error) {
    console.error('Error al geocodificar:', error);
    return null;
  }
}

/**
 * Obtener sugerencias de direcciones (autocompletado)
 */
export async function obtenerSugerencias(busqueda: string): Promise<Suggestion[]> {
  if (!busqueda || busqueda.trim().length < 3) {
    return [];
  }

  try {
    const query = encodeURIComponent(`${busqueda}, Medellín, Colombia`);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'es',
        'User-Agent': 'LugaresLGBTIQ+App/1.0'
      }
    });

    if (!response.ok) {
      throw new Error('Error en la petición');
    }

    const data = await response.json();
    
    return data.map((item: any) => ({
      placeId: item.place_id,
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon)
    }));
  } catch (error) {
    console.error('Error al obtener sugerencias:', error);
    return [];
  }
}

/**
 * Obtener dirección inversa (coordenadas a texto)
 */
export async function obtenerDireccionInversa(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`;
    
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'es',
        'User-Agent': 'LugaresLGBTIQ+App/1.0'
      }
    });

    if (!response.ok) {
      throw new Error('Error en la petición');
    }

    const data = await response.json();
    return data.display_name || null;
  } catch (error) {
    console.error('Error al obtener dirección inversa:', error);
    return null;
  }
}
