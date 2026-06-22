import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { dbQuery } from '@/lib/db';
import ItemDetailClient from './ItemDetailClient';
import ItemLcpPreload from '@/components/mobile/items/ItemLcpPreload';
import ItemPageBreadcrumb from '@/components/mobile/items/ItemPageBreadcrumb';
import ItemHeroServer from '@/components/mobile/items/ItemHeroServer';
import ItemMetadataServer from '@/components/mobile/items/ItemMetadataServer';
import { toAbsoluteImageUrl } from '@/lib/seo';
import { resolveItemDisplayImage } from '@/lib/resolve-item-image';
import { getCachedSimilarItems } from '@/lib/item-similar';

export const revalidate = 60;

/**
 * واکشی آیتم — با React cache() تا generateMetadata و بدنه‌ی صفحه در یک request
 * فقط یک‌بار کوئری بزنند (به‌جای دو کوئری جدا برای همان رکورد).
 */
const getItemById = cache((id: string) =>
  prisma.items.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      externalUrl: true,
      catalogItemId: true,
      listNote: true,
      rating: true,
      voteCount: true,
      metadata: true,
      listId: true,
      order: true,
      createdAt: true,
      _count: {
        select: { comments: true },
      },
      deletedAt: true,
      item_moderation: { select: { status: true } },
      lists: {
        select: {
          id: true,
          title: true,
          slug: true,
          saveCount: true,
          userId: true,
          itemCount: true,
          categories: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
              color: true,
            },
          },
        },
      },
    },
  })
);

const PERSONAL_SAVE_COUNT_SECONDS = 300;

function getCachedPersonalSaveCount(itemId: string, title: string, listId: string) {
  return unstable_cache(
    () =>
      prisma.items.count({
        where: {
          title: { equals: title, mode: 'insensitive' },
          listId: { not: listId },
          lists: { isActive: true },
        },
      }),
    ['item-personal-save-count', itemId],
    { revalidate: PERSONAL_SAVE_COUNT_SECONDS, tags: [`item-${itemId}`] }
  )();
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getItemById(id);

  if (!item) {
    return {
      title: 'آیتم یافت نشد',
    };
  }

  const ogImage = toAbsoluteImageUrl(item.imageUrl);

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

  let listRank: number | null = null;
  let listItemCount = 0;
  let personalSaveCount = 0;
  let similarItemsResult: Awaited<ReturnType<typeof getCachedSimilarItems>> = null;

  try {
    const [rankResult, personalSaveCountResult, similarResult] = await Promise.all([
      dbQuery(async () => {
        const [priorCount, totalCount] = await Promise.all([
          prisma.items.count({
            where: {
              listId: item.listId,
              OR: [
                { order: { lt: item.order } },
                { order: item.order, createdAt: { lt: item.createdAt } },
              ],
            },
          }),
          prisma.items.count({ where: { listId: item.listId } }),
        ]);
        return {
          listRank: totalCount > 0 ? priorCount + 1 : null,
          listItemCount: totalCount,
        } as const;
      }),
      getCachedPersonalSaveCount(item.id, item.title, item.listId),
      getCachedSimilarItems(item.id),
    ]);
    listRank = rankResult.listRank;
    listItemCount = rankResult.listItemCount;
    personalSaveCount = personalSaveCountResult;
    similarItemsResult = similarResult;
  } catch (error) {
    console.warn('[ItemDetailPage] secondary query failed:', error);
  }

  const metadata =
    item.metadata != null &&
    typeof item.metadata === 'object' &&
    !Array.isArray(item.metadata)
      ? (item.metadata as Record<string, unknown>)
      : null;

  const serializedItem = {
    id: item.id,
    title: item.title,
    description: item.description,
    imageUrl: item.imageUrl,
    displayImageUrl: resolveItemDisplayImage({
      id: item.id,
      imageUrl: item.imageUrl,
      title: item.title,
      metadata,
      categorySlug: item.lists.categories?.slug ?? null,
    }),
    externalUrl: item.externalUrl,
    catalogItemId: item.catalogItemId,
    listNote: item.listNote,
    rating: item.rating,
    voteCount: item.voteCount,
    metadata,
    commentCount: item._count.comments,
    listRank,
    listItemCount,
    personalSaveCount,
    lists: {
      id: item.lists.id,
      title: item.lists.title,
      slug: item.lists.slug,
      saveCount: item.lists.saveCount ?? 0,
      categories: item.lists.categories,
    },
  };

  const initialSimilarItems =
    similarItemsResult && similarItemsResult.length >= 2 ? similarItemsResult : undefined;

  return (
    <div className="bg-wibe-surface">
      <ItemLcpPreload href={serializedItem.displayImageUrl} />
      <Header showBack hideTitleOnDesktop showDesktopSearch={false} />
      <ItemPageBreadcrumb
        category={item.lists.categories}
        listTitle={item.lists.title}
        listSlug={item.lists.slug}
        itemTitle={item.title}
      />
      <ItemHeroServer item={serializedItem} />
      <ItemDetailClient
        item={serializedItem}
        initialSimilarItems={initialSimilarItems}
        metadataSection={<ItemMetadataServer item={serializedItem} />}
      />
      <BottomNav />
    </div>
  );
}
