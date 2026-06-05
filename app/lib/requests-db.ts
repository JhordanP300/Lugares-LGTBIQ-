import { createClient } from '@/lib/supabase/client';
import { Place } from './places';

export interface PlaceRequest {
  id: string;
  userId: string | null;
  name: string;
  description: string;
  category: string;
  address: string;
  barrio: string;
  coordinates: [number, number];
  phone: string | null;
  website: string | null;
  hours: string | null;
  safetyRating: number;
  lgbtiqFriendly: boolean;
  accessibility: string[];
  status: 'pending' | 'approved' | 'rejected';
  adminNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  userName?: string;
  userEmail?: string;
}

interface PlaceRequestRow {
  id: string;
  user_id: string | null;
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
  status: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  users?: { name: string } | null;
}

function rowToRequest(row: PlaceRequestRow): PlaceRequest {
  let coords: [number, number];
  if (Array.isArray(row.coordinates)) {
    coords = row.coordinates;
  } else {
    coords = [row.coordinates.lat, row.coordinates.lng];
  }
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    category: row.category,
    address: row.address,
    barrio: row.barrio,
    coordinates: coords,
    phone: row.phone,
    website: row.website,
    hours: row.hours,
    safetyRating: row.safety_rating,
    lgbtiqFriendly: row.lgbtiq_friendly,
    accessibility: row.accessibility ?? [],
    status: row.status as PlaceRequest['status'],
    adminNotes: row.admin_notes,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    userName: (row as any).users?.name,
  };
}

export function requestToPlace(request: PlaceRequest): Place {
  return {
    id: request.id,
    name: request.name,
    description: request.description,
    category: request.category as Place['category'],
    address: request.address,
    barrio: request.barrio,
    coordinates: request.coordinates,
    phone: request.phone ?? undefined,
    website: request.website ?? undefined,
    hours: request.hours ?? undefined,
    safetyRating: request.safetyRating,
    lgbtiqFriendly: request.lgbtiqFriendly,
    accessibility: request.accessibility,
  };
}

export async function insertPlaceRequest(
  place: Omit<Place, 'id'>,
  userId: string
): Promise<PlaceRequest | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('place_requests')
    .insert({
      user_id: userId,
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
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error insertando solicitud:', error.message, error.details, error.hint);
    return null;
  }
  if (!data) return null;
  return rowToRequest(data as PlaceRequestRow);
}

export async function fetchUserRequests(userId: string): Promise<PlaceRequest[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('place_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map(rowToRequest);
}

export async function fetchAllRequests(
  status?: string
): Promise<PlaceRequest[]> {
  const supabase = createClient();
  let query = supabase
    .from('place_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching requests:', error.message, error.details, error.hint);
    return [];
  }
  if (!data) return [];
  return data.map(rowToRequest);
}

export async function approveRequest(
  requestId: string,
  adminId: string,
  adminNotes: string
): Promise<boolean> {
  const supabase = createClient();

  const { data: request, error: fetchError } = await supabase
    .from('place_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) return false;

  const placeRow = {
    name: request.name,
    description: request.description,
    category: request.category,
    address: request.address,
    barrio: request.barrio,
    coordinates: request.coordinates,
    phone: request.phone,
    website: request.website,
    hours: request.hours,
    safety_rating: request.safety_rating,
    lgbtiq_friendly: request.lgbtiq_friendly,
    accessibility: request.accessibility,
    created_by: request.user_id,
    status: 'approved',
  };

  const { error: insertError } = await supabase
    .from('places')
    .insert(placeRow);

  if (insertError) return false;

  const { error: updateError } = await supabase
    .from('place_requests')
    .update({
      status: 'approved',
      admin_notes: adminNotes,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  return !updateError;
}

export async function rejectRequest(
  requestId: string,
  adminId: string,
  adminNotes: string
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('place_requests')
    .update({
      status: 'rejected',
      admin_notes: adminNotes,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  return !error;
}

export async function deleteRequest(requestId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('place_requests')
    .delete()
    .eq('id', requestId);

  return !error;
}

export async function getRequestStats(): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('place_requests')
    .select('status');

  if (error || !data) return { total: 0, pending: 0, approved: 0, rejected: 0 };

  return {
    total: data.length,
    pending: data.filter((r) => r.status === 'pending').length,
    approved: data.filter((r) => r.status === 'approved').length,
    rejected: data.filter((r) => r.status === 'rejected').length,
  };
}
