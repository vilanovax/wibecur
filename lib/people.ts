import { slugifyCategoryName } from '@/lib/admin/category-slug';
import { personNamesLikelySamePerson, personSpellingBucketKeys } from '@/lib/person-spelling';

export type PersonRole = 'director' | 'author' | 'translator' | 'actor';

export const PERSON_ROLE_META: Record<
  PersonRole,
  { label: string; pluralLabel: string; icon: string; metadataKey: string }
> = {
  director: { label: 'کارگردان', pluralLabel: 'کارگردان', icon: '🎬', metadataKey: 'director' },
  author: { label: 'نویسنده', pluralLabel: 'نویسنده', icon: '✍️', metadataKey: 'author' },
  translator: { label: 'مترجم', pluralLabel: 'مترجم', icon: '📖', metadataKey: 'translator' },
  actor: { label: 'بازیگر', pluralLabel: 'بازیگر', icon: '🎭', metadataKey: 'actors' },
};

export const PERSON_ROLES = Object.keys(PERSON_ROLE_META) as PersonRole[];

export type PersonPageItem = {
  id: string;
  title: string;
  imageUrl: string | null;
  displayImageUrl: string;
  categorySlug: string | null;
  categoryIcon: string | null;
  listSlug: string;
  rating: number | null;
};

export type PersonPageData = {
  role: PersonRole;
  slug: string;
  displayName: string;
  bio: string | null;
  bioIsStub: boolean;
  imageUrl: string | null;
  externalUrl: string | null;
  profileStatus: PersonProfileStatus | null;
  items: PersonPageItem[];
};

export function isPersonRole(value: string): value is PersonRole {
  return value in PERSON_ROLE_META;
}

/** حروف لاتین گسترده که NFKD آن‌ها را به ASCII تبدیل نمی‌کند — Đ، ł، ø … */
const LATIN_EXTENDED_CHAR_MAP: Record<string, string> = {
  '\u0110': 'D',
  '\u0111': 'd',
  '\u00D0': 'D',
  '\u00F0': 'd',
  '\u0141': 'L',
  '\u0142': 'l',
  '\u00D8': 'O',
  '\u00F8': 'o',
  '\u00DF': 'ss',
  '\u00E6': 'ae',
  '\u00C6': 'AE',
  '\u0153': 'oe',
  '\u0152': 'OE',
  '\u0131': 'i',
  '\u0130': 'I',
};

export function normalizeLatinExtendedText(text: string): string {
  let out = '';
  for (const char of text) {
    out += LATIN_EXTENDED_CHAR_MAP[char] ?? char;
  }
  return out;
}

/** کلید یکسان برای مقایسه نام‌های نمایشی */
export function normalizePersonDisplayName(name: string): string {
  return normalizeLatinExtendedText(name)
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/** slug یکتا برای URL — فارسی transliterate می‌شود */
export function personSlug(name: string): string {
  const normalized = normalizeLatinExtendedText(name)
    .trim()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '');
  const base = slugifyCategoryName(normalized);
  if (base && base !== 'category') return base;
  return (
    normalized
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\u0600-\u06FF-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') || 'person'
  );
}

export type PersonProfileStatus = 'draft' | 'published';

export function personPagePath(role: PersonRole, name: string): string {
  return personPublicPath(role, personSlug(name));
}

/** مسیر عمومی صفحه شخص — همیشه از slug ذخیره‌شده استفاده کنید */
export function personPublicPath(role: PersonRole, slug: string): string {
  return `/people/${role}/${slug}`;
}

export function isPersonPublicReady(person: {
  hasBio: boolean;
  hasProfile: boolean;
  profileStatus: PersonProfileStatus | null;
  itemCount: number;
}): boolean {
  return (
    person.itemCount > 0 &&
    person.hasProfile &&
    person.hasBio &&
    person.profileStatus === 'published'
  );
}

/** مقایسه slug بدون حساسیت به خط تیره — joseph-gordon-levitt ≈ joseph-gordonlevitt */
export function normalizePersonSlugCompare(slug: string): string {
  return slug.toLowerCase().replace(/-/g, '');
}

export function personSlugsMatch(a: string, b: string): boolean {
  return normalizePersonSlugCompare(a) === normalizePersonSlugCompare(b);
}

