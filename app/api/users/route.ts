import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@supabase/ssr';

const COOKIE_OPTIONS = { path: '/', httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production' };

function withCookies(body: unknown, status: number, pendingCookies: { name: string; value: string; options: Record<string, unknown> }[]) {
  const res = NextResponse.json(body, { status });
  pendingCookies.forEach(({ name, value, options }) => {
    res.cookies.set(name, value, options);
  });
  return res;
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 });
  }

  const pendingCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const serverClient = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          pendingCookies.push({ name, value, options: options ?? COOKIE_OPTIONS });
        });
      },
    },
  });

  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) {
    return withCookies({ error: 'Not authenticated' }, 401, pendingCookies);
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    return withCookies({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured.' }, 500, pendingCookies);
  }

  const { data: profile } = await adminClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return withCookies({ error: 'Not authorized' }, 403, pendingCookies);
  }

  const body = await request.json();
  const { action, userId, role } = body;

  if (!userId) {
    return withCookies({ error: 'Missing userId' }, 400, pendingCookies);
  }

  if (action === 'updateRole') {
    if (!role || !['user', 'admin'].includes(role)) {
      return withCookies({ error: 'Invalid role' }, 400, pendingCookies);
    }

    const { error } = await adminClient
      .from('users')
      .update({ role })
      .eq('id', userId);

    if (error) {
      console.error('API: Error actualizando rol:', error.message);
      return withCookies({ error: error.message }, 500, pendingCookies);
    }

    return withCookies({ success: true }, 200, pendingCookies);
  }

  if (action === 'deleteUser') {
    await adminClient.from('notifications').delete().eq('user_id', userId);
    await adminClient.from('place_requests').delete().eq('user_id', userId);
    await adminClient.from('users').delete().eq('id', userId);

    const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
    if (authError) {
      console.error('API: Error eliminando de auth.users:', authError.message);
    }

    return withCookies({ success: true }, 200, pendingCookies);
  }

  return withCookies({ error: 'Invalid action' }, 400, pendingCookies);
}
