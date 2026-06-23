import Link from 'next/link';
import Image from 'next/image';
import CategorySectionTitle from './CategorySectionTitle';
import { CATEGORY_SECTION } from '@/lib/category-layout';
import { resolveNextImageSrc } from '@/lib/next-image-src';
import type { CategoryItemCard } from '@/types/category-page';

type CategoryMostSavedItemsServerProps = {
  items: CategoryItemCard[];
  accentColor?: string;
  inset?: boolean;
};

export default function CategoryMostSavedItemsServer({
  items,
  accentColor = '#EA580C',
  inset = false,
}: CategoryMostSavedItemsServerProps) {
  if (items.length === 0) return null;

  const sectionClass = `${CATEGORY_SECTION} ${inset ? '' : 'px-4'}`;

  return (
    <section className={sectionClass}>
      <CategorySectionTitle
        title="محبوب‌ترین آیتم‌ها"
        subtitle="از لیست‌های پربازدید این دسته"
        icon="⭐"
      />

      <div className="-mx-1 flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {items.map((item) => {
          const image = item.imageUrl ? resolveNextImageSrc(item.imageUrl) : null;
          return (
          <Link
            key={item.id}
            href={`/lists/${item.listSlug}#item-${item.id}`}
            className="w-24 shrink-0 transition-transform active:scale-[0.97]"
          >
            <div className="aspect-square overflow-hidden rounded-xl border border-wibe bg-wibe-card shadow-sm">
              {image ? (
                <Image
                  src={image.src}
                  alt={item.title}
                  width={96}
                  height={96}
                  sizes="96px"
                  className="h-full w-full object-cover"
                  unoptimized={image.unoptimized}
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-2xl opacity-40"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  📋
                </div>
              )}
            </div>
            <p className="mt-1.5 line-clamp-2 wibe-caption font-medium leading-tight text-foreground">
              {item.title}
            </p>
          </Link>
          );
        })}
      </div>
    </section>
  );
}
