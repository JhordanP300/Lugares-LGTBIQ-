import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 });
  }

  // Verify admin is authenticated
  const serverClient = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll() {},
    },
  });

  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY not configured. Add it to .env.local' },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { action, userId, role } = body;

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  if (action === 'updateRole') {
    if (!role || !['user', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const { error } = await adminClient
      .from('users')
      .update({ role })
      .eq('id', userId);

    if (error) {
      console.error('API: Error actualizando rol:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  if (action === 'deleteUser') {
    // 1. Delete comments
    await adminClient.from('comments').delete().eq('user_id', userId);

    // 2. Delete photos + storage files
    const { data: photos } = await adminClient
      .from('photos')
      .select('id, url')
      .eq('user_id', userId);
    if (photos && photos.length > 0) {
      for (const photo of photos) {
        const urlParts = photo.url.split('/');
        const bucketIndex = urlParts.indexOf('place-media');
        if (bucketIndex !== -1) {
          const filePath = urlParts.slice(bucketIndex + 1).join('/');
          await adminClient.storage.from('place-media').remove([filePath]);
        }
      }
      await adminClient.from('photos').delete().eq('user_id', userId);
    }

    // 3. Delete place_requests
    await adminClient.from('place_requests').delete().eq('user_id', userId);

    // 4. Delete notifications
    await adminClient.from('notifications').delete().eq('user_id', userId);

    // 5. Delete from public users table
    await adminClient.from('users').delete().eq('id', userId);

    // 6. Delete from auth.users (Supabase Auth)
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
    if (authError) {
      console.error('API: Error eliminando de auth.users:', authError.message);
      // Continue even if auth deletion fails - main data is deleted
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
