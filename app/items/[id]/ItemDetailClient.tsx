'use client';

import { useState, type ReactNode } from 'react';
import { useLazyInView } from '@/hooks/useLazyInView';
import Link from 'next/link';
import { Heart, Bookmark, ChevronLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import CommentSection from '@/components/mobile/comments/CommentSection';
import ItemDiscoverySection from '@/components/mobile/items/ItemDiscoverySection';
import ItemDetailTopActions from '@/components/mobile/items/ItemDetailTopActions';
import {
  isLightweightListItem,
  sourceCategorySlugFromItem,
} from '@/lib/list-entry';
import type { SimilarItem } from '@/types/items';

interface ItemDetailClientProps {
  item: {
    id: string;
    title: string;
    catalogItemId?: string | null;
    metadata: Record<string, unknown> | null;
    voteCount: number | null;
    personalSaveCount: number;
    listRank: number | null;
    listItemCount: number;
    lists: {
      id: string;
      title: string;
      slug: string;
      saveCount: number;
      categories: {
        id: string;
        name: string;
        slug: string;
        icon: string;
        color: string;
      } | null;
    };
  };
  metadataSection: ReactNode;
  initialSimilarItems?: SimilarItem[];
}

function ItemSidebarPanel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-wibe/70 bg-wibe-card p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export default function ItemDetailClient({
  item,
  metadataSection,
  initialSimilarItems,
}: ItemDetailClientProps) {
  const { status: authStatus } = useSession();
  const pathname = usePathname();
  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname || `/items/${item.id}`)}`;
  const [commentRefreshTrigger, setCommentRefreshTrigger] = useState(0);
  const onCommentsUpdate = () => setCommentRefreshTrigger((t) => t + 1);

  const { ref: discoveryRef, inView: discoveryInView } = useLazyInView<HTMLDivElement>({
    rootMargin: '320px',
    once: true,
  });

  const { ref: commentsRef, inView: commentsInView } = useLazyInView<HTMLDivElement>({
    rootMargin: '240px',
    once: true,
  });

  const categoryId = item.lists.categories?.id ?? null;
  const listCategorySlug = item.lists.categories?.slug ?? null;
  const itemCategorySlug =
    sourceCategorySlugFromItem({
      metadata: item.metadata,
      catalogItemId: item.catalogItemId,
    }) ?? listCategorySlug;
  const isLightweight = isLightweightListItem(item);
  const likeCount = item.voteCount ?? 0;

  const listContextCard = (
    <ItemSidebarPanel>
      <p className="mb-2 wibe-caption font-medium text-wibe-secondary">در لیست</p>
      <Link
        href={`/lists/${item.lists.slug}`}
        className="group flex items-start gap-3 rounded-xl border border-wibe bg-wibe-surface p-3 transition-colors hover:border-primary/25 hover:bg-primary/5"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg">
          {item.lists.categories?.icon || '📋'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 wibe-small font-semibold text-foreground group-hover:text-primary">
            {item.lists.title}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 wibe-caption text-wibe-secondary">
            <span>{item.lists.saveCount.toLocaleString('fa-IR')} ذخیره</span>
          </p>
        </div>
        <ChevronLeft className="mt-1 h-4 w-4 shrink-0 rotate-180 text-wibe-secondary opacity-60" />
      </Link>
    </ItemSidebarPanel>
  );

  return (
    <main className="pb-2" dir="rtl">
      {!isLightweight && (
        <div className="lg:hidden">
          <ItemDetailTopActions
            itemId={item.id}
            likeCount={likeCount}
            catalogItemId={item.catalogItemId}
            variant="bar"
          />
        </div>
      )}

      <div className="relative z-10 mt-4 flex flex-col gap-5 px-4 lg:mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start lg:gap-8 lg:px-0 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="flex min-w-0 flex-col gap-5 lg:gap-6">
          {isLightweight && (
            <div className="rounded-2xl border border-wibe/70 bg-wibe-card px-3 py-2.5 shadow-sm">
              <ItemDetailTopActions
                itemId={item.id}
                likeCount={likeCount}
                catalogItemId={item.catalogItemId}
                variant="inline"
              />
            </div>
          )}

          {authStatus === 'unauthenticated' && (
            <Link
              href={loginHref}
              className="flex items-center justify-between gap-3 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 wibe-small text-foreground transition-colors hover:bg-primary/10"
            >
              <span>برای ذخیره، پسند و نظر وارد شو</span>
              <span className="shrink-0 font-semibold text-primary">ورود</span>
            </Link>
          )}

          {metadataSection}

          <div ref={discoveryRef} className="min-h-[6rem]">
            {discoveryInView ? (
              <ItemDiscoverySection
                itemId={item.id}
                categoryId={categoryId}
                categorySlug={itemCategorySlug}
                fetchEnabled
                initialSimilarItems={initialSimilarItems}
              />
            ) : null}
          </div>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-[6.5rem] lg:self-start">
          {(likeCount > 0 || item.personalSaveCount > 0) && (
            <ItemSidebarPanel className="hidden lg:block">
              <p className="mb-2 wibe-caption font-medium text-wibe-secondary">آمار</p>
              <div className="flex flex-wrap gap-2">
                {likeCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 wibe-caption text-foreground">
                    <Heart className="h-3.5 w-3.5 text-red-500" aria-hidden />
                    {likeCount.toLocaleString('fa-IR')} پسند
                  </span>
                )}
                {item.personalSaveCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 wibe-caption text-foreground">
                    <Bookmark className="h-3.5 w-3.5 text-primary" aria-hidden />
                    {item.personalSaveCount.toLocaleString('fa-IR')} ذخیره
                  </span>
                )}
              </div>
            </ItemSidebarPanel>
          )}

          <div className="hidden lg:block">{listContextCard}</div>

          <section
            ref={commentsRef}
            className="scroll-mt-16 rounded-2xl border border-wibe/60 bg-wibe-card p-5 shadow-sm lg:border-wibe/60"
          >
            {commentsInView ? (
              <CommentSection
                itemId={item.id}
                onCommentAdded={onCommentsUpdate}
                refreshTrigger={commentRefreshTrigger}
                embeddedInPanel
                fetchEnabled
              />
            ) : (
              <div className="min-h-[8rem] animate-pulse rounded-xl bg-gray-100/80" aria-hidden />
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
