'use client';

import ListCard from '@/components/mobile/home/ListCard';
import SectionHeader from '@/components/mobile/home/SectionHeader';
import EmptyState from '@/components/mobile/home/EmptyState';

// Mock data - will be replaced with real recommendations later
const mockRecommendations = [
  {
    id: '1',
    title: 'پادکست‌های خواب‌آور',
    description: 'پادکست‌هایی برای آرامش قبل از خواب',
    coverImage: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=200&fit=crop',
    badge: 'new' as const,
    likes: 45,
    saves: 23,
    itemCount: 8,
  },
  {
    id: '2',
    title: 'کتاب‌های توسعه فردی',
    description: 'بهترین کتاب‌ها برای رشد شخصی',
    coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=200&fit=crop',
    badge: 'featured' as const,
    likes: 120,
    saves: 67,
    itemCount: 15,
  },
  {
    id: '3',
    title: 'فیلم‌های قبل خواب',
    description: 'فیلم‌های آرامش‌بخش برای شب',
    coverImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=200&fit=crop',
    likes: 89,
    saves: 34,
    itemCount: 12,
  },
];

export default function RecommendationSection() {
  const hasRecommendations = mockRecommendations.length > 0;

  return (
    <section className="mb-8">
      <SectionHeader title="برای شما" href="/lists" />
      {hasRecommendations ? (
        <div className="flex gap-4 px-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          {mockRecommendations.map((item) => (
            <div key={item.id} className="flex-shrink-0 w-72 snap-start">
              <ListCard {...item} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="🎯"
          title="بیایید علایقتان را بشناسیم"
          description="چند لیست را بوکمارک کنید تا پیشنهادهای شخصی‌سازی شده دریافت کنید"
          buttonText="کاوش کنید"
          buttonHref="/lists"
        />
      )}
    </section>
  );
}
