import Link from 'next/link';
import Image from 'next/image';
import CategorySectionTitle from './CategorySectionTitle';
import { CATEGORY_SECTION } from '@/lib/category-layout';
import { resolveNextImageSrc } from '@/lib/next-image-src';
import type { CategoryListCard } from '@/types/category-page';

type CategoryNewListsSectionServerProps = {
  lists: CategoryListCard[];
  categoryName: string;
  inset?: boolean;
};

export default function CategoryNewListsSectionServer({
  lists,
  categoryName,
  inset = false,
}: CategoryNewListsSectionServerProps) {
  if (lists.length === 0) return null;

  const sectionClass = `${CATEGORY_SECTION} ${inset ? '' : 'px-4'}`;

  return (
    <section className={sectionClass}>
      <CategorySectionTitle
        title={`لیست‌های جدید ${categoryName}`}
        subtitle="تازه‌ترین لیست‌های ساخته شده"
        icon="🆕"
      />
      <div className="space-y-3">
        {lists.map((list) => {
          const cover = list.coverImage ? resolveNextImageSrc(list.coverImage) : null;
          return (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex gap-3 rounded-lg border border-wibe bg-wibe-card p-3 shadow-sm transition-transform active:scale-[0.99]"
          >
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-200">
              {cover ? (
                <Image
                  src={cover.src}
                  alt={list.title}
                  width={64}
                  height={64}
                  sizes="64px"
                  className="h-full w-full object-cover"
                  unoptimized={cover.unoptimized}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-200 text-2xl opacity-40">
                  📋
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-1 items-center">
              <h3 className="line-clamp-2 wibe-small font-semibold text-foreground">{list.title}</h3>
            </div>
          </Link>
          );
        })}
      </div>
    </section>
  );
}
