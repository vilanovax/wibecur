import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { buildSlugCandidates, isValidListSlug } from '@/lib/admin/list-slug';

/**
 * GET ?slug=my-list&excludeId=optional
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const slug = (searchParams.get('slug') ?? '').trim().toLowerCase();
    const excludeId = searchParams.get('excludeId')?.trim() || undefined;

    if (!slug) {
      return NextResponse.json({ available: false, error: 'slug خالی است' }, { status: 400 });
    }

    if (!isValidListSlug(slug)) {
      return NextResponse.json({
        available: false,
        valid: false,
        error: 'فرمت slug نامعتبر است',
      });
    }

    const existing = await prisma.lists.findFirst({
      where: {
        slug,
        deletedAt: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true, title: true },
    });

    if (!existing) {
      return NextResponse.json({ available: true, valid: true, slug });
    }

    const candidates = buildSlugCandidates(slug, 15);
    let suggestion: string | null = null;

    for (const candidate of candidates.slice(1)) {
      const taken = await prisma.lists.findFirst({
        where: {
          slug: candidate,
          deletedAt: null,
          ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
        select: { id: true },
      });
      if (!taken) {
        suggestion = candidate;
        break;
      }
    }

    return NextResponse.json({
      available: false,
      valid: true,
      slug,
      existingTitle: existing.title,
      suggestion,
    });
  } catch (error: unknown) {
    console.error('list check-slug error:', error);
    return NextResponse.json({ error: 'خطا در بررسی slug' }, { status: 500 });
  }
}
