import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import CategoryPage2Client from '@/components/category/CategoryPage2Client';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await prisma.categories.findUnique({
    where: { slug, isActive: true },
    select: { name: true },
  });
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

  const category = await prisma.categories.findUnique({
    where: { slug, isActive: true },
    select: { id: true, name: true, slug: true },
  });

  if (!category) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title={category.name} showBack />
      <CategoryPage2Client slug={category.slug} />
      <BottomNav />
    </div>
  );
}

