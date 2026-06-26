import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enrichPersonFromTmdbByName } from '@/lib/person-enrich/tmdb-person';
import { getPersonProfile, upsertPersonProfile } from '@/lib/person-profiles-server';
import { isPersonRole } from '@/lib/people';
import { resolvePersonPage } from '@/lib/people-server';

type RouteParams = { role: string; slug: string };

/** POST /api/admin/people/[role]/[slug]/enrich — TMDB برای director/actor */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    await requireAdmin();
    const { role: roleRaw, slug } = await params;
    if (!isPersonRole(roleRaw)) {
      return NextResponse.json({ success: false, error: 'نقش نامعتبر' }, { status: 400 });
    }

    if (roleRaw !== 'director' && roleRaw !== 'actor') {
      return NextResponse.json(
        { success: false, error: 'تکمیل از وب فقط برای کارگردان و بازیگر پشتیبانی می‌شود' },
        { status: 400 }
      );
    }

    const existing = await getPersonProfile(prisma, roleRaw, slug);
    const pageData = await resolvePersonPage(prisma, roleRaw, slug);
    const searchName = existing?.displayName ?? pageData?.displayName ?? slug.replace(/-/g, ' ');

    const enriched = await enrichPersonFromTmdbByName(searchName);

    const profile = await upsertPersonProfile(prisma, {
      role: roleRaw,
      slug,
      displayName: enriched.displayName,
      bio: enriched.bio,
      imageUrl: enriched.imageUrl,
      tmdbId: enriched.tmdbId,
      externalUrl: enriched.externalUrl,
      status: existing?.status ?? 'published',
    });

    return NextResponse.json({ success: true, data: profile });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در تکمیل از TMDB';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
