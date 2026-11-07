'use client';

import Link from 'next/link';
import ListCategoryIconTile from '@/components/shared/ListCategoryIconTile';
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
  categories?: {
    icon?: string | null;
    iconImage?: string | null;
    slug?: string | null;
  } | null;
};

type ListRowCompactProps = {
  list: ListRowCompactList;
  /**
   * @deprecated کاور کوچک دیگر استفاده نمی‌شود — همیشه آیکون دسته.
   * برای سازگاری با فراخوانی‌های قدیمی نگه داشته شده.
   */
  thumb?: 'icon' | 'square' | 'poster';
  /** آیکون دستهٔ والد وقتی روی خود لیست categories.icon نیست */
  categoryIcon?: string | null;
  categoryIconImage?: string | null;
  showCreator?: boolean;
  /** @deprecated آمار دیگر نمایش داده نمی‌شود */
  showStats?: boolean;
  /** @deprecated آمار دیگر نمایش داده نمی‌شود */
  showSaveCount?: boolean;
  className?: string;
};

/** ردیف فشرده لیست — برای سکشن‌های sparse (لیست‌های جدید، هاب و …) */
export default function ListRowCompact({
  list,
  categoryIcon,
  categoryIconImage,
  showCreator = true,
  className = '',
}: ListRowCompactProps) {
  const icon = categoryIcon ?? list.categories?.icon ?? '📋';
  const iconImage = categoryIconImage ?? list.categories?.iconImage ?? null;

  return (
    <Link
      href={`/lists/${list.slug}`}
      className={cn('block transition-transform active:scale-[0.99]', className)}
    >
      <Card className="flex gap-3 bg-popover p-3 lg:p-4">
        <ListCategoryIconTile icon={icon} iconImage={iconImage} size="md" />
        <div className="flex min-w-0 flex-1 flex-col justify-center text-start">
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
            {list.title}
          </h3>
          {showCreator ? (
            <p className="mt-0.5 text-xs text-muted-foreground lg:mt-1">
              {list.creator?.name || 'کیوریتور'}
            </p>
          ) : null}
        </div>
      </Card>
    </Link>
  );
}
