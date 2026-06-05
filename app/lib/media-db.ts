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
    console.error('Upload error:', error);
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

  if (error || !data) return [];
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

  if (error || !data) return null;
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
