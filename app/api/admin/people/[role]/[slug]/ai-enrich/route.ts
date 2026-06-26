import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkActionRateLimit } from '@/lib/rate-limit';
import { isPersonRole } from '@/lib/people';
import { resolvePersonPage } from '@/lib/people-server';
import { getPersonProfile, upsertPersonProfile } from '@/lib/person-profiles-server';
import {
  formatPersonBioAiError,
  generatePersonBioWithAi,
} from '@/lib/person-bio-ai';

type RouteParams = { role: string; slug: string };

/** POST /api/admin/people/[role]/[slug]/ai-enrich */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const session = await requireAdmin();
    const { role: roleRaw, slug } = await params;

    if (!isPersonRole(roleRaw)) {
      return NextResponse.json({ success: false, error: 'نقش نامعتبر' }, { status: 400 });
    }

    const { success } = await checkActionRateLimit(
      `person-ai-bio:${session.user?.id ?? 'admin'}`,
      20,
      '1 m'
    );
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'درخواست‌های زیاد — کمی صبر کنید.' },
        { status: 429 }
      );
    }

    const existing = await getPersonProfile(prisma, roleRaw, slug);
    const pageData = await resolvePersonPage(prisma, roleRaw, slug);
    const displayName = existing?.displayName ?? pageData?.displayName ?? slug.replace(/-/g, ' ');
    const itemCount = pageData?.items.length ?? 0;
    const sampleTitles = pageData?.items.map((i) => i.title).filter(Boolean) ?? [];

    const { bio } = await generatePersonBioWithAi({
      displayName,
      role: roleRaw,
      itemCount,
      sampleTitles,
    });

    const profile = await upsertPersonProfile(prisma, {
      role: roleRaw,
      slug,
      displayName,
      bio,
      imageUrl: existing?.imageUrl ?? null,
      externalUrl: existing?.externalUrl ?? null,
      tmdbId: existing?.tmdbId ?? null,
      status: existing?.status ?? 'published',
    });

    return NextResponse.json({ success: true, data: profile });
  } catch (error: unknown) {
    const message = formatPersonBioAiError(error);
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
