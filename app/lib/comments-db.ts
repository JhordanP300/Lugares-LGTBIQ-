import { createClient } from '@/lib/supabase/client';

export interface Comment {
  id: string;
  placeId: string;
  userId: string | null;
  author: string;
  text: string;
  rating: number;
  date: string;
}

interface CommentRow {
  id: string;
  place_id: string;
  user_id: string | null;
  author_name: string | null;
  text: string;
  rating: number | null;
  created_at: string;
}

function rowToComment(row: CommentRow): Comment {
  return {
    id: row.id,
    placeId: row.place_id,
    userId: row.user_id,
    author: row.author_name ?? 'Anónimo',
    text: row.text,
    rating: row.rating ?? 5,
    date: row.created_at.split('T')[0],
  };
}

export async function fetchComments(placeId: string): Promise<Comment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('place_id', placeId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map(rowToComment);
}

export async function insertComment(
  placeId: string,
  authorName: string,
  userId: string | null,
  text: string,
  rating: number
): Promise<Comment | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('comments')
    .insert({
      place_id: placeId,
      author_name: authorName,
      user_id: userId,
      text,
      rating,
    })
    .select()
    .single();

  if (error || !data) return null;
  return rowToComment(data as CommentRow);
}

export async function deleteComment(id: string, userId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  return !error;
}
