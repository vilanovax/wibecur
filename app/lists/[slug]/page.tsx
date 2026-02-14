import BottomNav from '@/components/mobile/layout/BottomNav';
import { getTopSimilarLists } from '@/lib/listSimilarity';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ListDetailClient from './ListDetailClient';
import { getBaseUrl, toAbsoluteImageUrl } from '@/lib/seo';

export const revalidate = 120; // ISR: ۲ دقیقه (viewCount ممکن است کمی تأخیر داشته باشد)

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const list = await prisma.lists.findUnique({
    where: { slug },
    select: { title: true, description: true, coverImage: true },
  });
  if (!list) return { title: 'لیست یافت نشد' };

  const ogImage = toAbsoluteImageUrl(list.coverImage);
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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ suggest?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const openSuggest = resolvedSearchParams?.suggest === '1';

  const list = await prisma.lists.findUnique({
    where: { slug },
    select: {
      id: true,
      userId: true,
      title: true,
      slug: true,
      description: true,
      coverImage: true,
      saveCount: true,
      itemCount: true,
      viewCount: true,
      categoryId: true,
      tags: true,
      badge: true,
      isPublic: true,
      isActive: true,
      categories: true,
      users: { select: { id: true, name: true, image: true, username: true, curatorLevel: true, role: true, viralListsCount: true, totalLikesReceived: true } },
      items: { orderBy: { order: 'asc' }, select: { id: true, title: true, description: true, imageUrl: true, rating: true, metadata: true } },
      _count: { select: { items: true, list_comments: true } },
    },
  });

  if (!list || !list.isActive || !list.isPublic) notFound();

  const followersCount = list.userId
    ? await prisma.follows.count({ where: { followingId: list.userId } })
    : 0;
  if (list.users?.role === 'USER') notFound();

  prisma.lists
    .update({ where: { id: list.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  const currentForSimilarity = {
    id: list.id,
    categoryId: list.categoryId,
    saveCount: list.saveCount,
    tags: list.tags ?? [],
    items: list.items.map((i) => ({ title: i.title })),
  };
  const relatedLists = await getTopSimilarLists(prisma, currentForSimilarity);

  const listWithCreator = {
    ...list,
    creatorFollowersCount: followersCount,
  };

  return (
    <>
      <ListDetailClient
        list={JSON.parse(JSON.stringify(listWithCreator))}
        relatedLists={JSON.parse(JSON.stringify(relatedLists))}
        openSuggestFromQuery={openSuggest}
      />
      <BottomNav />
    </>
  );
}
