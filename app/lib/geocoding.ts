/**
 * Servicio de geocodificación usando Google Maps Geocoding API
 * Documentación: https://developers.google.com/maps/documentation/geocoding/overview
 */

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

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
    house_number?: string;
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
  placeId: string;
  displayName: string;
  lat: number;
  lng: number;
  address?: {
    road?: string;
    house_number?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
  };
}

/**
 * Formatear dirección al estilo colombiano usando componentes de Google
 * Ejemplo: "Cra. 37 #8-88, El Poblado, Medellín"
 */
export function formatearDireccionColombiana(address: {
  road?: string;
  house_number?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
}, displayName: string): string {
  // Si no hay componentes de dirección, usar el displayName truncado
  if (!address.road && !address.neighbourhood && !address.suburb) {
    const partes = displayName.split(',');
    return partes.slice(0, 3).join(',').trim();
  }

  const partes: string[] = [];

  // Calle/Número (ej: "Cra. 37 #8-88")
  if (address.road) {
    let calle = address.road;
    if (address.house_number) {
      calle += ` #${address.house_number}`;
    }
    partes.push(calle);
  }

  // Barrio/Vecindario
  const barrio = address.neighbourhood || address.suburb;
  if (barrio) {
    partes.push(barrio);
  }

  // Ciudad
  const ciudad = address.city || address.town || address.village;
  if (ciudad) {
    partes.push(ciudad);
  }

  return partes.length > 0 ? partes.join(', ') : displayName.split(',').slice(0, 3).join(',').trim();
}

/**
 * Formatear dirección desde componentes de Google Maps
 */
function formatearDesdeGoogleComponents(components: Array<{ long_name: string; short_name: string; types: string[] }>): {
  road?: string;
  house_number?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
} {
  const result: {
    road?: string;
    house_number?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
  } = {};

  for (const component of components) {
    const types = component.types;
    if (types.includes('route')) {
      result.road = component.long_name;
    } else if (types.includes('street_number')) {
      result.house_number = component.long_name;
    } else if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
      result.neighbourhood = component.long_name;
    } else if (types.includes('locality')) {
      result.city = component.long_name;
    } else if (types.includes('administrative_area_level_3')) {
      if (!result.city) result.town = component.long_name;
    } else if (types.includes('neighborhood') || types.includes('political')) {
      if (!result.neighbourhood) result.neighbourhood = component.long_name;
    }
  }

  return result;
}

/**
 * Geocodificar una dirección usando Google Geocoding API
 * Mucho más preciso que Nominatim para direcciones colombianas
 */
export async function geocodificarDireccion(direccion: string): Promise<GeocodingResult | null> {
  if (!direccion || direccion.trim().length < 3) {
    return null;
  }

  if (!GOOGLE_MAPS_API_KEY) {
    console.error('Google Maps API key no configurada');
    return null;
  }

  try {
    const query = encodeURIComponent(`${direccion}, Medellín, Colombia`);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${GOOGLE_MAPS_API_KEY}&language=es&region=co`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Error en la petición');
    }

    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return null;
    }

    const result = data.results[0];
    const location = result.geometry.location;
    
    return {
      lat: location.lat,
      lng: location.lng,
      displayName: result.formatted_address,
      address: formatearDesdeGoogleComponents(result.address_components),
    };
  } catch (error) {
    console.error('Error al geocodificar:', error);
    return null;
  }
}

/**
 * Obtener sugerencias de direcciones usando Google Places Autocomplete
 */
export async function obtenerSugerencias(busqueda: string): Promise<Suggestion[]> {
  if (!busqueda || busqueda.trim().length < 3) {
    return [];
  }

  if (!GOOGLE_MAPS_API_KEY) {
    console.error('Google Maps API key no configurada');
    return [];
  }

  try {
    const input = encodeURIComponent(`${busqueda}, Medellín, Colombia`);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${input}&key=${GOOGLE_MAPS_API_KEY}&language=es&region=co`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Error en la petición');
    }

    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results) {
      return [];
    }

    return data.results.slice(0, 5).map((item: {
      place_id: string;
      formatted_address: string;
      geometry: { location: { lat: number; lng: number } };
      address_components: Array<{ long_name: string; short_name: string; types: string[] }>;
    }) => ({
      placeId: item.place_id,
      displayName: item.formatted_address,
      lat: item.geometry.location.lat,
      lng: item.geometry.location.lng,
      address: formatearDesdeGoogleComponents(item.address_components),
    }));
  } catch (error) {
    console.error('Error al obtener sugerencias:', error);
    return [];
  }
}

/**
 * Obtener dirección inversa usando Google Reverse Geocoding
 */
export async function obtenerDireccionInversa(lat: number, lng: number): Promise<string | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('Google Maps API key no configurada');
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&language=es&region=co`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Error en la petición');
    }

    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return null;
    }

    return data.results[0].formatted_address || null;
  } catch (error) {
    console.error('Error al obtener dirección inversa:', error);
    return null;
  }
}
