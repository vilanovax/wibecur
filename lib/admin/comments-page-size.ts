export const COMMENTS_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export type CommentsPageSize = (typeof COMMENTS_PAGE_SIZE_OPTIONS)[number];

export const DEFAULT_COMMENTS_PAGE_SIZE: CommentsPageSize = 10;

export function parseCommentsPageSize(value: string | undefined): CommentsPageSize {
  const n = parseInt(value ?? '', 10);
  if (n === 20 || n === 50) return n;
  if (n === 10) return 10;
  return DEFAULT_COMMENTS_PAGE_SIZE;
}
