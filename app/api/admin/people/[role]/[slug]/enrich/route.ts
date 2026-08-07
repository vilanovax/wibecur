import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enrichPersonFromTmdbByName } from '@/lib/person-enrich/tmdb-person';
import { getPersonProfileFlexible, upsertPersonProfile } from '@/lib/person-profiles-server';
import { uploadPersonImageToStorage } from '@/lib/person-image-storage';
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

    const pageData = await resolvePersonPage(prisma, roleRaw, slug, { forAdmin: true });
    const displayNameGuess = pageData?.displayName ?? slug.replace(/-/g, ' ');
    const existing = await getPersonProfileFlexible(prisma, roleRaw, slug, displayNameGuess);
    const searchName = existing?.displayName ?? displayNameGuess;

    const enriched = await enrichPersonFromTmdbByName(searchName, {
      slug,
      externalUrl: existing?.externalUrl ?? null,
    });

    let imageUrl = enriched.imageUrl;
    if (imageUrl) {
      const stored = await uploadPersonImageToStorage(imageUrl);
      if (stored.ok) imageUrl = stored.url;
    }

    const profile = await upsertPersonProfile(prisma, {
      role: roleRaw,
      slug,
      displayName: enriched.displayName,
      bio: enriched.bio,
      imageUrl,
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
