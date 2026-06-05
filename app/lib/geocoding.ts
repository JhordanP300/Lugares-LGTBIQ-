/**
 * Servicio de geocodificación usando Nominatim (OpenStreetMap)
 * Documentación: https://nominatim.org/release-docs/latest/api/Search/
 */

/**
 * Parsear coordenadas de Google Maps o formato directo
 * Formatos soportados:
 * - URL completa: https://www.google.com/maps/place/.../@6.2045,-75.5812,17z
 * - Coordenadas directas: 6.2045,-75.5812
 * - Formato ?q= o ?query=: ?q=6.2045,-75.5812
 * - Formato !3d!4d: !3d6.2045!4d-75.5812
 * - Fragmento: #6.2045,-75.5812
 * - Formato ?ll=: ?ll=6.2045,-75.5812
 */
export function parsearCoordenadasGoogleMaps(texto: string): { lat: number; lng: number } | null {
  if (!texto || texto.trim().length < 3) {
    return null;
  }

  const trimmed = texto.trim();

  // 1. Formato !3d!4d (más preciso, formato Place)
  const match3d4d = trimmed.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  if (match3d4d) {
    const lat = parseFloat(match3d4d[1]);
    const lng = parseFloat(match3d4d[2]);
    if (isValidCoordinate(lat, lng)) return { lat, lng };
  }

  // 2. Formato @lat,lng (el más común al copiar del navegador)
  const matchArroba = trimmed.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (matchArroba) {
    const lat = parseFloat(matchArroba[1]);
    const lng = parseFloat(matchArroba[2]);
    if (isValidCoordinate(lat, lng)) return { lat, lng };
  }

  // 3. Parámetros de query: ?q=, ?query=, ?ll=, ?center=, ?cbll=, ?coordinates=
  const matchQueryParam = trimmed.match(/[?&](?:q|query|ll|center|cbll|coordinates)=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (matchQueryParam) {
    const lat = parseFloat(matchQueryParam[1]);
    const lng = parseFloat(matchQueryParam[2]);
    if (isValidCoordinate(lat, lng)) return { lat, lng };
  }

  // 4. Formato ?api=1&query=lat,lng (Maps URLs API)
  const matchApiQuery = trimmed.match(/[?&]query=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (matchApiQuery) {
    const lat = parseFloat(matchApiQuery[1]);
    const lng = parseFloat(matchApiQuery[2]);
    if (isValidCoordinate(lat, lng)) return { lat, lng };
  }

  // 5. Fragmento: #lat,lng
  const matchFragment = trimmed.match(/#(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (matchFragment) {
    const lat = parseFloat(matchFragment[1]);
    const lng = parseFloat(matchFragment[2]);
    if (isValidCoordinate(lat, lng)) return { lat, lng };
  }

  // 6. Coordenadas directas: lat,lng (sin formato URL)
  // Solo si el texto parece ser puramente coordenadas
  if (/^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/.test(trimmed)) {
    const parts = trimmed.split(',').map(s => s.trim());
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (isValidCoordinate(lat, lng)) return { lat, lng };
  }

  return null;
}

/**
 * Validar que las coordenadas estén en rangos válidos
 */
function isValidCoordinate(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

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
