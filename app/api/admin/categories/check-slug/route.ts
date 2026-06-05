import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import {
  buildSlugCandidates,
  isValidCategorySlug,
} from '@/lib/admin/category-slug';

/**
 * GET ?slug=movies&excludeId=optional
 * بررسی در دسترس بودن slug + پیشنهاد جایگزین
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

    if (!isValidCategorySlug(slug)) {
      return NextResponse.json({
        available: false,
        valid: false,
        error: 'فرمت slug نامعتبر است',
      });
    }

    const existing = await prisma.categories.findFirst({
      where: {
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true, name: true },
    });

    if (!existing) {
      return NextResponse.json({ available: true, valid: true, slug });
    }

    const candidates = buildSlugCandidates(slug, 15);
    let suggestion: string | null = null;

    for (const candidate of candidates.slice(1)) {
      const taken = await prisma.categories.findFirst({
        where: {
          slug: candidate,
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
      existingName: existing.name,
      suggestion,
    });
  } catch (error: unknown) {
    console.error('check-slug error:', error);
    return NextResponse.json({ error: 'خطا در بررسی slug' }, { status: 500 });
  }
}
