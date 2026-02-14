import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import CategoryPage2Client from '@/components/category/CategoryPage2Client';

export const revalidate = 60; // ISR

const FILM_SLUG_ALIASES = ['movie', 'movies', 'film'];
const BOOK_SLUG_ALIASES = ['book', 'books'];

function resolveCategorySlug(slug: string): string[] {
  if (FILM_SLUG_ALIASES.includes(slug)) return FILM_SLUG_ALIASES;
  if (BOOK_SLUG_ALIASES.includes(slug)) return BOOK_SLUG_ALIASES;
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let category = await prisma.categories.findUnique({
    where: { slug, isActive: true },
    select: { name: true },
  });
  const aliases = resolveCategorySlug(slug);
  if (!category && aliases.length > 0) {
    category = await prisma.categories.findFirst({
      where: { slug: { in: aliases }, isActive: true },
      select: { name: true },
    });
  }
  if (!category) return { title: 'دسته‌بندی یافت نشد' };
  return {
    title: `لیست‌های ${category.name}`,
    description: `کشف بهترین لیست‌های کیوریتد در دسته ${category.name}`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let category = await prisma.categories.findUnique({
    where: { slug, isActive: true },
    select: { id: true, name: true, slug: true, layoutType: true },
  });

  const aliases = resolveCategorySlug(slug);
  if (!category && aliases.length > 0) {
    category = await prisma.categories.findFirst({
      where: { slug: { in: aliases }, isActive: true },
      select: { id: true, name: true, slug: true, layoutType: true },
    });
  }

  if (!category) {
    notFound();
  }

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      <Header title={category.name} showBack />
      <CategoryPage2Client slug={category.slug} />
      <BottomNav />
    </div>
  );
}

