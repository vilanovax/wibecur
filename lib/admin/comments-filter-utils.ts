export type CommentFilterKind =
  | 'all'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'flagged'
  | 'filtered'
  | 'reported';

const VALID_FILTERS = new Set<CommentFilterKind>([
  'all',
  'pending',
  'approved',
  'rejected',
  'flagged',
  'filtered',
  'reported',
]);

export function parseCommentFilter(value: string | undefined): CommentFilterKind {
  if (value && VALID_FILTERS.has(value as CommentFilterKind)) {
    return value as CommentFilterKind;
  }
  return 'all';
}
