import { createHash } from 'crypto';

/**
 * weightedScore = (up + 1) / (up + down + 2)
 * Bayesian-style: prevents 1up/0down from ranking too high
 */
export function computeWeightedScore(helpfulUp: number, helpfulDown: number): number {
  const up = Math.max(0, helpfulUp);
  const down = Math.max(0, helpfulDown);
  return (up + 1) / (up + down + 2);
}

/**
 * Normalize content for duplicate detection:
 * trim, collapse spaces, lowercase, remove repeated emoji
 */
export function normalizeCommentText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u2600-\u26FF]|[\u2700-\u27BF]/gu, '');
}

/**
 * SHA256 hash of normalized content for duplicate check
 */
export function hashCommentContent(normalized: string): string {
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Validate content heuristics:
 * - min 5 chars
 * - max 1 URL
 * - not only emoji/punctuation
 */
export function validateCommentContent(content: string): {
  valid: boolean;
  error?: string;
  shouldReview?: boolean;
} {
  const trimmed = content.trim();
  if (trimmed.length < 5) {
    return { valid: false, error: 'یه توضیح کوتاه هم بنویس 🙂' };
  }

  const urlRegex = /https?:\/\/[^\s]+/gi;
  const urls = trimmed.match(urlRegex) || [];
  if (urls.length > 1) {
    return { valid: false, error: 'فعلاً لینک نمی‌تونیم منتشر کنیم اگه میشه با متن توضیح بده 🙂' };
  }
  if (urls.length === 1) {
    return { valid: true, shouldReview: true };
  }

  const withoutEmoji = trimmed.replace(/\p{Emoji_Presentation}/gu, '').replace(/\s/g, '');
  const hasContent = /[\p{L}\p{N}]/u.test(withoutEmoji) && withoutEmoji.length >= 2;
  if (!hasContent) {
    return { valid: false, error: 'یه توضیح کوتاه هم بنویس 🙂' };
  }

  return { valid: true };
}
