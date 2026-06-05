import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 });
  }

  // Verify the user is authenticated by reading cookies
  const serverClient = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {},
    },
  });

  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Parse the request body
  const body = await request.json();
  const { user_id, title, message, type, related_place_id } = body;

  if (!user_id || !title || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Use admin client (service role) to bypass RLS
  const adminClient = createAdminClient();
  if (!adminClient) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY not configured. Add it to .env.local' },
      { status: 500 }
    );
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
