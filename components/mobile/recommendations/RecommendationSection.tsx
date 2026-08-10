'use client';

import ListCard from '@/components/mobile/home/ListCard';
import EmptyState from '@/components/mobile/home/EmptyState';
import { useHomeData } from '@/contexts/HomeDataContext';

export default function RecommendationSection() {
  const { data, isLoading } = useHomeData();
  const lists = data?.recommendations ?? [];
  const hasRecommendations = lists.length > 0;

  if (isLoading && !hasRecommendations) {
    return (
      <section className="mb-8">
        <div className="px-4 mb-3">
          <div className="h-6 w-40 bg-wibe-surface rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-3 px-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl h-40 bg-wibe-surface animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="px-4 mb-3">
        <h2 className="text-lg font-bold text-foreground">برای تو ✨</h2>
        <p className="text-wibe-secondary text-sm mt-0.5">بر اساس ذخیره‌های اخیرت</p>
      </div>
      {hasRecommendations ? (
        <div className="grid grid-cols-2 gap-3 px-4">
          {lists.map((list, idx) => (
            <ListCard
              key={list.id}
              id={list.id}
              title={list.title}
              description={list.description}
              coverImage={list.coverImage}
              slug={list.slug}
              likes={list.likes}
              saves={list.saveCount}
              itemCount={list.itemCount}
              badge={list.badge}
              priority={idx < 2}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="✨"
          title="هنوز چیزی ذخیره نکردی"
          description="چند لیست انتخاب کن تا وایبت را بشناسیم"
          buttonText="دیدن لیست‌های پیشنهادی"
          buttonHref="/lists"
        />
      )}
    </section>
  );
}
