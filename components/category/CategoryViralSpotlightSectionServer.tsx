import Link from 'next/link';
import Image from 'next/image';
import CategorySectionTitle from './CategorySectionTitle';
import { CATEGORY_SECTION } from '@/lib/category-layout';
import { resolveNextImageSrc } from '@/lib/next-image-src';
import type { CategoryListCard } from '@/types/category-page';

type CategoryViralSpotlightSectionServerProps = {
  list: CategoryListCard;
  inset?: boolean;
};

export default function CategoryViralSpotlightSectionServer({
  list,
  inset = false,
}: CategoryViralSpotlightSectionServerProps) {
  const sectionClass = `${CATEGORY_SECTION} ${inset ? '' : 'px-4'}`;
  const imageSrc = list.bannerImage ?? list.coverImage;
  const image = imageSrc ? resolveNextImageSrc(imageSrc) : null;

  return (
    <section className={sectionClass}>
      <CategorySectionTitle title="وایرال این هفته" iconVariant="viral" />
      <Link
        href={`/lists/${list.slug}`}
        className="block transition-transform active:scale-[0.99]"
      >
        <div className="overflow-hidden rounded-lg border border-wibe bg-wibe-card shadow-card">
          <div className="relative aspect-video bg-gray-200">
            {image ? (
              <Image
                src={image.src}
                alt={list.title}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
                unoptimized={image.unoptimized}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-200 text-5xl opacity-40">
                📋
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <span className="absolute right-3 top-3 rounded-pill bg-warning px-2 py-1 wibe-caption font-semibold text-white">
              وایرال
            </span>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="line-clamp-2 wibe-h3 text-white">{list.title}</h3>
              <p className="mt-1 wibe-caption tabular-nums text-white/90">
                {list.saveCount.toLocaleString('fa-IR')} ذخیره ·{' '}
                {list.itemCount.toLocaleString('fa-IR')} آیتم
              </p>
            </div>
          </div>
          <div className="p-3">
            <p className="text-center wibe-caption text-wibe-secondary">ببین چرا وایرال شده</p>
          </div>
        </div>
      </Link>
    </section>
  );
}
