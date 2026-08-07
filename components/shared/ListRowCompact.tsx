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
  square: 'h-16 w-16 rounded-xl lg:h-[4.5rem] lg:w-[4.5rem]',
  poster: 'h-[4.75rem] w-[3.35rem] rounded-lg lg:h-[5.75rem] lg:w-16',
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
      className={`flex items-center gap-3 rounded-2xl bg-wibe-card p-2.5 pe-3 shadow-sm ring-1 ring-wibe/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 active:scale-[0.99] lg:p-3 lg:pe-4 lg:hover:ring-primary/25 lg:hover:shadow-md ${className}`}
    >
      <div className={`relative shrink-0 overflow-hidden bg-wibe-surface ${thumbClass[thumb]}`}>
        <ListCoverImage
          coverImage={list.coverImage}
          title={list.title}
          slug={list.slug}
          categorySlug={categorySlug}
          sizes="72px"
          className="h-full w-full object-cover"
          fallbackIcon={fallbackIcon}
          fallbackClassName="flex h-full w-full items-center justify-center bg-wibe-surface text-xl opacity-50"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <h3 className="line-clamp-2 wibe-small font-semibold leading-snug text-foreground">
          {list.title}
        </h3>
        {showCreator ? (
          <p className="wibe-caption text-wibe-secondary">
            {list.creator?.name || 'کیوریتور'}
          </p>
        ) : null}
        {showStats ? (
          <ListCardStats
            saves={saveCount}
            itemCount={itemCount}
            variant={showSaveCount ? 'compact' : 'items-only'}
            className="mt-0.5"
          />
        ) : null}
      </div>
    </Link>
  );
}
