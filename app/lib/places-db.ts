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
  try {
    const res = await fetch(`/api/places?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function adminUpdatePlace(
  id: string,
  place: Partial<Omit<Place, 'id'>>
): Promise<Place | null> {
  const supabase = createClient();
  const updateData: Record<string, unknown> = {};

  if (place.name !== undefined) updateData.name = place.name;
  if (place.description !== undefined) updateData.description = place.description;
  if (place.category !== undefined) updateData.category = place.category;
  if (place.address !== undefined) updateData.address = place.address;
  if (place.barrio !== undefined) updateData.barrio = place.barrio;
  if (place.coordinates !== undefined) {
    updateData.coordinates = { lat: place.coordinates[0], lng: place.coordinates[1] };
  }
  if (place.phone !== undefined) updateData.phone = place.phone ?? null;
  if (place.website !== undefined) updateData.website = place.website ?? null;
  if (place.hours !== undefined) updateData.hours = place.hours ?? null;
  if (place.safetyRating !== undefined) updateData.safety_rating = place.safetyRating;
  if (place.lgbtiqFriendly !== undefined) updateData.lgbtiq_friendly = place.lgbtiqFriendly;
  if (place.accessibility !== undefined) updateData.accessibility = place.accessibility;

  const { data, error } = await supabase
    .from('places')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating place:', error.message, error.details);
    return null;
  }
  if (!data) return null;
  return rowToPlace(data as PlaceRow);
}

export async function fetchAllPlaces(): Promise<(Place & { createdBy: string | null; createdAt: string })[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map((row) => ({
    ...rowToPlace(row as PlaceRow),
    createdBy: row.created_by,
    createdAt: row.created_at,
  }));
}

export async function fetchPlacesStats(): Promise<{
  total: number;
  byCategory: Record<string, number>;
}> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('places')
    .select('category');

  if (error || !data) return { total: 0, byCategory: {} };

  const byCategory: Record<string, number> = {};
  data.forEach((p) => {
    byCategory[p.category] = (byCategory[p.category] || 0) + 1;
  });

  return { total: data.length, byCategory };
}
