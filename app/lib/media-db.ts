import { createClient } from '@/lib/supabase/client';

export interface Photo {
  id: string;
  placeId: string;
  userId: string | null;
  url: string;
  thumbnailUrl: string | null;
  author: string;
  date: string;
  type: 'admin' | 'user';
}

interface PhotoRow {
  id: string;
  place_id: string;
  user_id: string | null;
  url: string;
  thumbnail_url: string | null;
  author_name: string | null;
  created_at: string;
  type: string;
}

function rowToPhoto(row: PhotoRow): Photo {
  return {
    id: row.id,
    placeId: row.place_id,
    userId: row.user_id,
    url: row.url,
    thumbnailUrl: row.thumbnail_url,
    author: row.author_name ?? 'Anónimo',
    date: row.created_at.split('T')[0],
    type: row.type === 'admin' ? 'admin' : 'user',
  };
}

const BUCKET_NAME = 'place-media';

function getFileExtension(file: File): string {
  return file.name.split('.').pop() || 'bin';
}

function isVideo(file: File): boolean {
  return file.type.startsWith('video/');
}

// Upload a Supabase Storage (para imágenes)
export async function uploadFile(
  file: File,
  placeId: string,
  userId: string
): Promise<{ url: string; thumbnailUrl: string | null }> {
  const supabase = createClient();
  const ext = getFileExtension(file);
  const timestamp = Date.now();
  const path = `${placeId}/${userId}_${timestamp}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(`Error subiendo archivo: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return {
    url: urlData.publicUrl,
    thumbnailUrl: urlData.publicUrl,
  };
}

// Upload unificado: videos a Cloudinary, imágenes a Supabase Storage
export async function uploadMedia(
  file: File,
  placeId: string,
  userId: string,
  onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
): Promise<{ url: string; thumbnailUrl: string | null }> {
  if (isVideo(file)) {
    const result = await uploadFileToCloudinary(file, placeId, userId, onProgress);
    return { url: result.url, thumbnailUrl: result.thumbnailUrl || null };
  }
  return uploadFile(file, placeId, userId);
}

// Upload a Cloudinary (para videos grandes sin límite)
export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  format: string;
  resourceType: string;
  bytes: number;
  duration?: number;
  thumbnailUrl?: string;
}

export async function uploadFileToCloudinary(
  file: File,
  placeId: string,
  userId: string,
  onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    throw new Error('Cloudinary no está configurado. Falta CLOUD_NAME.');
  }

  if (onProgress) {
    onProgress({ loaded: 0, total: file.size, percentage: 0 });
  }

  const folder = placeId ? `lugares/${placeId}` : 'lugares';
  const timestamp = Math.floor(Date.now() / 1000);

  const signRes = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder, timestamp }),
  });

  if (!signRes.ok) {
    const err = await signRes.json().catch(() => null);
    throw new Error(`Error obteniendo firma: ${err?.error || signRes.status}`);
  }

  const { signature, api_key } = await signRes.json();

  const resourceType = file.type.startsWith('video/') ? 'video' : 'image';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', api_key);
  formData.append('timestamp', String(timestamp));
  formData.append('folder', folder);
  formData.append('signature', signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.error?.message || `Error ${response.status}`;
    throw new Error(`Error de Cloudinary: ${message}`);
  }

  const data = await response.json();

  let thumbnailUrl = null;
  if (resourceType === 'video') {
    thumbnailUrl = data.secure_url
      .replace('/upload/', '/upload/w_300,h_200,c_fill,f_jpg/')
      .replace(/\.[^.]+$/, '.jpg');
  } else {
    thumbnailUrl = data.secure_url;
  }

  if (onProgress) {
    onProgress({ loaded: file.size, total: file.size, percentage: 100 });
  }

  return {
    url: data.secure_url,
    publicId: data.public_id,
    format: data.format,
    resourceType: data.resource_type,
    bytes: data.bytes,
    duration: data.duration,
    thumbnailUrl,
  };
}

export async function fetchPhotos(placeId: string): Promise<Photo[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('place_id', placeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[fetchPhotos] Error leyendo fotos:', error.message, error.details);
    return [];
  }
  if (!data) return [];
  return data.map(rowToPhoto);
}

export async function fetchAdminPhotos(placeId: string): Promise<Photo[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('place_id', placeId)
    .eq('type', 'admin')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[fetchAdminPhotos] Error leyendo fotos admin:', error.message, error.details);
    return [];
  }
  if (!data) return [];
  return data.map(rowToPhoto);
}

export async function fetchUserPhotos(placeId: string): Promise<Photo[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('place_id', placeId)
    .eq('type', 'user')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[fetchUserPhotos] Error leyendo fotos de usuarios:', error.message, error.details);
    return [];
  }
  if (!data) return [];
  return data.map(rowToPhoto);
}

export async function insertPhoto(
  placeId: string,
  url: string,
  thumbnailUrl: string | null,
  authorName: string,
  userId: string | null,
  type: 'admin' | 'user' = 'user'
): Promise<Photo | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('photos')
    .insert({
      place_id: placeId,
      url,
      thumbnail_url: thumbnailUrl,
      author_name: authorName,
      user_id: userId,
      type,
    })
    .select()
    .single();

  if (error) {
    console.error('[insertPhoto] Error insertando foto:', error.message, error.details, error.hint);
    console.error('[insertPhoto] Asegúrate de que la tabla "photos" existe. Ejecuta lib/supabase/schema-full.sql en SQL Editor.');
    return null;
  }
  if (!data) return null;
  return rowToPhoto(data as PhotoRow);
}

export async function deletePhoto(id: string, userId: string): Promise<boolean> {
  const supabase = createClient();

  const { data: photo } = await supabase
    .from('photos')
    .select('url')
    .eq('id', id)
    .single();

  if (photo) {
    const urlParts = photo.url.split('/');
    const bucketIndex = urlParts.indexOf(BUCKET_NAME);
    if (bucketIndex !== -1) {
      const filePath = urlParts.slice(bucketIndex + 1).join('/');
      await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    }
  }

  const { error } = await supabase
    .from('photos')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  return !error;
}

export async function adminDeletePhoto(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/photos?id=${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.error('Error eliminando foto:', err);
    return false;
  }
}

export async function fetchAllPhotos(
  limit: number = 50,
  offset: number = 0
): Promise<Photo[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('type', 'user')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) return [];
  return data.map(rowToPhoto);
}

export async function fetchAllPhotosCount(): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('photos')
    .select('*', { count: 'exact', head: true });

  if (error || count === null) return 0;
  return count;
}

export async function fetchUserPhotosCount(): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('photos')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'user');

  if (error || count === null) return 0;
  return count;
}
