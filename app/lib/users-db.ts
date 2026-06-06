import { createClient } from '@/lib/supabase/client';

export interface UserProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  role: 'user' | 'admin';
  created_at: string;
}

interface UserRow {
  id: string;
  name: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

function rowToUser(row: UserRow): UserProfile {
  return {
    id: row.id,
    name: row.name,
    avatar_url: row.avatar_url,
    role: row.role as UserProfile['role'],
    created_at: row.created_at,
  };
}

export async function fetchAllUsers(): Promise<UserProfile[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map(rowToUser);
}

export async function fetchUserById(userId: string): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return rowToUser(data as UserRow);
}

export async function updateUserRole(
  userId: string,
  role: 'user' | 'admin'
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateRole', userId, role }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error || 'Error del servidor' };
    }
    return { success: true };
  } catch (err) {
    console.error('Error actualizando rol:', err);
    return { success: false, error: 'Error de conexión' };
  }
}

export async function adminDeleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteUser', userId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error || 'Error del servidor' };
    }
    return { success: true };
  } catch (err) {
    console.error('Error eliminando usuario:', err);
    return { success: false, error: 'Error de conexión' };
  }
}

export async function getUserStats(): Promise<{
  total: number;
  admins: number;
  users: number;
}> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('users')
    .select('role');

  if (error || !data) return { total: 0, admins: 0, users: 0 };

  return {
    total: data.length,
    admins: data.filter((u) => u.role === 'admin').length,
    users: data.filter((u) => u.role === 'user').length,
  };
}
