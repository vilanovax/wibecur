import { getBaseUrl, toAbsoluteImageUrl } from '@/lib/seo';

export type PublicProfileSchemaInput = {
  username: string;
  name?: string | null;
  bio?: string | null;
  image?: string | null;
};

/** JSON-LD ProfilePage + Person برای پروفایل عمومی کیوریتور */
export function buildPublicProfileJsonLd(profile: PublicProfileSchemaInput): Record<string, unknown> {
  const base = getBaseUrl().replace(/\/$/, '');
  const profileUrl = `${base}/u/${encodeURIComponent(profile.username)}`;
  const imageUrl = toAbsoluteImageUrl(profile.image);

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': profileUrl,
    url: profileUrl,
    name: profile.name?.trim() || `@${profile.username}`,
    inLanguage: 'fa-IR',
    mainEntity: {
      '@type': 'Person',
      name: profile.name?.trim() || profile.username,
      alternateName: `@${profile.username}`,
      url: profileUrl,
      ...(profile.bio?.trim() ? { description: profile.bio.trim() } : {}),
      ...(imageUrl ? { image: imageUrl } : {}),
    },
  };
}
