import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { getBaseUrl } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/lists`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  ];

  const [lists, categories] = await Promise.all([
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

  const items = await prisma.items.findMany({
    where: {
      lists: {
        isActive: true,
        isPublic: true,
        users: { role: { not: 'USER' } },
      },
    },
    select: { id: true, updatedAt: true },
  });

  const itemUrls: MetadataRoute.Sitemap = items.map((i) => ({
    url: `${baseUrl}/items/${i.id}`,
    lastModified: i.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...listUrls, ...categoryUrls, ...itemUrls];
}
