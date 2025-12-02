import { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth';
import { getCounts } from '@/lib/db';
import StatCard from '@/components/admin/dashboard/StatCard';
import RecentActivity from '@/components/admin/dashboard/RecentActivity';
import QuickActions from '@/components/admin/dashboard/QuickActions';
import Charts from '@/components/admin/dashboard/Charts';

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
      ))}
    </div>
  );
}

function ChartsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function AdminDashboard() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">داشبورد</h1>
        <p className="text-gray-600">
          خوش آمدید! اینجا می‌توانید تمام فعالیت‌های سیستم را مشاهده کنید.
        </p>
      </div>

      {/* Stat Cards with Suspense */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsContent />
      </Suspense>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <QuickActions />
        </div>
        <div>
          <Suspense fallback={<ActivitySkeleton />}>
            <RecentActivity />
          </Suspense>
        </div>
      </div>

      {/* Charts with Suspense */}
      <Suspense fallback={<ChartsSkeleton />}>
        <Charts />
      </Suspense>
    </div>
  );
}

async function StatsContent() {
  const [userCount, listCount, itemCount, categoryCount] = await getCounts();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="کاربران"
        value={userCount}
        iconName="Users"
        trend={{ value: 12, isPositive: true }}
        iconColor="text-blue-600"
        bgGradient="bg-blue-50"
      />
      <StatCard
        title="لیست‌ها"
        value={listCount}
        iconName="List"
        trend={{ value: 8, isPositive: true }}
        iconColor="text-purple-600"
        bgGradient="bg-purple-50"
      />
      <StatCard
        title="آیتم‌ها"
        value={itemCount}
        iconName="Package"
        trend={{ value: 5, isPositive: true }}
        iconColor="text-green-600"
        bgGradient="bg-green-50"
      />
      <StatCard
        title="دسته‌بندی‌ها"
        value={categoryCount}
        iconName="Eye"
        trend={{ value: 0, isPositive: true }}
        iconColor="text-orange-600"
        bgGradient="bg-orange-50"
      />
    </div>
  );
}
