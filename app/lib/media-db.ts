import { createClient } from '@/lib/supabase/client';

export interface Photo {
  id: string;
  placeId: string;
  userId: string | null;
  url: string;
  thumbnailUrl: string | null;
  author: string;
  date: string;
}

interface PhotoRow {
  id: string;
  place_id: string;
  user_id: string | null;
  url: string;
  thumbnail_url: string | null;
  author_name: string | null;
  created_at: string;
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
  };
}

const BUCKET_NAME = 'place-media';

function getFileExtension(file: File): string {
  return file.name.split('.').pop() || 'bin';
}

function isVideo(file: File): boolean {
  return file.type.startsWith('video/');
}

export async function uploadFile(
  file: File,
  placeId: string,
  userId: string
): Promise<{ url: string; thumbnailUrl: string | null } | null> {
  const supabase = createClient();
  const ext = getFileExtension(file);
  const timestamp = Date.now();
  const folder = isVideo(file) ? 'videos' : 'photos';
  const path = `${placeId}/${userId}_${timestamp}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error('[uploadFile] Error subiendo archivo a Supabase Storage:', error.message, error);
    console.error('[uploadFile] Verifica que el bucket "place-media" exista y que estés autenticado.');
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return {
    url: urlData.publicUrl,
    thumbnailUrl: isVideo(file) ? null : urlData.publicUrl,
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

export async function insertPhoto(
  placeId: string,
  url: string,
  thumbnailUrl: string | null,
  authorName: string,
  userId: string | null
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
