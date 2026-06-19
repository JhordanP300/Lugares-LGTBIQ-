export interface Place {
  id: string;
  name: string;
  description: string;
  category: 'cafe' | 'bar' | 'lugar' | 'lugarSimbolico' | 'parque' | 'culturalCenter' | 'health' | 'other';
  address: string;
  barrio: string;
  coordinates: [number, number]; // [lat, lng]
  phone?: string;
  website?: string;
  hours?: string;
  safetyRating: number; // 1-5
  lgbtiqFriendly: boolean;
  accessibility: string[];
  socialLinks?: string[];
}

export interface Comment {
  id: number;
  placeId: number;
  author: string;
  text: string;
  rating: number;
  date: string;
}

export interface Photo {
  id: number;
  placeId: number;
  url: string;
  author: string;
  date: string;
}

// Coordenadas aproximadas del centro de Medellín y barrios
export const MEDELLIN_CENTER: [number, number] = [6.2442, -75.5812];

export const places: Place[] = [];

export const neighborhoods = [
  { name: 'Parque Arvi', coordinates: [6.2487, -75.5582] },
  { name: 'Parque Bolívar', coordinates: [6.2442, -75.5703] },
  { name: 'Manila', coordinates: [6.2512, -75.5634] },
  { name: 'Barrio Colombia', coordinates: [6.2547, -75.5903] },
  { name: 'La Candelaria', coordinates: [6.2536, -75.5715] },
  { name: 'Estadio', coordinates: [6.2433, -75.5659] },
  { name: 'Moravia', coordinates: [6.2486, -75.5756] },
  { name: 'Prado', coordinates: [6.2544, -75.5698] },
];

export const RAINBOW_COLORS = [
  '#FF0000', // Rojo
  '#FF7F00', // Naranja
  '#FFFF00', // Amarillo
  '#00FF00', // Verde
  '#0000FF', // Azul
  '#4B0082', // Índigo
  '#9400D3', // Violeta
];

export const categoryLabels: Record<Place['category'], string> = {
  cafe: '☕ Café',
  bar: '🍹 Bar',
  lugar: '📍 Lugar Emblemático',
  lugarSimbolico: '🏳️‍🌈 Lugar Simbólico',
  parque: '🌳 Parque',
  culturalCenter: '🎨 Centro Cultural',
  health: '⚕️ Salud',
  other: '📍 Otro',
};

export const categoryColors: Record<Place['category'], string> = {
  cafe: '#FF0000',     // Rojo
  bar: '#FF7F00',      // Naranja
  lugar: '#FFFF00',    // Amarillo
  lugarSimbolico: '#FF69B4', // Rosa
  parque: '#00FF00',   // Verde
  culturalCenter: '#0000FF', // Azul
  health: '#4B0082',   // Índigo
  other: '#9400D3',    // Violeta
};
