import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { isPersonRole } from '@/lib/people';
import { mergeDiscoveredPeopleByAdminDefault } from '@/lib/person-merge-server';

/** POST /api/admin/people/merge — ادغام دستی نام‌های مشابه پس از تایید ادمین */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();

    const roleRaw = typeof body.role === 'string' ? body.role : '';
    if (!isPersonRole(roleRaw)) {
      return NextResponse.json({ success: false, error: 'نقش نامعتبر' }, { status: 400 });
    }

    const canonicalSlug = typeof body.canonicalSlug === 'string' ? body.canonicalSlug.trim() : '';
    const canonicalDisplayName =
      typeof body.canonicalDisplayName === 'string' ? body.canonicalDisplayName.trim() : '';
    if (!canonicalSlug || !canonicalDisplayName) {
      return NextResponse.json(
        { success: false, error: 'slug و نام canonical الزامی است' },
        { status: 400 }
      );
    }

    const aliasesRaw = Array.isArray(body.aliases) ? body.aliases : [];
    const aliases = aliasesRaw
      .map((entry: unknown) => {
        if (entry == null || typeof entry !== 'object') return null;
        const row = entry as Record<string, unknown>;
        const slug = typeof row.slug === 'string' ? row.slug.trim() : '';
        const displayName = typeof row.displayName === 'string' ? row.displayName.trim() : '';
        if (!slug || !displayName) return null;
        return { slug, displayName };
      })
      .filter(Boolean) as Array<{ slug: string; displayName: string }>;

    const result = await mergeDiscoveredPeopleByAdminDefault({
      role: roleRaw,
      canonicalSlug,
      canonicalDisplayName,
      aliases,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در ادغام';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
