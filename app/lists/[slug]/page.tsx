import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import CategoryNavStrip from '@/components/shared/CategoryNavStrip';
import { getTopSimilarLists, type ListForSimilarity } from '@/lib/listSimilarity';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ListDetailClient from './ListDetailClient';
import { withResolvedItemImages } from '@/lib/resolve-item-image';
import { withResolvedListDisplay } from '@/lib/list-display-images';
import { getBaseUrl, toAbsoluteImageUrl } from '@/lib/seo';

export const revalidate = 120; // ISR: ۲ دقیقه (viewCount ممکن است کمی تأخیر داشته باشد)

/**
 * واکشی لیست بر اساس slug — با React cache() تا generateMetadata و بدنه‌ی صفحه
 * در یک request فقط یک‌بار کوئری بزنند (به‌جای دو کوئری جدا).
 */
const getListBySlug = cache((slug: string) =>
  prisma.lists.findUnique({
    where: { slug },
    select: {
      id: true,
      userId: true,
      title: true,
      slug: true,
      description: true,
      coverImage: true,
      horizontalImage: true,
      saveCount: true,
      itemCount: true,
      viewCount: true,
      categoryId: true,
      tags: true,
      badge: true,
      isPublic: true,
      isActive: true,
      // فقط فیلدهای مصرف‌شده: کلاینت از slug/icon/name و سرور از isActive (برای notFound) استفاده می‌کند
      categories: {
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          isActive: true,
        },
      },
      users: { select: { id: true, name: true, image: true, username: true, curatorLevel: true, role: true, viralListsCount: true, totalLikesReceived: true } },
      items: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          externalUrl: true,
          catalogItemId: true,
          listNote: true,
          rating: true,
          metadata: true,
        },
      },
      _count: { select: { items: true, list_comments: true } },
    },
  })
);

/**
 * لیست‌های مشابه — در unstable_cache تا مستقل از rebuild صفحه و فقط هر ۵ دقیقه
 * یک‌بار کوئری‌های سنگین رفتاری (bookmarks) اجرا شوند.
 */
function getCachedSimilarLists(listId: string, input: ListForSimilarity) {
  return unstable_cache(
    () => getTopSimilarLists(prisma, input),
    [`list-similar-${listId}`],
    { revalidate: 300, tags: [`list-similar-${listId}`] }
  )();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const list = await getListBySlug(slug);
  if (!list) return { title: 'لیست یافت نشد' };

  const resolved = withResolvedListDisplay({
    ...list,
    slug,
    title: list.title,
    categorySlug: list.categories?.slug ?? null,
  });
  const ogImage = toAbsoluteImageUrl(resolved.bannerImage);
  const description = list.description || `مشاهده لیست ${list.title}`;

  return {
    title: list.title,
    description,
    openGraph: {
      title: list.title,
      description,
      url: `${getBaseUrl()}/lists/${slug}`,
      ...(ogImage && {
        images: [{ url: ogImage, alt: list.title }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: list.title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const list = await getListBySlug(slug);

  if (!list || !list.isActive || !list.isPublic) notFound();

  if (list.categories && !list.categories.isActive) notFound();

  if (list.users?.role === 'USER') notFound();

  prisma.lists
    .update({ where: { id: list.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  const currentForSimilarity: ListForSimilarity = {
    id: list.id,
    categoryId: list.categoryId,
    saveCount: list.saveCount,
    tags: list.tags ?? [],
    items: list.items.map((i) => ({ title: i.title })),
  };
  const relatedLists = await getCachedSimilarLists(list.id, currentForSimilarity);

  const listWithCreator = withResolvedListDisplay({
    ...list,
    categorySlug: list.categories?.slug ?? null,
    items: withResolvedItemImages(
      list.items.map((item) => ({
        ...item,
        metadata: item.metadata as Record<string, unknown> | null,
      })),
      list.categories?.slug ?? null
    ),
  });

  return (
    <div className="bg-wibe-surface lg:pt-1">
      <Header title={list.title} showBack hideTitleOnDesktop showDesktopSearch={false} />
      <CategoryNavStrip activeSlug={list.categories?.slug ?? null} />
      <ListDetailClient
        list={JSON.parse(JSON.stringify(listWithCreator))}
        relatedLists={JSON.parse(JSON.stringify(relatedLists))}
      />
      <BottomNav />
    </div>
  );
}