function normalizeSlugPart(part: string): string {
  return part
    .replace(/^dj/, 'd')
    .replace(/^zh/, 'z')
    .replace(/^kh/, 'h');
}

/** تطبیق fuzzy برای djuric/duric و موارد مشابه */
export function personSlugsFuzzyMatch(a: string, b: string): boolean {
  if (personSlugsMatch(a, b)) return true;
  const partsA = a.toLowerCase().split('-').filter(Boolean);
  const partsB = b.toLowerCase().split('-').filter(Boolean);
  if (partsA.length !== partsB.length || partsA.length === 0) return false;
  return partsA.every((partA, index) => slugPartsSimilar(partA, partsB[index]!));
}

function slugPartsSimilar(partA: string, partB: string): boolean {
  if (partA === partB) return true;
  const normA = normalizeSlugPart(partA);
  const normB = normalizeSlugPart(partB);
  return normA === normB;
}

/** tony-leung ≈ tony-leung-chiu-wai — نام کوتاه/بلند در metadata */
export function personSlugsPrefixMatch(a: string, b: string): boolean {
  if (personSlugsMatch(a, b)) return true;
  const partsA = a.toLowerCase().split('-').filter(Boolean);
  const partsB = b.toLowerCase().split('-').filter(Boolean);
  if (partsA.length === partsB.length || partsA.length === 0 || partsB.length === 0) {
    return false;
  }
  const [shorter, longer] =
    partsA.length < partsB.length ? [partsA, partsB] : [partsB, partsA];
  // حداقل دو بخش — جلوگیری از ادغام/حذف اشتباه «dan» با «daniel-day-lewis»
  if (shorter.length < 2) return false;
  return shorter.every((part, index) => slugPartsSimilar(part, longer[index]!));
}

export function nameMatchesSlug(name: string, slug: string): boolean {
  return personSlugsMatch(personSlug(name), slug);
}

export function personIdentityMatches(
  a: {
    role: PersonRole;
    slug: string;
    displayName?: string;
    externalUrl?: string | null;
  },
  b: {
    role: PersonRole;
    slug: string;
    displayName?: string;
    externalUrl?: string | null;
  }
): boolean {
  if (a.role !== b.role) return false;
  if (a.slug === b.slug) return true;
  if (personSlugsMatch(a.slug, b.slug)) return true;
  if (personSlugsFuzzyMatch(a.slug, b.slug)) return true;
  if (personSlugsPrefixMatch(a.slug, b.slug)) return true;
  const imdbA = extractImdbNameId(a.externalUrl);
  const imdbB = extractImdbNameId(b.externalUrl);
  if (imdbA && imdbB && imdbA === imdbB) return true;
  if ((imdbA || imdbB) && personSlugsPrefixMatch(a.slug, b.slug)) return true;
  const aName = a.displayName?.trim();
  const bName = b.displayName?.trim();
  if (aName && bName && aName.toLowerCase() === bName.toLowerCase()) return true;
  if (aName && bName && normalizePersonDisplayName(aName) === normalizePersonDisplayName(bName)) {
    return true;
  }
  if (aName && bName && personSlugsMatch(personSlug(aName), personSlug(bName))) return true;
  if (aName && nameMatchesSlug(aName, b.slug)) return true;
  if (bName && nameMatchesSlug(bName, a.slug)) return true;
  if (aName && bName) {
    if (personSlugsMatch(personSlug(aName), b.slug)) return true;
    if (personSlugsMatch(personSlug(bName), a.slug)) return true;
  }
  return false;
}

/**
 * آیا پروفایل orphan هنگام import باید حذف شود؟
 * سخت‌گیرانه‌تر از personIdentityMatches — فقط duplicate واقعی، نه substring تصادفی.
 */
