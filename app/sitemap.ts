import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { getBaseUrl } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/lists`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/leaderboard`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.75 },
  ];

  try {
    const [lists, categories, items, publicCurators] = await Promise.all([
      prisma.lists.findMany({
        where: {
          isActive: true,
          isPublic: true,
          users: { role: { not: 'USER' } },
        },
        select: { slug: true, updatedAt: true },
      }),
      prisma.categories.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.items.findMany({
        where: {
          lists: {
            isActive: true,
            isPublic: true,
            users: { role: { not: 'USER' } },
          },
        },
        select: { id: true, updatedAt: true },
      }),
      prisma.users.findMany({
        where: {
          username: { not: null },
          isActive: true,
          lists: {
            some: {
              isActive: true,
              isPublic: true,
            },
          },
        },
        select: { username: true, updatedAt: true },
      }),
    ]);

    const listUrls: MetadataRoute.Sitemap = lists.map((l) => ({
      url: `${baseUrl}/lists/${l.slug}`,
      lastModified: l.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    const categoryUrls: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${baseUrl}/categories/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    const itemUrls: MetadataRoute.Sitemap = items.map((i) => ({
      url: `${baseUrl}/items/${i.id}`,
      lastModified: i.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    const curatorUrls: MetadataRoute.Sitemap = publicCurators
      .filter((u): u is { username: string; updatedAt: Date } => Boolean(u.username))
      .map((u) => ({
        url: `${baseUrl}/u/${encodeURIComponent(u.username)}`,
        lastModified: u.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.65,
      }));

    return [...staticPages, ...listUrls, ...categoryUrls, ...itemUrls, ...curatorUrls];
  } catch {
    return staticPages;
  }
}
