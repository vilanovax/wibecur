import { normalizeBookTitle, stripBookTitlePrefix } from '@/lib/books/normalize';

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], row[j], prev) + 1;
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}

function similarityRatio(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 100;
  const dist = levenshtein(a, b);
  return Math.round((1 - dist / maxLen) * 100);
}

function tokenSet(text: string): string[] {
  return normalizeBookTitle(text)
    .split(' ')
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}

/** امتیاز تطابق عنوان ۰–۱۰۰ */
export function titleMatchScore(query: string, candidate: string): number {
  const q = normalizeBookTitle(stripBookTitlePrefix(query));
  const c = normalizeBookTitle(stripBookTitlePrefix(candidate));
  if (!q || !c) return 0;
  if (q === c) return 100;
  if (c.includes(q) || q.includes(c)) return Math.max(88, similarityRatio(q, c));

  const qTokens = tokenSet(q);
  const cTokens = tokenSet(c);
  if (qTokens.length === 0 || cTokens.length === 0) return similarityRatio(q, c);

  let overlap = 0;
  for (const qt of qTokens) {
    if (cTokens.some((ct) => ct === qt || ct.includes(qt) || qt.includes(ct))) overlap++;
  }
  const tokenScore = Math.round((overlap / qTokens.length) * 100);
  const levScore = similarityRatio(q, c);
  return Math.max(tokenScore, levScore);
}

export function pickBestTitleMatch<T extends { title: string }>(
  query: string,
  candidates: T[],
  minScore: number
): (T & { matchScore: number }) | null {
  let best: (T & { matchScore: number }) | null = null;
  for (const c of candidates) {
    const score = titleMatchScore(query, c.title);
    if (score < minScore) continue;
    if (!best || score > best.matchScore) {
      best = { ...c, matchScore: score };
    }
  }
  return best;
}