export function shouldRemoveDuplicateProfileOnImport(
  imported: {
    role: PersonRole;
    slug: string;
    displayName: string;
    externalUrl?: string | null;
  },
  orphan: {
    role: PersonRole;
    slug: string;
    displayName: string;
    externalUrl?: string | null;
  }
): boolean {
  if (imported.role !== orphan.role) return false;
  if (imported.slug === orphan.slug) return false;
  if (personSlugsMatch(imported.slug, orphan.slug)) return true;

  const imdbImported = extractImdbNameId(imported.externalUrl);
  const imdbOrphan = extractImdbNameId(orphan.externalUrl);
  if (imdbImported && imdbOrphan && imdbImported === imdbOrphan) return true;

  const importedName = normalizePersonDisplayName(imported.displayName);
  const orphanName = normalizePersonDisplayName(orphan.displayName);
  const namesMatch =
    importedName.length > 0 && orphanName.length > 0 && importedName === orphanName;

  if (namesMatch && personSlugsFuzzyMatch(imported.slug, orphan.slug)) return true;
  if (namesMatch && personSlugsPrefixMatch(imported.slug, orphan.slug)) return true;

  // variant slug با IMDb import — مثل tony-leung / tony-leung-chiuwai
  if (imdbImported && !imdbOrphan && personSlugsPrefixMatch(imported.slug, orphan.slug)) {
    return true;
  }

  return false;
}

/** شناسه IMDb از URL پروفایل — nm0000093 */
export function extractImdbNameId(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const match = url.trim().match(/imdb\.com\/name\/nm(\d+)/i);
  return match?.[1] ?? null;
}

export function isLatinPersonSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(slug);
}

export type DiscoveredPersonEntry = {
  role: PersonRole;
  slug: string;
  displayName: string;
  itemKeys: Set<string>;
};

export function discoveredEntriesShareItems(
  a: { itemKeys: Set<string> },
  b: { itemKeys: Set<string> }
): boolean {
  for (const key of a.itemKeys) {
    if (b.itemKeys.has(key)) return true;
  }
  return false;
}

export type PersonProfileIdentity = {
  role: PersonRole;
  slug: string;
  displayName: string;
  bio?: string | null;
  externalUrl?: string | null;
  status?: PersonProfileStatus | null;
};

export function pickCanonicalPersonSlug(
  a: { slug: string; itemCount: number },
  b: { slug: string; itemCount: number },
  profileSlugs?: Set<string>
): string {
  const preferProfileSlug = (slugA: string, slugB: string): string => {
    if (!profileSlugs?.size) {
      return slugA.localeCompare(slugB) <= 0 ? slugA : slugB;
    }
    const aHas = profileSlugs.has(slugA);
    const bHas = profileSlugs.has(slugB);
    if (aHas && !bHas) return slugA;
    if (bHas && !aHas) return slugB;
    return slugA.localeCompare(slugB) <= 0 ? slugA : slugB;
  };

  const aLatin = isLatinPersonSlug(a.slug);
  const bLatin = isLatinPersonSlug(b.slug);
  if (aLatin && !bLatin) return a.slug;
  if (bLatin && !aLatin) return b.slug;
  if (personSlugsMatch(a.slug, b.slug)) {
    return a.slug.length <= b.slug.length ? a.slug : b.slug;
  }
  if (personSlugsPrefixMatch(a.slug, b.slug)) {
    return a.slug.length <= b.slug.length ? a.slug : b.slug;
  }
  if (personSlugsFuzzyMatch(a.slug, b.slug)) {
    return preferProfileSlug(a.slug, b.slug);
  }
  return a.itemCount >= b.itemCount ? a.slug : b.slug;
}

export type ProfileLookup = {
  byRoleSlug: Map<string, PersonProfileIdentity>;
  byRole: Map<PersonRole, PersonProfileIdentity[]>;
  byRoleDisplayName: Map<string, PersonProfileIdentity[]>;
  byImdbId: Map<string, PersonProfileIdentity[]>;
  byRoleSpellingBucket: Map<string, PersonProfileIdentity[]>;
};

function addProfileMatch(
  matches: PersonProfileIdentity[],
  seen: Set<string>,
  profile: PersonProfileIdentity | undefined
): void {
  if (!profile) return;
  const key = `${profile.role}:${profile.slug}`;
  if (seen.has(key)) return;
  seen.add(key);
  matches.push(profile);
}

/** کلیدهای نام نمایشی — پشتیبانی از چند نام با « · » یا « | » */
export function profileDisplayNameKeys(displayName: string): string[] {
  const keys = new Set<string>();
  for (const part of displayName.split(/[·|]/)) {
    for (const variant of expandPersonNameVariants(part.trim())) {
      const key = normalizePersonDisplayName(variant);
      if (key) keys.add(key);
    }
  }
  return [...keys];
}

