import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import {
  validateDestinationUrl,
  type SponsoredScopeType,
  type SponsoredSurface,
} from '@/lib/sponsored-placements';

function safeJson(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(safeJson);
  if (value instanceof Date) return value.toISOString();
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as object)) {
    if (v === undefined) continue;
    out[k] = safeJson(v);
  }
  return out;
}

const VALID_SCOPES: SponsoredScopeType[] = ['CATEGORY_ALL', 'CATEGORY_SELECTED', 'LIST'];
const VALID_SURFACES: SponsoredSurface[] = [
  'LIST_BANNER',
  'LIST_SIDEBAR',
  'LIST_AFTER_SIMILAR',
  'CATEGORY_BANNER',
];

function parsePlacementBody(body: Record<string, unknown>) {
  const scopeType = body.scopeType as SponsoredScopeType;
  const surface = body.surface as SponsoredSurface;
  const headline = typeof body.headline === 'string' ? body.headline.trim() : '';
  const ctaLabel = typeof body.ctaLabel === 'string' ? body.ctaLabel.trim() : '';
  const destinationUrl = typeof body.destinationUrl === 'string' ? body.destinationUrl.trim() : '';

  if (!VALID_SCOPES.includes(scopeType)) {
    return { error: 'scopeType نامعتبر است' };
  }
  if (!VALID_SURFACES.includes(surface)) {
    return { error: 'surface نامعتبر است' };
  }
  if (!headline || !ctaLabel || !destinationUrl) {
    return { error: 'headline، ctaLabel و destinationUrl الزامی هستند' };
  }
  if (!validateDestinationUrl(destinationUrl)) {
    return { error: 'destinationUrl باید http یا https باشد' };
  }

  const categoryId = typeof body.categoryId === 'string' ? body.categoryId : null;
  const listId = typeof body.listId === 'string' ? body.listId : null;
  const listIds = Array.isArray(body.listIds)
    ? body.listIds.filter((id): id is string => typeof id === 'string')
    : [];

  if (scopeType === 'LIST' && !listId) {
    return { error: 'listId برای scope لیست الزامی است' };
  }
  if ((scopeType === 'CATEGORY_ALL' || scopeType === 'CATEGORY_SELECTED') && !categoryId) {
    return { error: 'categoryId برای scope دسته الزامی است' };
  }
  if (scopeType === 'CATEGORY_SELECTED' && listIds.length === 0) {
    return { error: 'حداقل یک listId برای CATEGORY_SELECTED انتخاب کنید' };
  }

  const startAtRaw = body.startAt;
  const startAt =
    typeof startAtRaw === 'string' || startAtRaw instanceof Date
      ? new Date(startAtRaw)
      : null;
  if (!startAt || Number.isNaN(startAt.getTime())) {
    return { error: 'startAt نامعتبر است' };
  }

  let endAt: Date | null = null;
  if (body.endAt) {
    endAt = new Date(body.endAt as string);
    if (Number.isNaN(endAt.getTime())) return { error: 'endAt نامعتبر است' };
  }

  return {
    data: {
      name: typeof body.name === 'string' ? body.name.trim() || null : null,
      scopeType,
      categoryId,
      listIds: scopeType === 'CATEGORY_SELECTED' ? listIds : [],
      listId: scopeType === 'LIST' ? listId : null,
      surface,
      headline,
      bodyText: typeof body.bodyText === 'string' ? body.bodyText.trim() || null : null,
      ctaLabel,
      destinationUrl,
      sponsorName: typeof body.sponsorName === 'string' ? body.sponsorName.trim() || null : null,
      disclosureLabel:
        typeof body.disclosureLabel === 'string' && body.disclosureLabel.trim()
          ? body.disclosureLabel.trim()
          : 'تبلیغ',
      startAt,
      endAt,
      isActive: body.isActive !== false,
      priority: typeof body.priority === 'number' ? body.priority : 0,
    },
  };
}

/** GET /api/admin/custom/sponsored */
export async function GET() {
  try {
    const userOrRes = await requirePermission('manage_lists');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const now = new Date();

    const [placements, categories, lists] = await Promise.all([
      prisma.sponsored_placement.findMany({
        orderBy: [{ isActive: 'desc' }, { startAt: 'desc' }],
        include: {
          categories: { select: { id: true, name: true, slug: true } },
          lists: { select: { id: true, title: true, slug: true } },
        },
      }),
      prisma.categories.findMany({
        where: { isActive: true, deletedAt: null },
        select: { id: true, name: true, slug: true },
        orderBy: { order: 'asc' },
      }),
      prisma.lists.findMany({
        where: { isActive: true, isPublic: true, deletedAt: null },
        select: {
          id: true,
          title: true,
          slug: true,
          categoryId: true,
          categories: { select: { name: true, slug: true } },
        },
        orderBy: { saveCount: 'desc' },
        take: 500,
      }),
    ]);

    const enriched = placements.map((p) => {
      const isLive =
        p.isActive && p.startAt <= now && (p.endAt == null || p.endAt > now);
      const isExpired = p.endAt != null && p.endAt <= now;
      return { ...p, isLive, isExpired };
    });

    return NextResponse.json(
      safeJson({ placements: enriched, categories, lists })
    );
  } catch (err: unknown) {
    console.error('Admin sponsored GET error:', err);
    return NextResponse.json({ error: 'خطا در دریافت تبلیغات' }, { status: 500 });
  }
}

/** POST /api/admin/custom/sponsored */
export async function POST(request: NextRequest) {
  try {
    const userOrRes = await requirePermission('manage_lists');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const body = await request.json();
    const parsed = parsePlacementBody(body);
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const created = await prisma.sponsored_placement.create({
      data: {
        id: nanoid(),
        ...parsed.data,
        createdById: userOrRes.id,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: safeJson(created) });
  } catch (err: unknown) {
    console.error('Admin sponsored POST error:', err);
    return NextResponse.json({ error: 'خطا در ایجاد تبلیغ' }, { status: 500 });
  }
}

export { parsePlacementBody };
