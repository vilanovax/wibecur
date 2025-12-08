import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import Pagination from '@/components/admin/shared/Pagination';
import UserCreatedListsPageClient from './UserCreatedListsPageClient';

const ITEMS_PER_PAGE = 20;

export default async function UserCreatedListsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string; search?: string }>;
}) {
  await requireAdmin();

  const { page = '1', filter = 'all', search = '' } = await searchParams;
  const currentPage = parseInt(page, 10) || 1;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  // Get bad words for filtering
  let badWordsList: string[] = [];
  try {
    const badWords = await dbQuery(() =>
      prisma.bad_words.findMany({
        select: { word: true },
      })
    );
    badWordsList = badWords.map((bw) => bw.word.toLowerCase());
  } catch (err) {
    console.warn('Could not fetch bad words:', err);
  }

  // Build where clause - always filter by user role first
  const where: any = {
    users: {
      role: 'USER', // Only user-created lists
    },
  };

  // Apply filter conditions
  if (filter === 'bad_words') {
    // Lists with bad words in title
    if (badWordsList.length === 0) {
      return (
        <UserCreatedListsPageClient
          lists={[]}
          currentFilter={filter}
          currentSearch={search}
          badWords={badWordsList}
          totalCount={0}
          currentPage={currentPage}
          totalPages={0}
        />
      );
    }

    const badWordConditions = badWordsList.map((word) => ({
      title: {
        contains: word,
        mode: 'insensitive',
      },
    }));

    where.AND = [
      { users: { role: 'USER' } },
      { OR: badWordConditions },
    ];

    if (search) {
      where.AND.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }
    delete where.users;
  } else {
    // For other filters (public, private, inactive, all)
    if (filter === 'public') {
      where.isPublic = true;
      where.isActive = true;
    } else if (filter === 'private') {
      where.isPublic = false;
      where.isActive = true;
    } else if (filter === 'inactive') {
      where.isActive = false;
    }
    // For 'all' filter, show all lists (no additional filter conditions)

    // Add search condition if exists
    if (search) {
      const conditions: any[] = [
        { users: { role: 'USER' } },
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];

      // Add filter conditions if they exist
      if (where.isPublic !== undefined) {
        conditions.push({ isPublic: where.isPublic });
      }
      if (where.isActive !== undefined) {
        conditions.push({ isActive: where.isActive });
      }

      where.AND = conditions;
      delete where.users;
      delete where.isPublic;
      delete where.isActive;
    }
  }

  const [totalCount, lists] = await Promise.all([
    dbQuery(() =>
      prisma.lists.count({
        where,
      })
    ),
    dbQuery(() =>
      prisma.lists.findMany({
        where,
        skip,
        take: ITEMS_PER_PAGE,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          coverImage: true,
          isPublic: true,
          isActive: true,
          commentsEnabled: true,
          itemCount: true,
          createdAt: true,
          updatedAt: true,
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
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          _count: {
            select: {
              items: true,
              list_likes: true,
              bookmarks: true,
            },
          },
        },
      })
    ),
  ]);


  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Mark lists with bad words
  const processedLists = lists.map((list) => {
    let hasBadWord = false;
    if (badWordsList.length > 0) {
      const titleLower = list.title.toLowerCase();
      hasBadWord = badWordsList.some((word) => titleLower.includes(word));
    }

    return {
      ...list,
      hasBadWord,
      createdAt: list.createdAt.toISOString(),
      updatedAt: list.updatedAt.toISOString(),
    };
  });

  return (
    <UserCreatedListsPageClient
      lists={processedLists}
      currentFilter={filter}
      currentSearch={search}
      badWords={badWordsList}
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
    />
  );
}

