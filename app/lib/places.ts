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

export const places: Place[] = [
  {
    id: '1',
    name: 'Café Rainbow',
    description: 'Café acogedor y seguro para la comunidad LGBTIQ+. Ofrecemos un espacio libre de discriminación con eventos mensuales.',
    category: 'cafe',
    address: 'Cra. 45 #55-10',
    barrio: 'Parque Arvi',
    coordinates: [6.2487, -75.5582],
    phone: '+57 300 123 4567',
    website: 'www.caferainbow.co',
    hours: 'Lun-Dom: 8AM - 10PM',
    safetyRating: 5,
    lgbtiqFriendly: true,
    accessibility: ['Acceso en silla de ruedas', 'Baños inclusivos', 'Estacionamiento'],
  },
  {
    id: '2',
    name: 'La Comunidad Bar',
    description: 'Bar LGBTIQ+ friendly con música en vivo, danzas y eventos especiales. Comunidad activa y acogedora.',
    category: 'bar',
    address: 'Cra. 43 #50-30',
    barrio: 'Parque Bolívar',
    coordinates: [6.2442, -75.5703],
    phone: '+57 312 456 7890',
    hours: 'Jue-Dom: 9PM - 4AM',
    safetyRating: 5,
    lgbtiqFriendly: true,
    accessibility: ['Acceso en silla de ruedas', 'Personal capacitado'],
  },
  {
    id: '3',
    name: 'Hotel Identidad',
    description: 'Hotel gay-friendly ubicado en zona céntrica. Habitaciones cómodas y personal respetuoso.',
    category: 'lugar',
    address: 'Cra. 42 #48-15',
    barrio: 'Manila',
    coordinates: [6.2512, -75.5634],
    phone: '+57 4 555 8888',
    website: 'www.hotelidentidad.com',
    hours: 'Abierto 24 horas',
    safetyRating: 4,
    lgbtiqFriendly: true,
    accessibility: ['Ascensor', 'Baños adaptados', 'Aparcamiento'],
  },
  {
    id: '4',
    name: 'Parque Explora',
    description: 'Parque interactivo y museo con entrada inclusiva. Espacio seguro para familias diversas.',
    category: 'parque',
    address: 'Cra. 52 #45-41',
    barrio: 'Barrio Colombia',
    coordinates: [6.2547, -75.5903],
    phone: '+57 4 576 6000',
    website: 'www.parqueexplora.org',
    hours: 'Mar-Dom: 9AM - 6PM',
    safetyRating: 5,
    lgbtiqFriendly: true,
    accessibility: ['Acceso total en silla de ruedas', 'Áreas de descanso', 'Servicios higiénicos'],
  },
  {
    id: '5',
    name: 'Centro Cultural LGBTIQ+',
    description: 'Espacio dedicado al arte, educación y activismo LGBTIQ+. Exposiciones, talleres y eventos comunitarios.',
    category: 'culturalCenter',
    address: 'Cra. 45 #52-20',
    barrio: 'La Candelaria',
    coordinates: [6.2536, -75.5715],
    phone: '+57 4 251 6410',
    website: 'www.centroculturallgbtiq.org',
    hours: 'Mar-Dom: 10AM - 6PM',
    safetyRating: 5,
    lgbtiqFriendly: true,
    accessibility: ['Ascensor', 'Baños inclusivos', 'Intérpretes disponibles'],
  },
  {
    id: '6',
    name: 'Clínica de Salud Integral',
    description: 'Centro de salud especializado en atención LGBTIQ+. Personal capacitado y respetuoso con políticas de confidencialidad.',
    category: 'health',
    address: 'Cra. 40 #55-50',
    barrio: 'Estadio',
    coordinates: [6.2433, -75.5659],
    phone: '+57 4 444 2020',
    website: 'www.saludintegral.com',
    hours: 'Lun-Vie: 8AM - 6PM, Sab: 9AM - 1PM',
    safetyRating: 5,
    lgbtiqFriendly: true,
    accessibility: ['Acceso total', 'Baños adaptados', 'Estacionamiento'],
  },
  {
    id: '7',
    name: 'Biblioteca Pública Piloto',
    description: 'Biblioteca pública con colección LGBTIQ+ y espacios seguros para la comunidad. Eventos inclusivos.',
    category: 'culturalCenter',
    address: 'Cra. 46 #54-40',
    barrio: 'Moravia',
    coordinates: [6.2486, -75.5756],
    phone: '+57 4 516 1060',
    website: 'www.bibliotecapiloto.org.co',
    hours: 'Lun-Vie: 9AM - 7PM, Sab: 9AM - 5PM',
    safetyRating: 5,
    lgbtiqFriendly: true,
    accessibility: ['Ascensor', 'Baños inclusivos', 'WiFi gratis'],
  },
  {
    id: '8',
    name: 'Restaurante Diverso',
    description: 'Restaurante con propietarios LGBTIQ+ que ofrece cocina local y ambiente seguro y celebratorio.',
    category: 'cafe',
    address: 'Cra. 44 #49-15',
    barrio: 'Prado',
    coordinates: [6.2544, -75.5698],
    phone: '+57 301 789 2345',
    website: 'www.restaurantediverso.com',
    hours: 'Lun-Dom: 11AM - 10PM',
    safetyRating: 5,
    lgbtiqFriendly: true,
    accessibility: ['Acceso en silla de ruedas', 'Estacionamiento', 'Baños adaptados'],
  },
];

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
