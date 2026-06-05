import { createClient } from '@/lib/supabase/client';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'place_approved' | 'place_rejected' | 'system';
  read: boolean;
  relatedPlaceId: string | null;
  createdAt: string;
}

interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  related_place_id: string | null;
  created_at: string;
}

function rowToNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    type: row.type as Notification['type'],
    read: row.read,
    relatedPlaceId: row.related_place_id,
    createdAt: row.created_at,
  };
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: Notification['type'] = 'system',
  relatedPlaceId?: string
): Promise<Notification | null> {
  try {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        title,
        message,
        type,
        related_place_id: relatedPlaceId || null,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error('Error creando notificación:', errData.error || res.statusText);
      return null;
    }

    const json = await res.json();
    return rowToNotification(json.data as NotificationRow);
  } catch (err) {
    console.error('Error creando notificación (network):', err);
    return null;
  }
}

export async function fetchUserNotifications(
  userId: string
): Promise<Notification[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error.message, error.details, error.hint);
    return [];
  }
  if (!data) return [];
  return data.map(rowToNotification);
}

export async function fetchUnreadCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error || count === null) return 0;
  return count;
}

export async function markAsRead(notificationId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  return !error;
}

export async function markAllAsRead(userId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  return !error;
}

export async function deleteNotification(
  notificationId: string
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  return !error;
}