/** نام اصلی + نام داخل پرانتز — «غلامعباس امانی (مانی)» */
export function expandPersonNameVariants(name: string): string[] {
  const trimmed = name.trim();
  if (!trimmed) return [];
  const withoutParens = trimmed.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const aliasMatch = trimmed.match(/\(([^)]+)\)/);
  const variants = new Set<string>();
  if (withoutParens) variants.add(withoutParens);
  if (aliasMatch?.[1]?.trim()) variants.add(aliasMatch[1].trim());
  if (!variants.size) variants.add(trimmed);
  return [...variants];
}

function entryDisplayNameVariants(displayName: string): string[] {
  return expandPersonNameVariants(displayName);
}

function addProfileToSpellingBuckets(
  byRoleSpellingBucket: Map<string, PersonProfileIdentity[]>,
  profile: PersonProfileIdentity,
  namePart: string
): void {
  for (const bucket of personSpellingBucketKeys(namePart)) {
    const bucketKey = `${profile.role}:${bucket}`;
    const list = byRoleSpellingBucket.get(bucketKey) ?? [];
    if (!list.some((p) => p.slug === profile.slug)) list.push(profile);
    byRoleSpellingBucket.set(bucketKey, list);
  }
}

function findProfilesBySpellingSimilarity(
  entry: { role: PersonRole; displayName: string },
  lookup: ProfileLookup,
  minScore = 0.84
): PersonProfileIdentity[] {
  const candidates = new Map<string, PersonProfileIdentity>();
  const entryNames = entryDisplayNameVariants(entry.displayName);
  const bucketKeys = new Set<string>();

  for (const entryName of entryNames) {
    for (const bucket of personSpellingBucketKeys(entryName)) {
      bucketKeys.add(`${entry.role}:${bucket}`);
    }
  }

  for (const bucketKey of bucketKeys) {
    for (const profile of lookup.byRoleSpellingBucket.get(bucketKey) ?? []) {
      if (profile.role !== entry.role) continue;
      for (const entryName of entryNames) {
        for (const profileName of expandPersonNameVariants(profile.displayName)) {
          if (personNamesLikelySamePerson(entryName, profileName, minScore)) {
            candidates.set(`${profile.role}:${profile.slug}`, profile);
          }
        }
      }
    }
  }

  return [...candidates.values()].sort((a, b) => {
    const aBio = Boolean(a.bio?.trim());
    const bBio = Boolean(b.bio?.trim());
    if (aBio !== bBio) return aBio ? -1 : 1;
    const aLatin = isLatinPersonSlug(a.slug);
    const bLatin = isLatinPersonSlug(b.slug);
    if (aLatin !== bLatin) return aLatin ? -1 : 1;
    return a.slug.localeCompare(b.slug);
  });
}

export function buildProfileLookup(profiles: PersonProfileIdentity[]): ProfileLookup {
  const byRoleSlug = new Map<string, PersonProfileIdentity>();
  const byRole = new Map<PersonRole, PersonProfileIdentity[]>();
  const byRoleDisplayName = new Map<string, PersonProfileIdentity[]>();
  const byImdbId = new Map<string, PersonProfileIdentity[]>();
  const byRoleSpellingBucket = new Map<string, PersonProfileIdentity[]>();

  for (const profile of profiles) {
    byRoleSlug.set(`${profile.role}:${profile.slug}`, profile);

    const roleList = byRole.get(profile.role) ?? [];
    roleList.push(profile);
    byRole.set(profile.role, roleList);

    const nameKeys = new Set(profileDisplayNameKeys(profile.displayName));
    if (isLatinPersonSlug(profile.slug)) {
      const latinFromSlug = profile.slug
        .split('-')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
      for (const key of profileDisplayNameKeys(latinFromSlug)) {
        nameKeys.add(key);
      }
    }

    for (const nameKey of nameKeys) {
      const displayKey = `${profile.role}:${nameKey}`;
      const displayList = byRoleDisplayName.get(displayKey) ?? [];
      displayList.push(profile);
      byRoleDisplayName.set(displayKey, displayList);
      addProfileToSpellingBuckets(byRoleSpellingBucket, profile, nameKey);
    }

    const imdbId = extractImdbNameId(profile.externalUrl);
    if (imdbId) {
      const imdbList = byImdbId.get(imdbId) ?? [];
      imdbList.push(profile);
      byImdbId.set(imdbId, imdbList);
    }
  }

  return { byRoleSlug, byRole, byRoleDisplayName, byImdbId, byRoleSpellingBucket };
}

