import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import SuggestionsPageClient from './SuggestionsPageClient';
import { Suspense } from 'react';

export const metadata = {
  title: 'پیشنهادها | پنل مدیریت',
  description: 'مدیریت پیشنهادات لیست و آیتم',
};

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 animate-pulse">
          <div className="h-4 bg-white/20 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-white/20 rounded w-1/3"></div>
        </div>
      ))}
    </div>
  );
}

async function SuggestionsStats() {
  try {
    const [listStats, itemStats] = await dbQuery(() =>
      Promise.all([
        prisma.suggested_lists.groupBy({
          by: ['status'],
          _count: { status: true },
        }),
        prisma.suggested_items.groupBy({
          by: ['status'],
          _count: { status: true },
        }),
      ])
    );

    const listPending = listStats.find(s => s.status === 'pending')?._count.status || 0;
    const listApproved = listStats.find(s => s.status === 'approved')?._count.status || 0;
    const itemPending = itemStats.find(s => s.status === 'pending')?._count.status || 0;
    const itemApproved = itemStats.find(s => s.status === 'approved')?._count.status || 0;

    const totalPending = listPending + itemPending;
    const totalApproved = listApproved + itemApproved;
    const totalLists = listStats.reduce((sum, s) => sum + s._count.status, 0);
    const totalItems = itemStats.reduce((sum, s) => sum + s._count.status, 0);

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <p className="text-white/70 text-sm mb-1">در انتظار بررسی</p>
          <p className="text-3xl font-bold text-white">{totalPending}</p>
          <p className="text-xs text-white/50 mt-1">{listPending} لیست • {itemPending} آیتم</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <p className="text-white/70 text-sm mb-1">تایید شده</p>
          <p className="text-3xl font-bold text-white">{totalApproved}</p>
          <p className="text-xs text-white/50 mt-1">{listApproved} لیست • {itemApproved} آیتم</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <p className="text-white/70 text-sm mb-1">پیشنهادات لیست</p>
          <p className="text-3xl font-bold text-white">{totalLists}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <p className="text-white/70 text-sm mb-1">پیشنهادات آیتم</p>
          <p className="text-3xl font-bold text-white">{totalItems}</p>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching suggestion stats:', error);
    // Return fallback UI on error
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <p className="text-white/70 text-sm mb-1">در انتظار بررسی</p>
          <p className="text-3xl font-bold text-white">-</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <p className="text-white/70 text-sm mb-1">تایید شده</p>
          <p className="text-3xl font-bold text-white">-</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <p className="text-white/70 text-sm mb-1">پیشنهادات لیست</p>
          <p className="text-3xl font-bold text-white">-</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <p className="text-white/70 text-sm mb-1">پیشنهادات آیتم</p>
          <p className="text-3xl font-bold text-white">-</p>
        </div>
      </div>
    );
  }
}

export default async function SuggestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string; page?: string }>;
}) {
  await requireAdmin();

  const { tab = 'lists', status = 'pending', page = '1' } = await searchParams;

  return (
    <div className="space-y-6">
      {/* Modern Header with Stats */}
      <div className="bg-gradient-to-l from-violet-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">مدیریت پیشنهادها</h1>
            <p className="text-white/80">
              پیشنهادات کاربران برای لیست‌ها و آیتم‌های جدید را بررسی و مدیریت کنید.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-white/90">پیشنهادات در انتظار بررسی</span>
          </div>
        </div>

        <Suspense fallback={<StatsSkeleton />}>
          <SuggestionsStats />
        </Suspense>
      </div>

      <SuggestionsPageClient
        initialTab={tab}
        initialStatus={status}
        initialPage={page}
      />
    </div>
  );
}
