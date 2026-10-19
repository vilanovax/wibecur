'use client';

import Link from 'next/link';
import ListCoverImage from '@/components/shared/ListCoverImage';
import ListCardStats from '@/components/shared/ListCardStats';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
  square: 'size-16 rounded-xl lg:size-20',
  poster: 'h-20 w-14 rounded-xl lg:h-24 lg:w-16',
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
      className={cn('block transition-transform active:scale-[0.99]', className)}
    >
      <Card className="flex gap-3 bg-popover p-3 lg:p-4">
      <div className={cn('relative shrink-0 overflow-hidden bg-muted', thumbClass[thumb])}>
        <ListCoverImage
          coverImage={list.coverImage}
          title={list.title}
          slug={list.slug}
          categorySlug={categorySlug}
          sizes="72px"
          className="h-full w-full object-cover"
          fallbackIcon={fallbackIcon}
          fallbackClassName="flex h-full w-full items-center justify-center bg-muted text-xl opacity-50"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center text-start">
        <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
          {list.title}
        </h3>
        {showCreator ? (
          <p className="mt-0.5 text-xs text-muted-foreground lg:mt-1">
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
      </Card>
    </Link>
  );
}
