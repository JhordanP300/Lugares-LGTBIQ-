import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@supabase/ssr';

const COOKIE_OPTIONS = { path: '/', httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production' };

function withCookies(body: unknown, status: number, pending: { name: string; value: string; options: Record<string, unknown> }[]) {
  const res = NextResponse.json(body, { status });
  pending.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
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

  const body = await request.json();
  const { user_id, title, message, type, related_place_id } = body;

  if (!user_id || !title || !message) {
    return withCookies({ error: 'Missing required fields' }, 400, pendingCookies);
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    return withCookies({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured.' }, 500, pendingCookies);
  }

  const { data, error } = await adminClient
    .from('notifications')
    .insert({
      user_id,
      title,
      message,
      type: type || 'system',
      related_place_id: related_place_id || null,
    })
    .select()
    .single();

  if (error) {
    console.error('API: Error creando notificación:', error.message, error.details, error.hint);
    return withCookies({ error: error.message }, 500, pendingCookies);
  }

  return withCookies({ data }, 200, pendingCookies);
}
