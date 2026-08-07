/** نرمال‌سازی املای فارسی/عربی برای مقایسه — بدون وابستگی به people.ts */
export function normalizePersonSpelling(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .trim()
    .toLowerCase()
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\u200c\u200d]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);

  for (let j = 0; j <= b.length; j += 1) prev[j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1]! + 1, prev[j]! + 1, prev[j - 1]! + cost);
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j]!;
  }

  return prev[b.length]!;
}

/** امتیاز شباهت ۰–۱ — ۱ یعنی یکسان */
export function personNameSimilarityScore(a: string, b: string): number {
  const left = normalizePersonSpelling(a);
  const right = normalizePersonSpelling(b);
  if (!left || !right) return 0;
  if (left === right) return 1;

  const maxLen = Math.max(left.length, right.length);
  if (maxLen === 0) return 0;

  const distance = levenshteinDistance(left, right);
  return Math.max(0, 1 - distance / maxLen);
}

export function personNamesLikelySamePerson(a: string, b: string, minScore = 0.84): boolean {
  return personNameSimilarityScore(a, b) >= minScore;
}

function bucketFromWord(word: string): string {
  const compact = word.replace(/[یو]/g, '');
  return compact.slice(0, Math.min(4, compact.length));
}

export function personSpellingBucketKey(name: string): string {
  const normalized = normalizePersonSpelling(name);
  const firstWord = normalized.split(' ')[0] ?? normalized;
  return bucketFromWord(firstWord);
}

/** کلیدهای سطل — نام خانوادگی هم برای تطابق املاهای متفاوت (استیون/استیفن کینگ) */
export function personSpellingBucketKeys(name: string): string[] {
  const normalized = normalizePersonSpelling(name);
  const words = normalized.split(' ').filter(Boolean);
  const keys = new Set<string>();
  if (words[0]) keys.add(bucketFromWord(words[0]!));
  const lastWord = words.length > 1 ? words[words.length - 1]! : null;
  if (lastWord && lastWord.length >= 3) keys.add(bucketFromWord(lastWord));
  return [...keys];
}
