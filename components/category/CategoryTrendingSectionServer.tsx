import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
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
}: {
  list: CategoryListCard;
  index: number;
}) {
  const showTrendBadge = index < 3 || list.badge === 'viral' || list.badge === 'hot';
  const cover = list.coverImage ? resolveNextImageSrc(list.coverImage) : null;

  return (
    <Link
      href={`/lists/${list.slug}`}
      className="group block transition-transform active:scale-95 lg:hover:-translate-y-0.5"
    >
      <Card className="overflow-hidden bg-popover p-0 lg:transition-shadow lg:group-hover:shadow-md">
        <div className="relative aspect-[4/3] bg-muted">
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
            <div className="flex h-full w-full items-center justify-center bg-muted text-4xl opacity-40">
              📋
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
          {showTrendBadge ? (
            <span className="absolute end-2 top-2 rounded-full bg-warning px-2 py-0.5 text-xs font-semibold text-foreground">
              ترند
            </span>
          ) : null}
          {list.cityTag ? (
            <span className="absolute bottom-2 end-2 rounded-md bg-foreground/40 px-2 py-0.5 text-xs text-background backdrop-blur-sm">
              {list.cityTag}
            </span>
          ) : null}
        </div>
        <div className="p-3">
          <h3 className="line-clamp-2 text-start text-sm font-semibold text-foreground">{list.title}</h3>
        </div>
      </Card>
    </Link>
  );
}

export default function CategoryTrendingSectionServer({
  title,
  subtitle,
  lists,
  categorySlug,
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
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {categorySlug ? (
          <Link
            href={`/lists?category=${categorySlug}`}
            className="inline-flex h-11 shrink-0 items-center"
          >
            <span className="text-sm font-medium text-brand">مشاهده همه</span>
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {visible.map((list, index) => (
          <TrendingCardServer
            key={list.id}
            list={list}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}
