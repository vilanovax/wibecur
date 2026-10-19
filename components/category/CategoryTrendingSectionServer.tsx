import Link from 'next/link';
import Image from 'next/image';
import { CATEGORY_SECTION, isFilmCategorySlug } from '@/lib/category-layout';
import { resolveNextImageSrc } from '@/lib/next-image-src';
import type { CategoryListCard } from '@/types/category-page';

type CategoryTrendingSectionServerProps = {
  title: string;
  subtitle?: string;
  lists: CategoryListCard[];
  categorySlug?: string;
  accentColor?: string;
  inset?: boolean;
};

function TrendingCardServer({
  list,
  index,
  accentColor,
  cinematic,
}: {
  list: CategoryListCard;
  index: number;
  accentColor: string;
  cinematic: boolean;
}) {
  const showTrendBadge = index < 3 || list.badge === 'viral' || list.badge === 'hot';
  const cover = list.coverImage ? resolveNextImageSrc(list.coverImage) : null;

  return (
    <Link
      href={`/lists/${list.slug}`}
      className="group block transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 active:scale-[0.99] lg:hover:-translate-y-0.5"
    >
      <div className="overflow-hidden rounded-2xl bg-wibe-card shadow-sm ring-1 ring-wibe/90 lg:transition-shadow lg:group-hover:shadow-md lg:group-hover:ring-primary/20">
        <div
          className={`relative bg-wibe-surface ${
            cinematic ? 'aspect-[3/4]' : 'aspect-[4/3]'
          }`}
        >
          {cover ? (
            <Image
              src={cover.src}
              alt={list.title}
              fill
              sizes="(max-width: 1023px) 50vw, 25vw"
              className="object-cover lg:transition-transform lg:duration-300 lg:group-hover:scale-[1.03]"
              unoptimized={cover.unoptimized}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center bg-wibe-surface text-4xl opacity-40"
              style={{ color: accentColor }}
            >
              {cinematic ? '🎬' : '📋'}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          {showTrendBadge ? (
            <span className="absolute end-2 top-2 rounded-full bg-warning px-2 py-0.5 wibe-caption font-semibold text-white shadow-sm">
              ترند
            </span>
          ) : null}
          {list.cityTag ? (
            <span className="absolute bottom-2 end-2 rounded-full bg-black/45 px-2 py-0.5 wibe-caption text-white/95 backdrop-blur-sm">
              {list.cityTag}
            </span>
          ) : null}
        </div>
        <div className="space-y-1 px-2.5 py-2.5 text-start">
          <h3 className="line-clamp-2 wibe-caption font-semibold leading-snug text-foreground">
            {list.title}
          </h3>
          {typeof list.itemCount === 'number' && list.itemCount > 0 ? (
            <p className="wibe-caption tabular-nums text-wibe-secondary">
              {list.itemCount.toLocaleString('fa-IR')} آیتم
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export default function CategoryTrendingSectionServer({
  title,
  subtitle,
  lists,
  categorySlug,
  accentColor = '#6366F1',
  inset = false,
}: CategoryTrendingSectionServerProps) {
  if (lists.length === 0) return null;

  const cinematic = !!categorySlug && isFilmCategorySlug(categorySlug);
  const visible = lists.slice(0, 8);
  const sectionClass = `${CATEGORY_SECTION} ${inset ? '' : 'px-4'}`;

  return (
    <section className={sectionClass}>
      <div className="mb-3.5 flex items-end justify-between gap-3 lg:mb-4">
        <div>
          <h2 className="flex items-center gap-2 wibe-h3">
            <span aria-hidden>🔥</span>
            {title}
          </h2>
          {subtitle || cinematic ? (
            <p className="mt-1 wibe-caption text-wibe-secondary">
              {subtitle ?? 'لیست‌های پربازدید این دسته'}
            </p>
          ) : null}
        </div>
        {categorySlug ? (
          <Link
            href={`/lists?category=${categorySlug}`}
            className="shrink-0 pb-0.5 wibe-small font-semibold text-primary transition-colors hover:text-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            مشاهده همه
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {visible.map((list, index) => (
          <TrendingCardServer
            key={list.id}
            list={list}
            index={index}
            accentColor={accentColor}
            cinematic={cinematic}
          />
        ))}
      </div>
    </section>
  );
}
