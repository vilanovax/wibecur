import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { dbQuery } from '@/lib/db';
import ItemDetailClient from './ItemDetailClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.items.findUnique({
    where: { id },
    select: { title: true, description: true },
  });

  if (!item) {
    return {
      title: 'آیتم یافت نشد',
    };
  }

  return {
    title: `${item.title} | WibeCur`,
    description: item.description || `مشاهده ${item.title}`,
  };
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const item = await prisma.items.findUnique({
    where: { id },
    include: {
      lists: {
        include: {
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
  });

  if (!item) {
    notFound();
  }

  // Check if user has liked this item
  let isLiked = false;
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    const user = await dbQuery(() =>
      prisma.users.findUnique({
        where: { email: session.user.email! },
        select: { id: true },
      })
    );

    if (user) {
      const existingVote = await dbQuery(() =>
        prisma.item_votes.findUnique({
          where: {
            userId_itemId: {
              userId: user.id,
              itemId: id,
            },
          },
        })
      );
      isLiked = !!existingVote;
    }
  }

  // Serialize the item data for client component
  const serializedItem = {
    id: item.id,
    title: item.title,
    description: item.description,
    imageUrl: item.imageUrl,
    externalUrl: item.externalUrl,
    rating: item.rating,
    voteCount: item.voteCount,
    metadata: item.metadata,
    lists: {
      id: item.lists.id,
      title: item.lists.title,
      slug: item.lists.slug,
      categories: item.lists.categories,
    },
    users: item.lists.users ? {
      name: item.lists.users.name,
    } : null,
    isLiked,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title={item.title} showBack />
      <ItemDetailClient item={serializedItem} />
      <BottomNav />
    </div>
  );
}

