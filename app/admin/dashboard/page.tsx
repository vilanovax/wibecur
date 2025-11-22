import { requireAdmin } from '@/lib/auth';
import { getCounts } from '@/lib/db';
import StatCard from '@/components/admin/dashboard/StatCard';
import RecentActivity from '@/components/admin/dashboard/RecentActivity';
import QuickActions from '@/components/admin/dashboard/QuickActions';
import Charts from '@/components/admin/dashboard/Charts';

export default async function AdminDashboard() {
  await requireAdmin();

  const [userCount, listCount, itemCount, categoryCount] = await getCounts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">داشبورد</h1>
        <p className="text-gray-600">
          خوش آمدید! اینجا می‌توانید تمام فعالیت‌های سیستم را مشاهده کنید.
        </p>
      </div>

      {/* Stat Cards */}
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

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <QuickActions />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>

      {/* Charts */}
      <Charts />
    </div>
  );
}
