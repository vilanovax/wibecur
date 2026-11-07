'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ListCategoryIconTile from '@/components/shared/ListCategoryIconTile';
import type { MyListCardData } from './MyListCardCompact';
import { Card } from '@/components/ui/card';

interface MyListsTopCarouselProps {
  lists: MyListCardData[];
}

/** هایلایت فشرده — دو کارت روی موبایل، سه کارت در یک ردیف روی دسکتاپ */
export default function MyListsTopCarousel({ lists }: MyListsTopCarouselProps) {
  const router = useRouter();
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
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3" dir="rtl">
          {lists.map((list) => {
            const href = `/user-lists/${list.id}`;
            return (
              <Link
                key={list.id}
                href={href}
                prefetch={false}
                onPointerDown={() => router.prefetch(href)}
                className="block min-w-0"
              >
                <Card className="flex h-full flex-col gap-2 bg-popover p-3">
                  <ListCategoryIconTile
                    icon={list.categories?.icon}
                    size="md"
                    className="self-start"
                  />
                  <h3 className="line-clamp-2 wibe-caption font-semibold leading-snug text-foreground">
                    {list.title}
                  </h3>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
