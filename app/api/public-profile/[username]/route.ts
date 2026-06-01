import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { fetchPublicProfile } from '@/lib/public-profile-server';

// GET /api/public-profile/[username] — پروفایل عمومی کریتور (بدون نیاز به لاگین)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id ?? null;
    const { username } = await params;

    const data = await fetchPublicProfile(username, currentUserId);
    if (!data) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const response = NextResponse.json({ success: true, data });
    if (currentUserId) {
      response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    } else {
      response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    }
    return response;
  } catch (error: unknown) {
    console.error('Error fetching public profile:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
