import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { discoverPeopleFromItems } from '@/lib/person-profiles-server';
import { isPersonRole } from '@/lib/people';
import { findSimilarPersonGroups } from '@/lib/person-name-similarity';

/** GET /api/admin/people/similar-names?role=&minScore=0.84 */
export async function GET(request: NextRequest) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roleRaw = searchParams.get('role');
    const role = roleRaw && isPersonRole(roleRaw) ? roleRaw : undefined;
    const minScore = Math.min(
      Math.max(Number(searchParams.get('minScore') ?? 0.84) || 0.84, 0.7),
      0.99
    );

    const { people } = await discoverPeopleFromItems(undefined, {
      role,
      skipPagination: true,
    });

    const groups = findSimilarPersonGroups(
      people.map((person) => ({
        role: person.role,
        slug: person.slug,
        displayName: person.displayName,
        itemCount: person.itemCount,
        hasBio: person.hasBio,
      })),
      { minScore }
    );

    return NextResponse.json({
      success: true,
      data: {
        count: groups.length,
        groups,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در یافتن نام‌های مشابه';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
