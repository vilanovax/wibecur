'use client';

import Link from 'next/link';
import ListCoverImage from '@/components/shared/ListCoverImage';
import ListCardStats from '@/components/shared/ListCardStats';
import type { MyListCardData } from './MyListCardCompact';
import { Card } from '@/components/ui/card';

interface MyListsTopCarouselProps {
  lists: MyListCardData[];
}

/** هایلایت فشرده — دو کارت روی موبایل، سه کارت در یک ردیف روی دسکتاپ */
export default function MyListsTopCarousel({ lists }: MyListsTopCarouselProps) {
  if (lists.length === 0) return null;

  return (
    <section aria-labelledby="top-public-lists-title">
      <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-0">
        <h2 id="top-public-lists-title" className="wibe-h3 text-foreground">
          محبوب‌ترین‌ها
        </h2>
        <span className="wibe-caption text-muted-foreground">بر اساس ذخیره</span>
      </div>
      <div className="overflow-hidden lg:overflow-visible">
        <div
          className="grid grid-cols-2 gap-2.5 lg:grid-cols-3"
          dir="rtl"
        >
        {lists.map((list) => {
          const saveCount = list.saveCount ?? list._count?.bookmarks ?? 0;
          const itemCount = list.itemCount ?? list._count?.items ?? 0;
          return (
            <Link
              key={list.id}
              href={`/user-lists/${list.id}`}
              className="block min-w-0"
            >
              <Card className="overflow-hidden bg-popover p-0">
              <div className="relative h-24 overflow-hidden bg-muted">
                <ListCoverImage
                  coverImage={list.coverImage}
                  title={list.title}
                  slug={list.slug}
                  categorySlug={list.categories?.slug}
                  className="h-full w-full object-cover"
                  fallbackIcon={list.categories?.icon ?? '📋'}
                  fallbackClassName="flex h-full w-full items-center justify-center bg-muted text-xl"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/35 to-transparent"
                  aria-hidden
                />
                <div className="absolute inset-x-0 bottom-0 p-2 pt-6">
                  <h3 className="line-clamp-2 wibe-caption font-semibold leading-snug text-background">
                    {list.title}
                  </h3>
                  <ListCardStats
                    saves={saveCount}
                    itemCount={itemCount}
                    variant="overlay"
                    className="mt-0.5"
                  />
                </div>
              </div>
              </Card>
            </Link>
          );
        })}
        </div>
      </div>
    </section>
  );
}
