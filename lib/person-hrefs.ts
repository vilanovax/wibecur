import {
  buildProfileLookup,
  findBestProfileForDiscoveredEntry,
  personLinkKey,
  personPublicPath,
  personSlug,
  type PersonProfileIdentity,
  type PersonRole,
} from '@/lib/people';

/**
 * لینک صفحهٔ شخص از روی پروفایل منتشرشده.
 * صفحهٔ لیست این را به‌جای ساختن کل صفحهٔ شخص صدا می‌زند تا برای هر نام،
 * اسکن آیتم‌ها اجرا نشود. پروفایل بدون بیو لینک نمی‌گیرد.
 */
export function matchPublicPersonHrefs(
  targets: Array<{ role: PersonRole; name: string }>,
  profiles: PersonProfileIdentity[]
): Record<string, string> {
  const unique = new Map<string, { role: PersonRole; name: string }>();
  for (const target of targets) {
    const name = target.name.trim();
    if (!name) continue;
    unique.set(personLinkKey(target.role, name), { role: target.role, name });
  }
  if (unique.size === 0 || profiles.length === 0) return {};

  const published = profiles.filter(
    (profile) => profile.status !== 'draft' && Boolean(profile.bio?.trim())
  );
  if (published.length === 0) return {};

  const lookup = buildProfileLookup(published);
  const hrefs: Record<string, string> = {};

  for (const target of unique.values()) {
    const profile = findBestProfileForDiscoveredEntry(
      {
        role: target.role,
        slug: personSlug(target.name),
        displayName: target.name,
      },
      lookup,
      { exhaustive: false }
    );
    if (!profile?.bio?.trim() || profile.status === 'draft') continue;
    hrefs[personLinkKey(target.role, target.name)] = personPublicPath(
      profile.role,
      profile.slug
    );
  }

  return hrefs;
}
