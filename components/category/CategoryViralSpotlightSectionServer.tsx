import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import CategorySectionTitle from './CategorySectionTitle';
import { CATEGORY_SECTION } from '@/lib/category-layout';
import { resolveNextImageSrc } from '@/lib/next-image-src';
import { getCoverDisplayFlags } from '@/lib/admin/category-form-constants';
import type { CategoryListCard } from '@/types/category-page';

type CategoryViralSpotlightSectionServerProps = {
  list: CategoryListCard;
  inset?: boolean;
  coverDisplayMode?: string | null;
};

export default function CategoryViralSpotlightSectionServer({
  list,
  inset = false,
  coverDisplayMode,
}: CategoryViralSpotlightSectionServerProps) {
  const sectionClass = `${CATEGORY_SECTION} ${inset ? '' : 'px-4'}`;
  const imageSrc = list.bannerImage ?? list.coverImage;
  const image = imageSrc ? resolveNextImageSrc(imageSrc) : null;
  const { showScrim, showTitleOnCover } = getCoverDisplayFlags(coverDisplayMode);

  return (
    <section className={sectionClass}>
      <CategorySectionTitle title="وایرال این هفته" iconVariant="viral" />
      <Link
        href={`/lists/${list.slug}`}
        className="block transition-transform active:scale-95"
      >
        <Card className="overflow-hidden bg-popover p-0">
          <div className="relative aspect-video bg-muted">
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
              <div className="flex h-full w-full items-center justify-center bg-muted text-5xl opacity-40">
                📋
              </div>
            )}
            {showScrim ? (
              <div className="absolute inset-0 bg-linear-to-t from-foreground/80 via-transparent to-transparent" />
            ) : (
              <div className="absolute inset-0 bg-linear-to-t from-foreground/40 via-transparent to-transparent" />
            )}
            <span className="absolute inset-e-3 top-3 z-10 rounded-full bg-warning px-2 py-1 text-xs font-semibold text-foreground">
              وایرال
            </span>
            {showTitleOnCover ? (
              <div className="absolute inset-x-0 bottom-0 p-4">
                <h3 className="line-clamp-2 wibe-h3 text-background">{list.title}</h3>
                <p className="mt-1 wibe-caption tabular-nums text-background/90">
                  {list.saveCount.toLocaleString('fa-IR')} ذخیره ·{' '}
                  {list.itemCount.toLocaleString('fa-IR')} آیتم
                </p>
              </div>
            ) : (
              <span className="sr-only">{list.title}</span>
            )}
          </div>
          <div className="space-y-1 p-3 text-start">
            {!showTitleOnCover ? (
              <h3 className="line-clamp-2 wibe-h3 text-foreground">{list.title}</h3>
            ) : null}
            <p className="text-center text-sm text-muted-foreground">ببین چرا وایرال شده</p>
          </div>
        </Card>
      </Link>
    </section>
  );
}
