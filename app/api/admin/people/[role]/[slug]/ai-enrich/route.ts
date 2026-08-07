import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkActionRateLimit } from '@/lib/rate-limit';
import { isPersonRole } from '@/lib/people';
import { resolvePersonPage } from '@/lib/people-server';
import { getPersonProfileFlexible, upsertPersonProfile } from '@/lib/person-profiles-server';
import {
  formatPersonBioAiError,
  generatePersonBioWithAi,
  personBioAiErrorStatus,
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

    const pageData = await resolvePersonPage(prisma, roleRaw, slug, { forAdmin: true });
    const displayName = pageData?.displayName ?? slug.replace(/-/g, ' ');
    const existing = await getPersonProfileFlexible(
      prisma,
      roleRaw,
      slug,
      displayName
    );
    const itemCount = pageData?.items.length ?? 0;
    const sampleTitles = pageData?.items.map((i) => i.title).filter(Boolean) ?? [];

    if (!displayName.trim()) {
      return NextResponse.json(
        { success: false, error: 'نام شخص برای تولید bio پیدا نشد' },
        { status: 400 }
      );
    }

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
    console.error('[person-ai-enrich]', error);
    const message = formatPersonBioAiError(error);
    const status = personBioAiErrorStatus(message);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
