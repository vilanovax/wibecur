'use client';

import { useState, type ReactNode } from 'react';
import { useLazyInView } from '@/hooks/useLazyInView';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import {
  CommentSectionLazy,
  ItemDiscoverySectionLazy,
} from '@/components/mobile/items/item-detail-lazy-sections';
import ItemDetailTopActions from '@/components/mobile/items/ItemDetailTopActions';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ItemDetailClientSeed } from '@/lib/item-detail-types';
import type { SimilarItem } from '@/types/items';

interface ItemDetailClientProps {
  item: ItemDetailClientSeed;
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
    <Card className={`bg-popover p-4 ${className}`}>
      {children}
    </Card>
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
  const likeCount = item.voteCount ?? 0;
  const hasSimilarSeed = Boolean(initialSimilarItems?.length);

  const listContextCard = (
    <ItemSidebarPanel>
      <p className="mb-2 wibe-caption font-medium text-muted-foreground">در لیست</p>
      <Link
        href={`/lists/${item.lists.slug}`}
        className="group flex items-start gap-3 rounded-xl border border-border bg-muted p-3 transition-colors hover:border-brand/30 hover:bg-brand/5"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-popover text-lg">
          {item.lists.categories?.icon || '📋'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 wibe-small font-semibold text-foreground group-hover:text-primary">
            {item.lists.title}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 wibe-caption text-muted-foreground">
            <span>{item.lists.saveCount.toLocaleString('fa-IR')} ذخیره</span>
          </p>
        </div>
        <ChevronLeft className="mt-1 size-4 shrink-0 text-muted-foreground" />
      </Link>
    </ItemSidebarPanel>
  );

  return (
    <main className="pb-2" dir="rtl">
      <div className="relative z-10 mt-3 flex flex-col gap-4 px-4 lg:mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start lg:gap-8 lg:px-0 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="flex min-w-0 flex-col gap-4 lg:gap-6">
          {item.isLightweight && (
            <Card className="bg-popover px-3 py-2.5">
              <ItemDetailTopActions
                itemId={item.id}
                likeCount={likeCount}
                catalogItemId={item.catalogItemId}
                shareTitle={item.title}
                variant="inline"
              />
            </Card>
          )}

          {authStatus === 'unauthenticated' && (
            <Link
              href={loginHref}
              className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-brand/20 bg-brand/5 px-4 text-sm text-foreground"
            >
              <span>برای ذخیره، پسند و نظر وارد شو</span>
              <span className="shrink-0 font-semibold text-brand">ورود</span>
            </Link>
          )}

          {metadataSection}

          <div ref={discoveryRef} className="min-h-24">
            {discoveryInView || hasSimilarSeed ? (
              <ItemDiscoverySectionLazy
                itemId={item.id}
                categoryId={categoryId}
                categorySlug={item.itemCategorySlug}
                fetchEnabled
                initialSimilarItems={initialSimilarItems}
              />
            ) : null}
          </div>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-[6.5rem] lg:self-start">
          <div className="hidden lg:block">{listContextCard}</div>

          <div ref={commentsRef} className="scroll-mt-16">
          <Card className="bg-popover p-5">
            {commentsInView ? (
              <CommentSectionLazy
                itemId={item.id}
                onCommentAdded={onCommentsUpdate}
                refreshTrigger={commentRefreshTrigger}
                embeddedInPanel
                fetchEnabled
              />
            ) : (
              <Skeleton className="min-h-32 w-full rounded-xl" />
            )}
          </Card>
          </div>
        </aside>
      </div>
    </main>
  );
}