function profileKeysForEntry(
  entry: DiscoveredPersonEntry,
  lookup: ProfileLookup
): Set<string> {
  const keys = new Set<string>();
  const seenProfiles = new Set<string>();
  const matches: PersonProfileIdentity[] = [];

  addProfileMatch(
    matches,
    seenProfiles,
    lookup.byRoleSlug.get(`${entry.role}:${entry.slug}`)
  );
  addProfileMatch(
    matches,
    seenProfiles,
    lookup.byRoleSlug.get(`${entry.role}:${personSlug(entry.displayName)}`)
  );

  const displayKey = `${entry.role}:${normalizePersonDisplayName(entry.displayName)}`;
  for (const profile of lookup.byRoleDisplayName.get(displayKey) ?? []) {
    addProfileMatch(matches, seenProfiles, profile);
  }
  for (const variant of entryDisplayNameVariants(entry.displayName)) {
    const variantKey = `${entry.role}:${normalizePersonDisplayName(variant)}`;
    for (const profile of lookup.byRoleDisplayName.get(variantKey) ?? []) {
      addProfileMatch(matches, seenProfiles, profile);
    }
  }
  for (const nameKey of profileDisplayNameKeys(entry.displayName)) {
    for (const profile of lookup.byRoleDisplayName.get(`${entry.role}:${nameKey}`) ?? []) {
      addProfileMatch(matches, seenProfiles, profile);
    }
  }

  if (matches.length === 0) {
    for (const profile of lookup.byRole.get(entry.role) ?? []) {
      if (
        personSlugsPrefixMatch(entry.slug, profile.slug) ||
        personSlugsFuzzyMatch(entry.slug, profile.slug)
      ) {
        addProfileMatch(matches, seenProfiles, profile);
      }
    }
  }

  if (matches.length === 0) {
    for (const profile of findProfilesBySpellingSimilarity(entry, lookup)) {
      addProfileMatch(matches, seenProfiles, profile);
    }
  }

  for (const profile of matches) {
    keys.add(profile.slug);
    const imdbId = extractImdbNameId(profile.externalUrl);
    if (!imdbId) continue;
    for (const linked of lookup.byImdbId.get(imdbId) ?? []) {
      if (linked.role === entry.role) keys.add(linked.slug);
    }
  }

  return keys;
}

function sharedProfileKeys(a: Set<string>, b: Set<string>): boolean {
  for (const key of a) {
    if (b.has(key)) return true;
  }
  return false;
}

/** بهترین پروفایل برای یک شخص کشف‌شده — در صورت چند تطابق، پروفایل دارای bio اولویت دارد */
export function findBestProfileForDiscoveredEntry(
  entry: DiscoveredPersonEntry | { role: PersonRole; slug: string; displayName: string },
  profilesOrLookup: PersonProfileIdentity[] | ProfileLookup
): PersonProfileIdentity | undefined {
  const lookup = Array.isArray(profilesOrLookup)
    ? buildProfileLookup(profilesOrLookup)
    : profilesOrLookup;
  const matches: PersonProfileIdentity[] = [];
  const seen = new Set<string>();

  addProfileMatch(
    matches,
    seen,
    lookup.byRoleSlug.get(`${entry.role}:${entry.slug}`)
  );
  addProfileMatch(
    matches,
    seen,
    lookup.byRoleSlug.get(`${entry.role}:${personSlug(entry.displayName)}`)
  );

  const displayKey = `${entry.role}:${normalizePersonDisplayName(entry.displayName)}`;
  for (const profile of lookup.byRoleDisplayName.get(displayKey) ?? []) {
    addProfileMatch(matches, seen, profile);
  }
  for (const variant of entryDisplayNameVariants(entry.displayName)) {
    const variantKey = `${entry.role}:${normalizePersonDisplayName(variant)}`;
    for (const profile of lookup.byRoleDisplayName.get(variantKey) ?? []) {
      addProfileMatch(matches, seen, profile);
    }
  }
  for (const nameKey of profileDisplayNameKeys(entry.displayName)) {
    for (const profile of lookup.byRoleDisplayName.get(`${entry.role}:${nameKey}`) ?? []) {
      addProfileMatch(matches, seen, profile);
    }
  }

  if (matches.length === 0) {
    for (const profile of lookup.byRole.get(entry.role) ?? []) {
      if (
        personIdentityMatches(
          { role: entry.role, slug: entry.slug, displayName: entry.displayName },
          {
            role: profile.role,
            slug: profile.slug,
            displayName: profile.displayName,
            externalUrl: profile.externalUrl,
          }
        )
      ) {
        addProfileMatch(matches, seen, profile);
      }
    }
    if (matches.length === 0) {
      for (const profile of lookup.byRole.get(entry.role) ?? []) {
        if (personSlugsPrefixMatch(entry.slug, profile.slug)) {
          addProfileMatch(matches, seen, profile);
        }
      }
    }
    if (matches.length === 0) {
      for (const profile of findProfilesBySpellingSimilarity(entry, lookup)) {
        addProfileMatch(matches, seen, profile);
      }
    }
  }

  if (matches.length === 0) return undefined;
  if (matches.length === 1) return matches[0];

  return matches.slice().sort((a, b) => {
    const aBio = Boolean(a.bio?.trim());
    const bBio = Boolean(b.bio?.trim());
    if (aBio !== bBio) return aBio ? -1 : 1;

    const aExact = a.slug === entry.slug;
    const bExact = b.slug === entry.slug;
    if (aExact !== bExact) return aExact ? -1 : 1;

    const aLatin = isLatinPersonSlug(a.slug);
    const bLatin = isLatinPersonSlug(b.slug);
    if (aLatin !== bLatin) return aLatin ? -1 : 1;

    return a.slug.localeCompare(b.slug);
  })[0];
}

