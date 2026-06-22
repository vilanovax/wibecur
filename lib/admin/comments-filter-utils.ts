export type CommentFilterKind =
  | 'all'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'flagged'
  | 'filtered'
  | 'reported'
  | 'seeded';

const VALID_FILTERS = new Set<CommentFilterKind>([
  'all',
  'pending',
  'approved',
  'rejected',
  'flagged',
  'filtered',
  'reported',
  'seeded',
]);

export function parseCommentFilter(value: string | undefined): CommentFilterKind {
  if (value && VALID_FILTERS.has(value as CommentFilterKind)) {
    return value as CommentFilterKind;
  }
  return 'all';
}
