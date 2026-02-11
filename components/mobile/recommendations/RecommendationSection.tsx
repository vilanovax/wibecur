'use client';

import ListCard from '@/components/mobile/home/ListCard';
import EmptyState from '@/components/mobile/home/EmptyState';

const mockRecommendations = [
  {
    id: '1',
    title: 'کتاب‌های خواب‌آور',
    description: 'برای آرام شدن قبل از خواب',
    coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=200&fit=crop',
    likes: 67,
    saves: 120,
    itemCount: 8,
  },
  {
    id: '2',
    title: 'پادکست‌های آرامش‌بخش',
    description: 'قبل از خواب یا زمان استراحت',
    coverImage: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=200&fit=crop',
    likes: 23,
    saves: 45,
    itemCount: 12,
  },
];

export default function RecommendationSection() {
  const hasRecommendations = mockRecommendations.length > 0;

  return (
    <section className="mb-8">
      <div className="px-4 mb-3">
        <h2 className="text-lg font-bold text-gray-900">برای تو ✨</h2>
        <p className="text-gray-500 text-sm mt-0.5">بر اساس ذخیره‌های اخیرت</p>
      </div>
      {hasRecommendations ? (
        <div className="grid grid-cols-2 gap-3 px-4">
          {mockRecommendations.map((item) => (
            <div key={item.id}>
              <ListCard {...item} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="✨"
          title="هنوز چیزی ذخیره نکردی 🙂"
          description="چند تا لیست انتخاب کن تا وایبت رو بشناسیم"
          buttonText="دیدن لیست‌های پیشنهادی"
          buttonHref="/lists"
        />
      )}
    </section>
  );
}
