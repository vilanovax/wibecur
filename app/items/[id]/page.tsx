import { Suspense } from 'react';
import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { notFound } from 'next/navigation';
import ItemDetailClient from './ItemDetailClient';
import ItemLcpPreload from '@/components/mobile/items/ItemLcpPreload';
import ItemPageBreadcrumb from '@/components/mobile/items/ItemPageBreadcrumb';
import ItemHeroServer from '@/components/mobile/items/ItemHeroServer';
import ItemMetadataServer from '@/components/mobile/items/ItemMetadataServer';
import { Skeleton } from '@/components/ui/skeleton';
import { toAbsoluteImageUrl } from '@/lib/seo';
import {
  getItemById,
  serializeItemDetail,
  toItemDetailClientSeed,
} from '@/lib/item-detail';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getItemById(id);

  if (!item) {
    return { title: 'آیتم یافت نشد' };
  }

  const serialized = serializeItemDetail(item);
  const ogImage = toAbsoluteImageUrl(serialized.displayImageUrl || item.imageUrl);

  return {
    title: item.title,
    description: item.description || `مشاهده ${item.title}`,
    openGraph: {
      title: item.title,
      description: item.description || `مشاهده ${item.title}`,
      ...(ogImage && {
        images: [{ url: ogImage, alt: item.title }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: item.title,
      description: item.description || `مشاهده ${item.title}`,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

function ItemMetadataFallback() {
  return (
    <div className="space-y-3" aria-hidden>
      <Skeleton className="h-8 w-36 rounded-full" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-28 w-full rounded-xl" />
    </div>
  );
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const item = await getItemById(id);

  if (!item || item.deletedAt) {
    notFound();
  }

  if (item.item_moderation?.status === 'HIDDEN') {
    notFound();
  }

  const serialized = serializeItemDetail(item);
  const clientItem = toItemDetailClientSeed(serialized);

  return (
    <div className="bg-background">
      <ItemLcpPreload href={serialized.displayImageUrl} />
      <Header showBack hideTitleOnDesktop showDesktopSearch={false} />
      <ItemPageBreadcrumb
        category={item.lists.categories}
        listTitle={item.lists.title}
        listSlug={item.lists.slug}
        itemTitle={item.title}
      />
      <ItemHeroServer item={serialized} />
      <ItemDetailClient
        item={clientItem}
        metadataSection={
          <Suspense fallback={<ItemMetadataFallback />}>
            <ItemMetadataServer item={serialized} />
          </Suspense>
        }
      />
      <BottomNav />
    </div>
  );
}
