import { prisma } from '@/lib/prisma';

export type ItemSuggestionSource = 'form' | 'menu';

export type UnifiedItemSuggestion = {
  id: string;
  source: ItemSuggestionSource;
  title: string;
  description: string | null;
  imageUrl: string | null;
  externalUrl: string | null;
  listId: string;
  userId: string;
  status: string;
  adminNotes: string | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
  lists: {
    id: string;
    title: string;
    slug: string;
    categories: { id: string; name: string; icon: string; slug: string };
  };
  users: { id: string; name: string | null; email: string };
};

const listInclude = {
  lists: {
    include: {
      categories: true,
    },
  },
  users: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;

function mapFormSuggestion(s: Awaited<ReturnType<typeof fetchFormSuggestions>>[number]): UnifiedItemSuggestion {
  return {
    id: s.id,
    source: 'form',
    title: s.title,
    description: s.description,
    imageUrl: s.imageUrl,
    externalUrl: s.externalUrl,
    listId: s.listId,
    userId: s.userId,
    status: s.status,
    adminNotes: s.adminNotes,
    metadata: s.metadata,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    lists: {
      id: s.lists.id,
      title: s.lists.title,
      slug: s.lists.slug,
      categories: s.lists.categories ?? {
        id: '',
        name: '—',
        icon: '📋',
        slug: 'general',
      },
    },
    users: s.users,
  };
}

function mapMenuSuggestion(c: Awaited<ReturnType<typeof fetchMenuSuggestions>>[number]): UnifiedItemSuggestion {
  return {
    id: c.id,
    source: 'menu',
    title: c.content.trim(),
    description: null,
    imageUrl: null,
    externalUrl: null,
    listId: c.listId,
    userId: c.userId,
    status: c.suggestionStatus ?? 'pending',
    adminNotes: null,
    metadata: null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    lists: {
      id: c.lists.id,
      title: c.lists.title,
      slug: c.lists.slug,
      categories: c.lists.categories ?? {
        id: '',
        name: '—',
        icon: '📋',
        slug: 'general',
      },
    },
    users: c.users,
  };
}

async function fetchFormSuggestions(status?: string) {
  const where: { status?: string } = {};
  if (status) where.status = status;
  return prisma.suggested_items.findMany({
    where,
    include: listInclude,
  });
}

async function fetchMenuSuggestions(status?: string) {
  return prisma.list_comments.findMany({
    where: status
      ? { type: 'suggestion', deletedAt: null, suggestionStatus: status }
      : {
          type: 'suggestion',
          deletedAt: null,
          suggestionStatus: { in: ['pending', 'approved', 'rejected'] },
        },
    include: listInclude,
  });
}

export async function fetchUnifiedItemSuggestions(options: {
  status?: string;
  sort?: 'newest' | 'oldest';
  page?: number;
  limit?: number;
  source?: ItemSuggestionSource | 'all';
}): Promise<{
  suggestions: UnifiedItemSuggestion[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const sort = options.sort ?? 'newest';
  const source = options.source ?? 'all';

  let merged: UnifiedItemSuggestion[] = [];

  if (source === 'all' || source === 'form') {
    const formRows = await fetchFormSuggestions(options.status);
    merged.push(...formRows.map(mapFormSuggestion));
  }

  if (source === 'all' || source === 'menu') {
    const menuRows = await fetchMenuSuggestions(options.status);
    merged.push(...menuRows.map(mapMenuSuggestion));
  }

  merged.sort((a, b) => {
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    return sort === 'oldest' ? ta - tb : tb - ta;
  });

  const total = merged.length;
  const skip = (page - 1) * limit;
  const suggestions = merged.slice(skip, skip + limit);

  return {
    suggestions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
