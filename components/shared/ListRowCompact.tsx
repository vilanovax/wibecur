'use client';

import Link from 'next/link';
import ListCoverImage from '@/components/shared/ListCoverImage';
import ListCardStats from '@/components/shared/ListCardStats';

export type ListRowCompactList = {
  id: string;
  title: string;
  slug: string;
  coverImage?: string | null;
  saveCount?: number;
  itemCount?: number;
  creator?: { name?: string | null } | null;
  categories?: { icon?: string | null; slug?: string | null } | null;
};

type ListRowCompactProps = {
  list: ListRowCompactList;
  /** مربع برای ردیف‌های فشرده | پوستر برای فیلم/سریال */
  thumb?: 'square' | 'poster';
  showCreator?: boolean;
  showStats?: boolean;
  /** نمایش تعداد ذخیره — پیش‌فرض true؛ در صفحات دسته‌بندی false */
  showSaveCount?: boolean;
  className?: string;
};

const thumbClass: Record<NonNullable<ListRowCompactProps['thumb']>, string> = {
  square: 'h-16 w-16 rounded-md lg:h-[4.5rem] lg:w-[4.5rem]',
  poster: 'h-[4.5rem] w-14 rounded-lg lg:h-[6.5rem] lg:w-[4.5rem]',
};

/** ردیف فشرده لیست — برای سکشن‌های sparse (لیست‌های جدید، هاب و …) */
export default function ListRowCompact({
  list,
  thumb = 'square',
  showCreator = true,
  showStats = true,
  showSaveCount = true,
  className = '',
}: ListRowCompactProps) {
  const saveCount = list.saveCount ?? 0;
  const itemCount = list.itemCount ?? 0;
  const categorySlug = list.categories?.slug ?? null;
  const fallbackIcon = list.categories?.icon ?? '📋';

  return (
    <Link
      href={`/lists/${list.slug}`}
      className={`flex gap-3 rounded-xl border border-wibe bg-wibe-card p-3 shadow-sm transition-colors active:scale-[0.99] lg:rounded-2xl lg:p-4 lg:hover:border-primary/20 lg:hover:shadow-md ${className}`}
    >
      <div className={`relative shrink-0 overflow-hidden bg-gray-200 ${thumbClass[thumb]}`}>
        <ListCoverImage
          coverImage={list.coverImage}
          title={list.title}
          slug={list.slug}
          categorySlug={categorySlug}
          sizes="72px"
          className="h-full w-full object-cover"
          fallbackIcon={fallbackIcon}
          fallbackClassName="flex h-full w-full items-center justify-center bg-gray-200 text-xl opacity-50"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <h3 className="line-clamp-2 wibe-small font-semibold text-foreground lg:text-[15px]">
          {list.title}
        </h3>
        {showCreator ? (
          <p className="mt-0.5 wibe-caption text-wibe-secondary lg:mt-1">
            {list.creator?.name || 'کیوریتور'}
          </p>
        ) : null}
        {showStats ? (
          <ListCardStats
            saves={saveCount}
            itemCount={itemCount}
            variant={showSaveCount ? 'compact' : 'items-only'}
            className="mt-1"
          />
        ) : null}
      </div>
    </Link>
  );
}
