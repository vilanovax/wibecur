import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import CategoryNavStrip from '@/components/shared/CategoryNavStrip';
import { prepareListDetailForClient } from '@/lib/list-detail-serialize';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ListDetailClient from './ListDetailClient';
import { getCachedListPagePlacements } from '@/lib/sponsored-placements';
import HomeLcpPreload from '@/components/mobile/home/HomeLcpPreload';
import { withResolvedItemImages } from '@/lib/resolve-item-image';
import { withResolvedListDisplay } from '@/lib/list-display-images';
import { getBaseUrl, toAbsoluteImageUrl } from '@/lib/seo';
import { listDetailCacheTag } from '@/lib/public-cache';
import { fetchActiveCategoryMenu } from '@/lib/category-menu';

export const revalidate = 120; // ISR: ۲ دقیقه (viewCount ممکن است کمی تأخیر داشته باشد)

function loadListBySlug(slug: string) {
  return prisma.lists.findUnique({
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
        where: { deletedAt: null },
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
  });
}

/**
 * واکشی لیست بر اساس slug.
 * - `unstable_cache`: کش بین‌درخواستی (Data Cache) با tag `list-slug-{slug}` تا
 *   کوئری سنگین لیست + همهٔ آیتم‌ها روی هر بازدید تکرار نشود. با revalidateTag
 *   هنگام ویرایش لیست فوراً تازه می‌شود.
 * - `cache()` React: dedupe داخل یک request (generateMetadata + بدنهٔ صفحه).
 */
const getListBySlug = cache((slug: string) =>
  unstable_cache(() => loadListBySlug(slug), ['list-by-slug', slug], {
    revalidate: 300,
    tags: [listDetailCacheTag(slug)],
  })()
);

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

  // شمارش بازدید از مسیر رندر جدا شد (beacon کلاینت → POST /api/lists/[id]/view)
  // تا صفحه static/ISR بماند و write روی هر revalidation انجام نشود.

  const [sponsoredPlacements, menuCategories] = await Promise.all([
    getCachedListPagePlacements(list.id, list.categoryId),
    fetchActiveCategoryMenu(),
  ]);

  const listWithCreator = prepareListDetailForClient(
    withResolvedListDisplay({
      ...list,
      categorySlug: list.categories?.slug ?? null,
      items: withResolvedItemImages(
        list.items.map((item) => ({
          ...item,
          metadata: item.metadata as Record<string, unknown> | null,
        })),
        list.categories?.slug ?? null
      ),
    })
  );

  const heroLcpImage =
    listWithCreator.bannerImage ||
    listWithCreator.horizontalImage ||
    listWithCreator.coverImage ||
    '';

  return (
    <div className="bg-wibe-surface lg:pt-1">
      <HomeLcpPreload href={heroLcpImage} />
      <Header title={list.title} showBack hideTitleOnDesktop showDesktopSearch={false} />
      <CategoryNavStrip
        activeSlug={list.categories?.slug ?? null}
        initialCategories={menuCategories}
      />
      <ListDetailClient list={listWithCreator} sponsoredPlacements={sponsoredPlacements} />
      <BottomNav />
    </div>
  );
}
