import { Suspense, type ReactNode } from 'react';
import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { notFound } from 'next/navigation';
import ItemDetailClient from './ItemDetailClient';
import ItemLcpPreload from '@/components/mobile/items/ItemLcpPreload';
import ItemPageBreadcrumb from '@/components/mobile/items/ItemPageBreadcrumb';
import ItemHeroServer from '@/components/mobile/items/ItemHeroServer';
import ItemMetadataServer from '@/components/mobile/items/ItemMetadataServer';
import { toAbsoluteImageUrl } from '@/lib/seo';
import { getCachedSimilarItemsWithContext } from '@/lib/item-similar';
import {
  getItemById,
  serializeItemDetail,
  toItemDetailClientSeed,
  type SerializedItemDetail,
} from '@/lib/item-detail';
import type { ItemDetailClientSeed } from '@/lib/item-detail-types';
import type { SimilarItem } from '@/types/items';

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

function ItemDetailBody({
  clientItem,
  metadataSection,
  initialSimilarItems,
}: {
  clientItem: ItemDetailClientSeed;
  metadataSection: ReactNode;
  initialSimilarItems?: SimilarItem[];
}) {
  return (
    <ItemDetailClient
      item={clientItem}
      metadataSection={metadataSection}
      initialSimilarItems={initialSimilarItems}
    />
  );
}

/** Similar items stream after hero — not on the critical path */
async function ItemDetailWithSimilar({
  serialized,
  clientItem,
}: {
  serialized: SerializedItemDetail;
  clientItem: ItemDetailClientSeed;
}) {
  let initialSimilarItems: SimilarItem[] | undefined;
  try {
    const similar = await getCachedSimilarItemsWithContext(
      serialized.id,
      serialized.lists.categoryId,
      serialized.lists.tags
    );
    if (similar.length >= 2) initialSimilarItems = similar;
  } catch (error) {
    console.warn('[ItemDetailPage] similar query failed:', error);
  }

  return (
    <ItemDetailBody
      clientItem={clientItem}
      metadataSection={<ItemMetadataServer item={serialized} />}
      initialSimilarItems={initialSimilarItems}
    />
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
  const metadataSection = <ItemMetadataServer item={serialized} />;

  return (
    <div className="bg-wibe-surface">
      <ItemLcpPreload href={serialized.displayImageUrl} />
      <Header showBack hideTitleOnDesktop showDesktopSearch={false} />
      <ItemPageBreadcrumb
        category={item.lists.categories}
        listTitle={item.lists.title}
        listSlug={item.lists.slug}
        itemTitle={item.title}
      />
      <ItemHeroServer item={serialized} />
      <Suspense
        fallback={
          <ItemDetailBody
            clientItem={clientItem}
            metadataSection={metadataSection}
          />
        }
      >
        <ItemDetailWithSimilar serialized={serialized} clientItem={clientItem} />
      </Suspense>
      <BottomNav />
    </div>
  );
}
