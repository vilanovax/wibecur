/** حداکثر فاصله ویرایشی مجاز بر اساس طول کلمه */
export function maxEditDistance(length: number): number {
  if (length <= 3) return 0;
  if (length <= 5) return 1;
  if (length <= 9) return 2;
  return 2;
}

export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));

  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[a.length][b.length];
}

export function fuzzyTokenEquals(a: string, b: string): boolean {
  const x = a.toLowerCase().trim();
  const y = b.toLowerCase().trim();
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.includes(y) || y.includes(x)) return true;

  const maxLen = Math.max(x.length, y.length);
  const minLen = Math.min(x.length, y.length);
  if (maxLen < 4 || maxLen - minLen > maxEditDistance(maxLen)) return false;

  return levenshteinDistance(x, y) <= maxEditDistance(maxLen);
}

export type FuzzyTextMatch = {
  matched: boolean;
  matchedText?: string;
  distance?: number;
};

/** تطابق فازی کوئری با یک فیلد متنی (کلمه‌به‌کلمه) */
export function fuzzyMatchInText(query: string, text: string): FuzzyTextMatch {
  const q = query.toLowerCase().trim();
  if (!q || !text) return { matched: false };

  const haystack = text.toLowerCase();
  if (haystack.includes(q)) return { matched: true, matchedText: q, distance: 0 };

  const words = haystack.split(/[\s,،\-–—|:]+/).filter((w) => w.length >= 3);
  for (const word of words) {
    if (fuzzyTokenEquals(q, word)) {
      return {
        matched: true,
        matchedText: word,
        distance: levenshteinDistance(q, word),
      };
    }
  }

  return { matched: false };
}

/** زیررشته‌های پایدار برای OR در Prisma — typoها را به candidate pool می‌رساند */
export function buildFuzzyDbAnchors(token: string, minLen = 4): string[] {
  const t = token.toLowerCase().trim();
  if (t.length < minLen) return t.length >= 2 ? [t] : [];

  const anchors = new Set<string>([t]);
  const windowSize = Math.min(5, Math.max(minLen, t.length - 2));

  for (let size = minLen; size <= windowSize; size++) {
    for (let i = 0; i <= t.length - size; i++) {
      anchors.add(t.slice(i, i + size));
    }
  }

  return [...anchors].filter((s) => s.length >= minLen);
}

export function expandDbSearchAnchors(tokens: string[]): string[] {
  const out = new Set<string>();
  for (const token of tokens) {
    for (const anchor of buildFuzzyDbAnchors(token)) {
      out.add(anchor);
    }
  }
  return [...out];
}
