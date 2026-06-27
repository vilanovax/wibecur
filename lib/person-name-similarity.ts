import { personIdentityMatches, personSlug, type PersonRole } from '@/lib/people';
import {
  normalizePersonSpelling,
  personNameSimilarityScore,
  personNamesLikelySamePerson,
  personSpellingBucketKey,
} from '@/lib/person-spelling';

export {
  normalizePersonSpelling,
  personNameSimilarityScore,
  personNamesLikelySamePerson,
} from '@/lib/person-spelling';

export type SimilarPersonCandidate = {
  role: PersonRole;
  slug: string;
  displayName: string;
  itemCount: number;
  hasBio: boolean;
};

export type SimilarPersonGroup = {
  role: PersonRole;
  score: number;
  reason: string;
  members: SimilarPersonCandidate[];
  suggestedCanonicalSlug: string;
};


function pickSuggestedCanonical(members: SimilarPersonCandidate[]): string {
  return members
    .slice()
    .sort((a, b) => {
      if (a.hasBio !== b.hasBio) return a.hasBio ? -1 : 1;
      if (b.itemCount !== a.itemCount) return b.itemCount - a.itemCount;
      return a.displayName.localeCompare(b.displayName);
    })[0]!.slug;
}

function describeSimilarityReason(score: number, a: string, b: string): string {
  const left = normalizePersonSpelling(a);
  const right = normalizePersonSpelling(b);
  if (left === right) return 'املای نرمال‌شده یکسان';
  if (score >= 0.92) return 'تفاوت املایی جزئی';
  if (score >= 0.85) return 'شباهت املایی بالا';
  return 'شباهت املایی';
}

/** گروه‌های پیشنهادی برای ادغام — فقط موارد با slug متفاوت */
export function findSimilarPersonGroups(
  people: SimilarPersonCandidate[],
  options?: { minScore?: number; maxGroups?: number }
): SimilarPersonGroup[] {
  const minScore = options?.minScore ?? 0.84;
  const maxGroups = options?.maxGroups ?? 80;
  const groups: SimilarPersonGroup[] = [];
  const seenPairKeys = new Set<string>();

  const byRole = new Map<PersonRole, SimilarPersonCandidate[]>();
  for (const person of people) {
    const list = byRole.get(person.role) ?? [];
    list.push(person);
    byRole.set(person.role, list);
  }

  for (const [role, rolePeople] of byRole) {
    const buckets = new Map<string, SimilarPersonCandidate[]>();
    for (const person of rolePeople) {
      const key = personSpellingBucketKey(person.displayName);
      const bucket = buckets.get(key) ?? [];
      bucket.push(person);
      buckets.set(key, bucket);
    }

    for (const bucket of buckets.values()) {
      if (bucket.length < 2) continue;

      for (let i = 0; i < bucket.length; i += 1) {
        for (let j = i + 1; j < bucket.length; j += 1) {
          const a = bucket[i]!;
          const b = bucket[j]!;
          if (a.slug === b.slug) continue;

          if (
            personIdentityMatches(
              { role, slug: a.slug, displayName: a.displayName },
              { role, slug: b.slug, displayName: b.displayName }
            )
          ) {
            continue;
          }

          const score = personNameSimilarityScore(a.displayName, b.displayName);
          if (score < minScore) continue;

          const pairKey = [a.slug, b.slug].sort().join('|');
          if (seenPairKeys.has(pairKey)) continue;
          seenPairKeys.add(pairKey);

          const members = [a, b];
          groups.push({
            role,
            score,
            reason: describeSimilarityReason(score, a.displayName, b.displayName),
            members,
            suggestedCanonicalSlug: pickSuggestedCanonical(members),
          });
        }
      }
    }
  }

  return groups
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.members.reduce((sum, m) => sum + m.itemCount, 0) -
          left.members.reduce((sum, m) => sum + m.itemCount, 0)
    )
    .slice(0, maxGroups);
}

export function buildMergedDisplayName(names: string[]): string {
  const unique = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
  return unique.join(' · ');
}

export function personSlugFromDisplayName(name: string): string {
  return personSlug(name);
}
