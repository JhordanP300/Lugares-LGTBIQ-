import { createClient } from '@/lib/supabase/client';
import { Place } from './places';

interface PlaceRow {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  barrio: string;
  coordinates: { lat: number; lng: number } | [number, number];
  phone: string | null;
  website: string | null;
  hours: string | null;
  safety_rating: number;
  lgbtiq_friendly: boolean;
  accessibility: string[];
  created_by: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

function rowToPlace(row: PlaceRow): Place {
  let coords: [number, number];
  if (Array.isArray(row.coordinates)) {
    coords = row.coordinates;
  } else {
    coords = [row.coordinates.lat, row.coordinates.lng];
  }
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category as Place['category'],
    address: row.address,
    barrio: row.barrio,
    coordinates: coords,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    hours: row.hours ?? undefined,
    safetyRating: row.safety_rating,
    lgbtiqFriendly: row.lgbtiq_friendly,
    accessibility: row.accessibility ?? [],
  };
}

function placeToRow(place: Omit<Place, 'id'>, userId?: string): Omit<PlaceRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    name: place.name,
    description: place.description,
    category: place.category,
    address: place.address,
    barrio: place.barrio,
    coordinates: { lat: place.coordinates[0], lng: place.coordinates[1] },
    phone: place.phone ?? null,
    website: place.website ?? null,
    hours: place.hours ?? null,
    safety_rating: place.safetyRating,
    lgbtiq_friendly: place.lgbtiqFriendly,
    accessibility: place.accessibility,
    created_by: userId ?? null,
    status: 'approved',
  };
}

export async function fetchPlaces(): Promise<Place[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map(rowToPlace);
}

export async function insertPlace(place: Omit<Place, 'id'>, userId: string): Promise<Place | null> {
  const supabase = createClient();
  const row = placeToRow(place, userId);

  const { data, error } = await supabase
    .from('places')
    .insert(row)
    .select()
    .single();

  if (error || !data) return null;
  return rowToPlace(data as PlaceRow);
}

export async function deletePlace(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('places')
    .delete()
    .eq('id', id);

  return !error;
}