export function pickCanonicalDisplayName(a: string, b: string): string {
  const aLatin = /[a-zA-Z]/.test(a);
  const bLatin = /[a-zA-Z]/.test(b);
  if (aLatin && !bLatin) return a;
  if (bLatin && !aLatin) return b;
  return a.length >= b.length ? a : b;
}

/** ادغام اشخاص تکراری (نام لاتین/فارسی یا slug متفاوت) */
export function mergeDiscoveredPersonEntries(
  entries: DiscoveredPersonEntry[],
  profiles?: PersonProfileIdentity[]
): DiscoveredPersonEntry[] {
  if (entries.length <= 1) {
    return entries.map((entry) => ({
      role: entry.role,
      slug: entry.slug,
      displayName: entry.displayName,
      itemKeys: new Set(entry.itemKeys),
    }));
  }

  const lookup = profiles ? buildProfileLookup(profiles) : null;
  const profileSlugs = profiles
    ? new Set(profiles.map((profile) => profile.slug))
    : undefined;
  const profileKeysByIndex = lookup
    ? entries.map((entry) => profileKeysForEntry(entry, lookup))
    : null;

  const parent = entries.map((_, index) => index);

  function find(index: number): number {
    let root = index;
    while (parent[root] !== root) root = parent[root]!;
    let current = index;
    while (parent[current] !== current) {
      const next = parent[current]!;
      parent[current] = root;
      current = next;
    }
    return root;
  }

  function union(a: number, b: number): void {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent[rootB] = rootA;
  }

  const buckets = new Map<string, number[]>();
  const addToBucket = (key: string, index: number) => {
    const bucket = buckets.get(key);
    if (bucket) bucket.push(index);
    else buckets.set(key, [index]);
  };

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]!;
    addToBucket(`${entry.role}:${entry.slug}`, index);
    addToBucket(`${entry.role}:name:${normalizePersonDisplayName(entry.displayName)}`, index);
    addToBucket(`${entry.role}:slugname:${personSlug(entry.displayName)}`, index);
    if (profileKeysByIndex) {
      for (const profileSlug of profileKeysByIndex[index]!) {
        addToBucket(`${entry.role}:profile:${profileSlug}`, index);
      }
    }
  }

  const seenPairs = new Set<string>();
  for (const indices of buckets.values()) {
    if (indices.length < 2) continue;
    for (let a = 0; a < indices.length; a += 1) {
      for (let b = a + 1; b < indices.length; b += 1) {
        const left = indices[a]!;
        const right = indices[b]!;
        const pairKey = left < right ? `${left}:${right}` : `${right}:${left}`;
        if (seenPairs.has(pairKey)) continue;
        seenPairs.add(pairKey);

        const leftEntry = entries[left]!;
        const rightEntry = entries[right]!;
        if (leftEntry.role !== rightEntry.role) continue;

        const identityMatch = personIdentityMatches(
          {
            role: leftEntry.role,
            slug: leftEntry.slug,
            displayName: leftEntry.displayName,
          },
          {
            role: rightEntry.role,
            slug: rightEntry.slug,
            displayName: rightEntry.displayName,
          }
        );
        const profileMatch =
          profileKeysByIndex != null &&
          sharedProfileKeys(profileKeysByIndex[left]!, profileKeysByIndex[right]!);
        const spellingMatch =
          !identityMatch &&
          !profileMatch &&
          leftEntry.role === rightEntry.role &&
          personNamesLikelySamePerson(leftEntry.displayName, rightEntry.displayName);

        if (identityMatch || profileMatch || spellingMatch) {
          union(left, right);
        }
      }
    }
  }

  const groups = new Map<number, DiscoveredPersonEntry>();
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]!;
    const root = find(index);
    const existing = groups.get(root);
    if (!existing) {
      groups.set(root, {
        role: entry.role,
        slug: entry.slug,
        displayName: entry.displayName,
        itemKeys: new Set(entry.itemKeys),
      });
      continue;
    }

    for (const key of entry.itemKeys) existing.itemKeys.add(key);
    const mergedCount = existing.itemKeys.size;
    existing.slug = pickCanonicalPersonSlug(
      { slug: existing.slug, itemCount: mergedCount },
      { slug: entry.slug, itemCount: entry.itemKeys.size },
      profileSlugs
    );
    existing.displayName = pickCanonicalDisplayName(existing.displayName, entry.displayName);
  }

  return Array.from(groups.values());
}

