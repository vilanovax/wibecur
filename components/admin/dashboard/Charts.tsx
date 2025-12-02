import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import ChartsClient from './ChartsClient';

const persianMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

export default async function Charts() {
  // Get data for charts
  const [userGrowthData, listsByCategory, itemDistribution] = await Promise.all([
    // User growth (last 6 months)
    dbQuery(async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const users = await prisma.users.findMany({
        where: {
          createdAt: {
            gte: sixMonthsAgo,
          },
        },
        select: {
          createdAt: true,
        },
      });

      // Group by month
      const monthCounts: Record<number, number> = {};
      users.forEach(user => {
        const month = new Date(user.createdAt).getMonth();
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      });

      // Generate last 6 months
      const currentMonth = new Date().getMonth();
      const data = [];
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        data.push({
          month: persianMonths[monthIndex],
          users: monthCounts[monthIndex] || 0,
        });
      }

      return data;
    }),

    // Lists by category
    dbQuery(async () => {
      const categories = await prisma.categories.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { lists: true },
          },
        },
      });

      return categories
        .map(cat => ({
          category: cat.name,
          count: cat._count.lists,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    }),

    // Item distribution (simple mock for now)
    Promise.resolve([
      { name: 'فعال', value: 85, color: '#10B981' },
      { name: 'غیرفعال', value: 15, color: '#EF4444' },
    ]),
  ]);

  return <ChartsClient 
    userGrowthData={userGrowthData}
    listsByCategory={listsByCategory}
    itemDistribution={itemDistribution}
  />;
}
