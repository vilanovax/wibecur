import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { checkAdminAuth } from '@/lib/auth';
import { getFullGlobalTrendingSorted } from '@/lib/trending/service';

const CACHE_SECONDS = 60;
const TOP = 5;

async function getTrendingLists() {
  const lists = await getFullGlobalTrendingSorted(prisma, TOP);
  return lists.map((item, i) => ({
    rank: i + 1,
    listId: item.listId,
    title: item.title,
    slug: item.slug,
    score: Math.round(item.score),
    categorySlug: item.categorySlug ?? undefined,
    badge: item.badge,
  }));
}

export function getCachedPulseTrending() {
  return unstable_cache(getTrendingLists, ['admin-pulse-trending-lists'], {
    revalidate: CACHE_SECONDS,
    tags: ['admin-pulse'],
  })();
}

export async function GET() {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const data = await getCachedPulseTrending();
    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error('Pulse trending-lists error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت لیست‌های ترند' },
      { status: 500 }
    );
  }
}