export function parsePersonNamesList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((v) => parsePersonNamesList(v));
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/[,،·|]/)
      .flatMap((segment) => expandPersonNameVariants(segment.trim()))
      .filter(Boolean);
  }
  return [];
}

export function parseActorNames(value: unknown): string[] {
  return parsePersonNamesList(value);
}

function metaRecord(value: unknown): Record<string, unknown> {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function mergeItemMetadata(
  itemMetadata: unknown,
  catalogMetadata: unknown
): Record<string, unknown> {
  return { ...metaRecord(catalogMetadata), ...metaRecord(itemMetadata) };
}

function extractTranslatorFromTip(metadata: Record<string, unknown>): string | null {
  const raw = metadata.tip;
  if (typeof raw !== 'string') return null;
  const match = raw.trim().match(/^مترجم\s*[:：]\s*(.+)$/u);
  return match?.[1]?.trim() || null;
}

/** نام‌های مرتبط با یک نقش از metadata ادغام‌شده */
export function extractPersonNamesFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
  role: PersonRole
): string[] {
  const meta = metaRecord(metadata);
  const key = PERSON_ROLE_META[role].metadataKey;

  if (role === 'actor') {
    return parseActorNames(meta.actors);
  }

  if (role === 'translator') {
    const names: string[] = [];
    for (const part of parsePersonNamesList(meta.translator)) {
      if (!names.includes(part)) names.push(part);
    }
    const fromTip = extractTranslatorFromTip(meta);
    if (fromTip) {
      for (const part of expandPersonNameVariants(fromTip)) {
        if (!names.includes(part)) names.push(part);
      }
    }
    return names;
  }

  return parsePersonNamesList(meta[key]);
}

/** عنوان را برای مقایسه یکسان‌سازی می‌کند — «Fight Club - باشگاه…» → fight club */
export function normalizePersonItemTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return '';
  const core = trimmed.match(/^(.+?)\s*[-–—·]\s+/)?.[1]?.trim() ?? trimmed;
  return core.toLowerCase().replace(/\s+/g, ' ');
}

/** کلید یکتا برای آیتم شخص — اول catalog، بعد عنوان، در نهایت id */
export function personItemDedupeKey(item: {
  id: string;
  catalogItemId?: string | null;
  title?: string;
}): string {
  const catalogId = item.catalogItemId?.trim();
  if (catalogId) return `catalog:${catalogId}`;
  const normalizedTitle = normalizePersonItemTitle(item.title ?? '');
  if (normalizedTitle) return `title:${normalizedTitle}`;
  return `id:${item.id}`;
}

export function buildPersonBioStub(_role: PersonRole, itemCount: number, roleLabel: string): string {
  return `${roleLabel} · ${itemCount.toLocaleString('fa-IR')} آیتم در وایب`;
}
