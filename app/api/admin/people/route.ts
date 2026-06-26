import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { discoverPeopleFromItems } from '@/lib/person-profiles-server';
import { isPersonRole } from '@/lib/people';

/** GET /api/admin/people?role=&q=&page=&limit=&missingBio=1 */
export async function GET(request: NextRequest) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roleRaw = searchParams.get('role');
    const role = roleRaw && isPersonRole(roleRaw) ? roleRaw : undefined;
    const q = searchParams.get('q') ?? undefined;
    const page = Math.max(Number(searchParams.get('page') ?? 1) || 1, 1);
    const limit = Math.min(Number(searchParams.get('limit') ?? 50) || 50, 100);
    const missingBioOnly = searchParams.get('missingBio') === '1';

    const result = await discoverPeopleFromItems(undefined, {
      role,
      q,
      page,
      limit,
      missingBioOnly,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در بارگذاری اشخاص';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
