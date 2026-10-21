/**
 * Client-safe lists browse types/constants — no next/cache or Prisma runtime.
 * Server fetch lives in lib/lists-browse.ts (server-only).
 */

export type ListsBrowseSort = 'newest' | 'popular' | 'most_saved' | 'rising';

export const LISTS_BROWSE_DEFAULT_LIMIT = 48;
/** First paint SSR payload — keep small; client remote-paginates the rest. */
export const LISTS_SSR_LIMIT = 48;
/** Max rows per browse API/page request (also caps SSR). */
export const LISTS_BROWSE_MAX_LIMIT = 48;

export const LISTS_BROWSE_CACHE_TAG = 'lists-browse';

export type ListsBrowseList = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string;
  bannerImage: string;
  categoryId: string | null;
  badge: string | null;
  isPublic: boolean;
  isFeatured: boolean;
  isActive: boolean;
  likeCount: number;
  saveCount: number;
  itemCount: number;
  createdAt: string;
  categories: {
    id: string;
    name: string;
    slug: string | null;
    icon: string | null;
  } | null;
};

export type ListsBrowseResult = {
  lists: ListsBrowseList[];
  pagination: {
    offset: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};
