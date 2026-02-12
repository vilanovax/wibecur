import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { checkAdminAuth } from '@/lib/auth';

const CACHE_SECONDS = 10;
const LIMIT_PER_TYPE = 12;
const TOTAL_LIMIT = 20;
const COMMENT_SNIPPET_LEN = 50;

type ActivityItem =
  | { type: 'save'; createdAt: Date; userName: string; listTitle: string }
  | { type: 'comment'; createdAt: Date; userName: string; itemTitle: string; contentSnippet: string; itemId: string }
  | { type: 'user'; createdAt: Date; userName: string }
  | { type: 'item'; createdAt: Date; itemTitle: string; listTitle: string; itemId: string };

async function getLiveActivity() {
  return dbQuery(async () => {
    const [bookmarks, comments, newUsers, newItems] = await Promise.all([
      prisma.bookmarks.findMany({
        orderBy: { createdAt: 'desc' },
        take: LIMIT_PER_TYPE,
        include: {
          users: { select: { name: true } },
          lists: { select: { title: true } },
        },
      }),
      prisma.comments.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: LIMIT_PER_TYPE,
        include: {
          users: { select: { name: true } },
          items: { select: { title: true, id: true } },
        },
      }),
      prisma.users.findMany({
        orderBy: { createdAt: 'desc' },
        take: LIMIT_PER_TYPE,
        select: { name: true, createdAt: true },
      }),
      prisma.items.findMany({
        orderBy: { createdAt: 'desc' },
        take: LIMIT_PER_TYPE,
        include: {
          lists: { select: { title: true } },
        },
      }),
    ]);

    const activities: ActivityItem[] = [];

    bookmarks.forEach((b) => {
      activities.push({
        type: 'save',
        createdAt: b.createdAt,
        userName: b.users?.name ?? 'کاربر',
        listTitle: b.lists?.title ?? 'لیست',
      });
    });
    comments.forEach((c) => {
      const snippet =
        c.content.length > COMMENT_SNIPPET_LEN
          ? c.content.slice(0, COMMENT_SNIPPET_LEN) + '…'
          : c.content;
      activities.push({
        type: 'comment',
        createdAt: c.createdAt,
        userName: c.users?.name ?? 'کاربر',
        itemTitle: c.items?.title ?? 'آیتم',
        contentSnippet: snippet,
        itemId: c.itemId,
      });
    });
    newUsers.forEach((u) => {
      activities.push({
        type: 'user',
        createdAt: u.createdAt,
        userName: u.name ?? 'کاربر جدید',
      });
    });
    newItems.forEach((i) => {
      activities.push({
        type: 'item',
        createdAt: i.createdAt,
        itemTitle: i.title,
        listTitle: i.lists?.title ?? 'لیست',
        itemId: i.id,
      });
    });

    activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return activities.slice(0, TOTAL_LIMIT);
  });
}

export async function GET() {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const getCached = unstable_cache(
      getLiveActivity,
      ['admin-live-activity'],
      { revalidate: CACHE_SECONDS, tags: ['admin-live'] }
    );
    const data = await getCached();
    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error('Live activity error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت فعالیت زنده' },
      { status: 500 }
    );
  }
}
