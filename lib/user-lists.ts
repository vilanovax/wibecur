import { prisma } from './prisma';
import type { Prisma } from '@prisma/client';

export type UserListFilter = 'all' | 'public' | 'private' | 'personal' | 'draft';

export type UserListVisibilityCounts = {
  public: number;
  personal: number;
};

export const USER_LIST_SELECT = {
  id: true,
  title: true,
  slug: true,
  description: true,
  coverImage: true,
  categoryId: true,
  userId: true,
  tags: true,
  badge: true,
  isPublic: true,
  isFeatured: true,
  isActive: true,
  likeCount: true,
  viewCount: true,
  saveCount: true,
  itemCount: true,
  commentsEnabled: true,
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
  _count: {
    select: {
      items: true,
      list_likes: true,
      bookmarks: true,
    },
  },
} as const;

export type UserListRecord = Prisma.listsGetPayload<{ select: typeof USER_LIST_SELECT }>;

export function buildUserListsWhere(
  userId: string,
  filter: UserListFilter = 'all'
): Prisma.listsWhereInput {
  const base: Prisma.listsWhereInput = {
    userId,
    deletedAt: null,
  };

  if (filter === 'public') {
    return { ...base, isPublic: true, isActive: { not: false } };
  }
  if (filter === 'private') {
    return { ...base, isPublic: false };
  }
  if (filter === 'personal') {
    return {
      ...base,
      OR: [{ isPublic: false }, { isActive: false }],
    };
  }
  if (filter === 'draft') {
    return { ...base, isActive: false };
  }

  return base;
}

export async function fetchUserListVisibilityCounts(
  userId: string
): Promise<UserListVisibilityCounts> {
  const [publicCount, personalCount] = await Promise.all([
    prisma.lists.count({ where: buildUserListsWhere(userId, 'public') }),
    prisma.lists.count({ where: buildUserListsWhere(userId, 'personal') }),
  ]);
  return { public: publicCount, personal: personalCount };
}

export async function fetchUserLists(
  userId: string,
  options: { page?: number; limit?: number; filter?: UserListFilter } = {}
) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const filter = options.filter ?? 'all';
  const skip = (page - 1) * limit;
  const where = buildUserListsWhere(userId, filter);

  const [lists, total, counts] = await Promise.all([
    prisma.lists.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ saveCount: 'desc' }, { likeCount: 'desc' }, { updatedAt: 'desc' }],
      select: USER_LIST_SELECT,
    }),
    prisma.lists.count({ where }),
    page === 1 ? fetchUserListVisibilityCounts(userId) : Promise.resolve(undefined),
  ]);

  return {
    lists,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    ...(counts ? { counts } : {}),
  };
}
