import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { notFound } from 'next/navigation';

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categories = ['movies', 'books', 'cafe', 'car', 'podcast', 'lifestyle'];
  
  if (!categories.includes(slug)) {
    notFound();
  }

  const categoryNames: Record<string, string> = {
    movies: 'فیلم و سریال',
    books: 'کتاب',
    cafe: 'کافه و رستوران',
    car: 'ماشین و تکنولوژی',
    podcast: 'پادکست',
    lifestyle: 'لایف‌استایل',
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title={categoryNames[slug]} />
      <main className="px-4 py-6">
        <p className="text-gray-600">
          لیست‌های دسته‌بندی {categoryNames[slug]} - در حال توسعه
        </p>
      </main>
      <BottomNav />
    </div>
  );
}

