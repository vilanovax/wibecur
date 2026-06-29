'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import CategorySectionTitle from './CategorySectionTitle';
import { CATEGORY_SECTION } from '@/lib/category-layout';
import type { CategoryListCard } from '@/types/category-page';

interface TrendingListsSectionProps {
  title: string;
  subtitle?: string;
  lists: CategoryListCard[];
  categoryName: string;
  categorySlug?: string;
  accentColor?: string;
  /** بدون padding افقی — داخل شِل صفحه */
  inset?: boolean;
}

function TrendingListCard({
  list,
  index,
  accentColor,
}: {
  list: CategoryListCard;
  index: number;
  accentColor: string;
}) {
  const showTrendBadge = index < 3 || list.badge === 'viral' || list.badge === 'hot';

  return (
    <Link
      href={`/lists/${list.slug}`}
      className="group block active:scale-[0.99] transition-transform lg:hover:-translate-y-0.5"
    >
      <div className="overflow-hidden rounded-xl border border-wibe bg-wibe-card shadow-card lg:rounded-2xl lg:transition-shadow lg:group-hover:shadow-md">
        <div className="relative aspect-[4/3] bg-gray-200">
          {list.coverImage ? (
            <ImageWithFallback
              src={list.coverImage}
              alt={list.title}
              className="h-full w-full object-cover lg:transition-transform lg:duration-300 lg:group-hover:scale-[1.03]"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center bg-gray-200 text-4xl opacity-40"
              style={{ color: accentColor }}
            >
              📋
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
          {showTrendBadge && (
            <span className="absolute right-2 top-2 rounded-pill bg-warning px-2 py-0.5 wibe-caption font-semibold text-white">
              ترند
            </span>
          )}
          {list.cityTag && (
            <span className="absolute bottom-2 right-2 rounded-md bg-black/40 px-2 py-0.5 wibe-caption text-white/95 backdrop-blur-sm">
              {list.cityTag}
            </span>
          )}
        </div>
        <div className="p-3">
          <h3 className="line-clamp-2 wibe-small font-semibold text-foreground">{list.title}</h3>
        </div>
      </div>
    </Link>
  );
}

export default function TrendingListsSection({
  title,
  subtitle,
  lists,
  categorySlug,
  accentColor = '#6366F1',
  inset = false,
}: TrendingListsSectionProps) {
  if (lists.length === 0) return null;

  const visible = lists.slice(0, 8);
  const sectionClass = `${CATEGORY_SECTION} ${inset ? '' : 'px-4'}`;

  return (
    <section className={sectionClass}>
      <div className="mb-3 flex items-end justify-between gap-3 lg:mb-4">
        <CategorySectionTitle title={title} subtitle={subtitle} iconVariant="trending" className="mb-0" />
        {categorySlug && (
          <Link
            href={`/lists?category=${categorySlug}`}
            className="shrink-0 pb-0.5 wibe-small font-medium text-primary hover:text-primary-dark"
          >
            مشاهده همه
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {visible.map((list, index) => (
          <TrendingListCard key={list.id} list={list} index={index} accentColor={accentColor} />
        ))}
      </div>
    </section>
  );
}
