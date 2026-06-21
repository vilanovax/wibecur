import Link from 'next/link';
import Image from 'next/image';
import CategorySectionTitle from './CategorySectionTitle';
import { CATEGORY_SECTION } from '@/lib/category-layout';
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
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.slug}`}
            className="flex gap-3 rounded-lg border border-wibe bg-wibe-card p-3 shadow-sm transition-transform active:scale-[0.99]"
          >
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-200">
              {list.coverImage ? (
                <Image
                  src={list.coverImage}
                  alt={list.title}
                  width={64}
                  height={64}
                  sizes="64px"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-200 text-2xl opacity-40">
                  📋
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 wibe-small font-semibold text-foreground">{list.title}</h3>
              <p className="mt-1 wibe-caption tabular-nums text-wibe-secondary">
                {list.saveCount.toLocaleString('fa-IR')} ذخیره ·{' '}
                {list.itemCount.toLocaleString('fa-IR')} آیتم
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
