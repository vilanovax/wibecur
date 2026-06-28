import {
  isAppObjectStorageImageUrl,
} from '@/lib/item-image-storage';
import {
  buildProfileLookup,
  findBestProfileForDiscoveredEntry,
  type PersonRole,
} from '@/lib/people';

export type PersonImageStatus = 'none' | 'storage' | 'external';

export type PersonImageProfileRow = {
  role: PersonRole;
  slug: string;
  displayName: string;
  imageUrl: string | null;
  externalUrl?: string | null;
};

export function personImageStorageStatus(url: string | null | undefined): PersonImageStatus {
  if (!url?.trim()) return 'none';
  if (isAppObjectStorageImageUrl(url.trim())) return 'storage';
  return 'external';
}

/** تطبیق پروفایل انعطاف‌پذیر — slug/name variants مثل phoebe-wallerbridge ↔ phoebe-waller-bridge */
export function resolvePersonImageProfileForDiscovered<T extends PersonImageProfileRow>(
  person: { role: PersonRole; slug: string; displayName: string },
  profiles: T[]
): T | undefined {
  if (profiles.length === 0) return undefined;

  const lookup = buildProfileLookup(
    profiles.map((profile) => ({
      role: profile.role,
      slug: profile.slug,
      displayName: profile.displayName,
      externalUrl: profile.externalUrl ?? null,
    }))
  );
  const match = findBestProfileForDiscoveredEntry(person, lookup);
  if (!match) return undefined;

  return profiles.find(
    (profile) => profile.role === match.role && profile.slug === match.slug
  );
}

export function personImageStatusForDiscovered<T extends PersonImageProfileRow>(
  person: { role: PersonRole; slug: string; displayName: string },
  profiles: T[]
): PersonImageStatus {
  const profile = resolvePersonImageProfileForDiscovered(person, profiles);
  return personImageStorageStatus(profile?.imageUrl);
}
