import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import CategoryPage2Client from '@/components/category/CategoryPage2Client';

export const revalidate = 60; // ISR

const FILM_SLUG_ALIASES = ['movie', 'movies', 'film'];
const BOOK_SLUG_ALIASES = ['book', 'books'];

function resolveCategorySlug(slug: string): string[] {
  if (FILM_SLUG_ALIASES.includes(slug)) return FILM_SLUG_ALIASES;
  if (BOOK_SLUG_ALIASES.includes(slug)) return BOOK_SLUG_ALIASES;
  return [];
}

function isDbError(e: unknown): boolean {
  const err = e as Error & { code?: string };
  const msg = String(err?.message ?? '');
  return (
    err?.code === 'P1001' ||
    msg.includes("Can't reach database") ||
    msg.includes('Invalid value undefined for datasource') ||
    msg.includes('PrismaClient')
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    let category = await dbQuery(() =>
      prisma.categories.findUnique({
        where: { slug, isActive: true },
        select: { name: true },
      })
    );
    const aliases = resolveCategorySlug(slug);
    if (!category && aliases.length > 0) {
      category = await dbQuery(() =>
        prisma.categories.findFirst({
          where: { slug: { in: aliases }, isActive: true },
          select: { name: true },
        })
      );
    }
    if (!category) return { title: 'دسته‌بندی یافت نشد' };
    return {
      title: `لیست‌های ${category.name}`,
      description: `کشف بهترین لیست‌های کیوریتد در دسته ${category.name}`,
    };
  } catch (e) {
    if (isDbError(e)) return { title: 'دسته‌بندی یافت نشد' };
    throw e;
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let category: { id: string; name: string; slug: string; layoutType: string | null } | null = null;
  try {
    category = await dbQuery(() =>
      prisma.categories.findUnique({
        where: { slug, isActive: true },
        select: { id: true, name: true, slug: true, layoutType: true },
      })
    );
    const aliases = resolveCategorySlug(slug);
    if (!category && aliases.length > 0) {
      category = await dbQuery(() =>
        prisma.categories.findFirst({
          where: { slug: { in: aliases }, isActive: true },
          select: { id: true, name: true, slug: true, layoutType: true },
        })
      );
    }
  } catch (e) {
    if (isDbError(e) || process.env.NODE_ENV === 'development') {
      notFound();
    }
    throw e;
  }

  if (!category) {
    notFound();
  }

  return (
    <div className="min-h-screen pb-20 bg-wibe-surface">
      <Header title={category.name} showBack />
      <CategoryPage2Client slug={category.slug} />
      <BottomNav />
    </div>
  );
}

