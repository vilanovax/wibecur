import Link from 'next/link';
import Image from 'next/image';
import { CATEGORY_SECTION } from '@/lib/category-layout';
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
}: {
  list: CategoryListCard;
  index: number;
  accentColor: string;
}) {
  const showTrendBadge = index < 3 || list.badge === 'viral' || list.badge === 'hot';
  const cover = list.coverImage ? resolveNextImageSrc(list.coverImage) : null;

  return (
    <Link
      href={`/lists/${list.slug}`}
      className="group block transition-transform active:scale-[0.99] lg:hover:-translate-y-0.5"
    >
      <div className="overflow-hidden rounded-xl border border-wibe bg-wibe-card shadow-card lg:rounded-2xl lg:transition-shadow lg:group-hover:shadow-md">
        <div className="relative aspect-[4/3] bg-gray-200">
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
              className="flex h-full w-full items-center justify-center bg-gray-200 text-4xl opacity-40"
              style={{ color: accentColor }}
            >
              📋
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
          {showTrendBadge ? (
            <span className="absolute right-2 top-2 rounded-pill bg-warning px-2 py-0.5 wibe-caption font-semibold text-white">
              ترند
            </span>
          ) : null}
          {list.cityTag ? (
            <span className="absolute bottom-2 right-2 rounded-md bg-black/40 px-2 py-0.5 wibe-caption text-white/95 backdrop-blur-sm">
              {list.cityTag}
            </span>
          ) : null}
        </div>
        <div className="p-3">
          <h3 className="line-clamp-2 wibe-small font-semibold text-foreground">{list.title}</h3>
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

  const visible = lists.slice(0, 8);
  const sectionClass = `${CATEGORY_SECTION} ${inset ? '' : 'px-4'}`;

  return (
    <section className={sectionClass}>
      <div className="mb-3 flex items-end justify-between gap-3 lg:mb-4">
        <div>
          <h2 className="flex items-center gap-2 wibe-h3">
            <span aria-hidden>🔥</span>
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 wibe-caption text-wibe-secondary">{subtitle}</p>
          ) : null}
        </div>
        {categorySlug ? (
          <Link
            href={`/lists?category=${categorySlug}`}
            className="shrink-0 pb-0.5 wibe-small font-medium text-primary hover:text-primary-dark"
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
          />
        ))}
      </div>
    </section>
  );
}
