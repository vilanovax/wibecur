import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getPersonProfile,
  upsertPersonProfile,
} from '@/lib/person-profiles-server';
import type { PersonProfileStatus } from '@/lib/person-profiles';
import { isPersonRole, personPagePath } from '@/lib/people';
import { resolvePersonPage } from '@/lib/people-server';

type RouteParams = { role: string; slug: string };

function parseStatus(value: unknown): PersonProfileStatus | undefined {
  if (value === 'draft' || value === 'published') return value;
  return undefined;
}

/** GET /api/admin/people/[role]/[slug] */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    await requireAdmin();
    const { role: roleRaw, slug } = await params;
    if (!isPersonRole(roleRaw)) {
      return NextResponse.json({ success: false, error: 'نقش نامعتبر' }, { status: 400 });
    }

    const [profile, pageData] = await Promise.all([
      getPersonProfile(prisma, roleRaw, slug),
      resolvePersonPage(prisma, roleRaw, slug),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        profile,
        discovered: pageData
          ? {
              displayName: pageData.displayName,
              itemCount: pageData.items.length,
              publicPath: personPagePath(roleRaw, pageData.displayName),
            }
          : null,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در بارگذاری پروفایل';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

/** PUT /api/admin/people/[role]/[slug] */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    await requireAdmin();
    const { role: roleRaw, slug } = await params;
    if (!isPersonRole(roleRaw)) {
      return NextResponse.json({ success: false, error: 'نقش نامعتبر' }, { status: 400 });
    }

    const body = await request.json();
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
    if (!displayName) {
      return NextResponse.json({ success: false, error: 'نام نمایشی الزامی است' }, { status: 400 });
    }

    const profile = await upsertPersonProfile(prisma, {
      role: roleRaw,
      slug,
      displayName,
      bio: typeof body.bio === 'string' ? body.bio : body.bio === null ? null : undefined,
      imageUrl:
        typeof body.imageUrl === 'string' ? body.imageUrl : body.imageUrl === null ? null : undefined,
      tmdbId: body.tmdbId != null ? Number(body.tmdbId) : undefined,
      externalUrl:
        typeof body.externalUrl === 'string'
          ? body.externalUrl
          : body.externalUrl === null
            ? null
            : undefined,
      status: parseStatus(body.status),
    });

    return NextResponse.json({ success: true, data: profile });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در ذخیره پروفایل';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
