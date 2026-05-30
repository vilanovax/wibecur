import { prisma } from './prisma';

const LIST_USER_SELECT = {
  id: true,
  name: true,
  username: true,
  image: true,
} as const;

const LIST_USER_SELECT_WITH_LEVEL = {
  ...LIST_USER_SELECT,
  curatorLevel: true,
} as const;

const LIST_INCLUDE = {
  categories: {
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      color: true,
    },
  },
  _count: {
    select: {
      items: true,
      list_likes: true,
      bookmarks: true,
    },
  },
} as const;

async function fetchBookmarksPage(
  userId: string,
  skip: number,
  limit: number,
  withCuratorLevel: boolean
) {
  const where = {
    userId,
    lists: { deletedAt: null },
  };

  const listInclude = {
    ...LIST_INCLUDE,
    users: {
      select: withCuratorLevel ? LIST_USER_SELECT_WITH_LEVEL : LIST_USER_SELECT,
    },
  };

  return Promise.all([
    prisma.bookmarks.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { lists: { include: listInclude } },
    }),
    prisma.bookmarks.count({ where }),
  ]);
}

export async function fetchUserBookmarks(
  userId: string,
  options: { page?: number; limit?: number } = {}
) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 50;
  const skip = (page - 1) * limit;

  try {
    const [rows, total] = await fetchBookmarksPage(userId, skip, limit, true);
    return formatBookmarks(rows, page, limit, total);
  } catch (firstErr) {
    const msg = firstErr instanceof Error ? firstErr.message : '';
    const isFieldError =
      (firstErr as { name?: string }).name === 'PrismaClientValidationError' ||
      msg.includes('Unknown field') ||
      (msg.includes('column') && msg.includes('does not exist'));

    if (isFieldError) {
      const [rows, total] = await fetchBookmarksPage(userId, skip, limit, false);
      return formatBookmarks(rows, page, limit, total);
    }
    throw firstErr;
  }
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
      list: {
        ...b.lists,
        users: b.lists.users
          ? {
              ...b.lists.users,
              curatorLevel:
                'curatorLevel' in b.lists.users
                  ? (b.lists.users as { curatorLevel?: string }).curatorLevel ?? 'EXPLORER'
                  : 'EXPLORER',
            }
          : null,
      },
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
