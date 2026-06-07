import { cache } from 'react';
import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { dbQuery } from '@/lib/db';
import ItemDetailClient from './ItemDetailClient';
import { toAbsoluteImageUrl } from '@/lib/seo';
import { resolveItemDisplayImage } from '@/lib/resolve-item-image';

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
      rating: true,
      voteCount: true,
      metadata: true,
      listId: true,
      order: true,
      createdAt: true,
      _count: {
        select: { comments: true },
      },
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
          users: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  })
);

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

  if (!item) {
    notFound();
  }

  if (item.item_moderation?.status === 'HIDDEN') {
    notFound();
  }

  let listRank: number | null = null;
  let listItemCount = 0;
  let personalSaveCount = 0;

  try {
    [listRank, listItemCount, personalSaveCount] = await dbQuery(async () => {
      // رتبه با count محاسبه می‌شود (index-only) به‌جای کشیدن همه‌ی آیتم‌های لیست.
      // ترتیب معادلِ orderBy [order asc, createdAt asc] است.
      const [priorCount, totalCount, saveCount] = await Promise.all([
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
        prisma.items.count({
          where: {
            title: { equals: item.title, mode: 'insensitive' },
            listId: { not: item.listId },
            lists: { isActive: true },
          },
        }),
      ]);
      return [totalCount > 0 ? priorCount + 1 : null, totalCount, saveCount] as const;
    });
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
    users: item.lists.users
      ? {
          name: item.lists.users.name,
        }
      : null,
  };

  return (
    <div className="bg-wibe-surface">
      <Header title={item.title} showBack hideTitleOnDesktop showDesktopSearch={false} />
      <ItemDetailClient item={serializedItem} />
      <BottomNav />
    </div>
  );
}
