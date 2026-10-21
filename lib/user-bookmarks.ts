import { prisma } from './prisma';

const BOOKMARK_LIST_SELECT = {
  id: true,
  title: true,
  slug: true,
  coverImage: true,
  itemCount: true,
  likeCount: true,
  saveCount: true,
  updatedAt: true,
  categories: {
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
    },
  },
} as const;

async function fetchBookmarksPage(userId: string, skip: number, limit: number) {
  const where = {
    userId,
    lists: { deletedAt: null },
  };

  return Promise.all([
    prisma.bookmarks.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        lists: { select: BOOKMARK_LIST_SELECT },
      },
    }),
    prisma.bookmarks.count({ where }),
  ]);
}

export async function fetchUserBookmarks(
  userId: string,
  options: { page?: number; limit?: number } = {}
) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const skip = (page - 1) * limit;

  const [rows, total] = await fetchBookmarksPage(userId, skip, limit);
  return formatBookmarks(rows, page, limit, total);
}

function formatBookmarks(
  rows: Awaited<ReturnType<typeof fetchBookmarksPage>>[0],
  page: number,
  limit: number,
  total: number
) {
  const bookmarks = rows
    .filter((b) => b.lists)
    .map((b) => ({
      id: b.id,
      list: b.lists,
      createdAt: b.createdAt,
    }));

  return {
    bookmarks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
