import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

/**
 * Normalize title for duplicate suggestion check:
 * trim, lowercase, collapse spaces (same as comment text).
 */
export function normalizeSuggestionTitle(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export type DuplicateSuggestionResult =
  | { exists: false }
  | { exists: true; suggestionCommentId?: string };

/**
 * Check if a suggestion with the same normalized title already exists for this list
 * (in list_comments type=suggestion or in suggested_items).
 * Returns suggestionCommentId when the duplicate is a list_comment (for scroll-to).
 */
export async function checkDuplicateSuggestion(
  listId: string,
  title: string
): Promise<DuplicateSuggestionResult> {
  const normalized = normalizeSuggestionTitle(title);
  if (!normalized) return { exists: false };

  const [comments, suggestedItems] = await Promise.all([
    dbQuery(() =>
      prisma.list_comments.findMany({
        where: {
          listId,
          type: 'suggestion',
          deletedAt: null,
          suggestionStatus: { in: ['pending', 'approved'] },
        },
        select: { id: true, content: true },
      })
    ),
    dbQuery(() =>
      prisma.suggested_items.findMany({
        where: {
          listId,
          status: { in: ['pending', 'approved'] },
        },
        select: { title: true },
      })
    ),
  ]);

  const commentMatch = comments.find((c) => normalizeSuggestionTitle(c.content) === normalized);
  if (commentMatch) return { exists: true, suggestionCommentId: commentMatch.id };

  const itemMatch = suggestedItems.some((i) => normalizeSuggestionTitle(i.title) === normalized);
  if (itemMatch) return { exists: true, suggestionCommentId: undefined };

  return { exists: false };
}
