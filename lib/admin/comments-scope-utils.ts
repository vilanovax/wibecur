/** منبع کامنت: کاربر واقعی یا تولیدشده (seed) */
export type CommentOriginKind = 'all' | 'user' | 'seeded';

const VALID_ORIGINS = new Set<CommentOriginKind>(['all', 'user', 'seeded']);

export function parseCommentOrigin(
  value: string | undefined,
  /** سازگاری با filter=seeded قدیمی */
  legacyFilter?: string
): CommentOriginKind {
  if (value && VALID_ORIGINS.has(value as CommentOriginKind)) {
    return value as CommentOriginKind;
  }
  if (legacyFilter === 'seeded') return 'seeded';
  return 'all';
}

export const COMMENT_ORIGIN_OPTIONS: { value: CommentOriginKind; label: string }[] = [
  { value: 'all', label: 'همه منابع' },
  { value: 'user', label: 'کاربران' },
  { value: 'seeded', label: 'ساختگی (AI)' },
];

export function parseScopeId(value: string | undefined): string {
  return value?.trim() || '';
}
