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

/** بخش اصلی عنوان قبل از خط تیره (مثلاً «Fight Club» از «Fight Club - باشگاه مشت‌زنی») */
export function primarySuggestionTitle(text: string): string {
  const norm = normalizeSuggestionTitle(text);
  const primary = norm.split(/[-–—|]/)[0]?.trim();
  return primary && primary.length >= 2 ? primary : norm;
}

function subtitleAfterPrimary(text: string): string {
  const norm = normalizeSuggestionTitle(text);
  const parts = norm.split(/[-–—|]/);
  if (parts.length < 2) return '';
  return parts.slice(1).join(' ').replace(/\s+/g, ' ').trim();
}

/** پسوند ترجمه‌ای مثل «باشگاه مشت‌زنی»، نه زیرعنوان یک قسمت دیگر. */
function isTranslationSuffix(subtitle: string): boolean {
  if (!subtitle) return true;
  if (!/[\u0600-\u06FF]/.test(subtitle)) return false;
  return !/[a-z]{3,}/i.test(subtitle);
}

/**
 * عنوان دوزبانه یکی است («Tenet» و «Tenet - تنت»).
 * زیرعنوان لاتین یک اثر دیگر است («Mission: Impossible – Fallout»
 * با «Mission: Impossible – The Final Reckoning» یکی نیست).
 */
export function catalogTitlesMatch(a: string, b: string): boolean {
  const na = normalizeSuggestionTitle(a);
  const nb = normalizeSuggestionTitle(b);
  if (!na || !nb) return false;
  if (na === nb) return true;

  const pa = primarySuggestionTitle(a);
  const pb = primarySuggestionTitle(b);
  if (pa !== pb || pa.length < 3) return false;

  const sa = subtitleAfterPrimary(a);
  const sb = subtitleAfterPrimary(b);
  if (sa === sb) return true;
  return isTranslationSuffix(sa) && isTranslationSuffix(sb);
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
