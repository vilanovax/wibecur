'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import CategorySectionTitle from './CategorySectionTitle';
import type { CategoryListCard } from '@/types/category-page';

interface TrendingListsSectionProps {
  title: string;
  subtitle?: string;
  lists: CategoryListCard[];
  categoryName: string;
  accentColor?: string;
  improved?: boolean;
}

export default function TrendingListsSection({
  title,
  subtitle,
  lists,
  accentColor = '#6366F1',
  improved = false,
}: TrendingListsSectionProps) {
  if (lists.length === 0) return null;

  return (
    <section className="px-4 py-6">
      <CategorySectionTitle title={title} subtitle={subtitle} icon="🔥" />
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
        {lists.map((list, index) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex-shrink-0 w-[75vw] max-w-[280px] snap-start active:scale-[0.99] transition-transform"
          >
            <div className="rounded-lg overflow-hidden bg-wibe-card border border-wibe shadow-card">
              <div className="relative aspect-[4/3] bg-gray-200">
                {list.coverImage ? (
                  <ImageWithFallback
                    src={list.coverImage}
                    alt={list.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-4xl opacity-40 bg-gray-200"
                    style={{ color: accentColor }}
                  >
                    📋
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {(index < 3 || list.badge === 'viral' || list.badge === 'hot') && (
                  <span className="absolute top-2 right-2 wibe-caption font-semibold text-white px-2 py-0.5 rounded-pill bg-warning">
                    ترند
                  </span>
                )}
                {improved && list.cityTag && (
                  <span className="absolute bottom-2 right-2 wibe-caption text-white/95 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm">
                    {list.cityTag}
                  </span>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  <ListCardStats saves={list.saveCount} itemCount={list.itemCount} variant="overlay" />
                </div>
              </div>
              <div className="p-3">
                {improved && list.creator && (
                  <div className="flex items-center gap-2 mb-1.5">
                    {list.creator.image ? (
                      <ImageWithFallback
                        src={list.creator.image}
                        alt={list.creator.name || ''}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center wibe-caption flex-shrink-0">
                        {(list.creator.name || '?')[0]}
                      </div>
                    )}
                    <span className="wibe-caption text-wibe-secondary truncate">
                      {list.creator.name || 'کاربر'}
                    </span>
                  </div>
                )}
                <h3 className="wibe-small font-semibold text-foreground line-clamp-2">{list.title}</h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
