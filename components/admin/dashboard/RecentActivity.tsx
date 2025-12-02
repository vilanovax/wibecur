import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import RecentActivityClient from './RecentActivityClient';

interface Activity {
  id: string;
  type: 'create' | 'edit' | 'delete' | 'user';
  title: string;
  description: string;
  timestamp: Date;
}

export default async function RecentActivity() {
  const activities = await dbQuery(async () => {
    const recentLists = await prisma.lists.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
    });

    const recentItems = await prisma.items.findMany({
      take: 2,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
    });

    const activities: Activity[] = [];

    recentLists.forEach(list => {
      activities.push({
        id: list.id,
        type: 'create',
        title: 'لیست جدید ایجاد شد',
        description: list.title,
        timestamp: list.createdAt,
      });
    });

    recentItems.forEach(item => {
      activities.push({
        id: item.id,
        type: 'create',
        title: 'آیتم جدید اضافه شد',
        description: item.title,
        timestamp: item.createdAt,
      });
    });

    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);
  });

  return <RecentActivityClient activities={activities} />;
}
