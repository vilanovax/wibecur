'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const userGrowthData = [
  { month: 'فروردین', users: 120 },
  { month: 'اردیبهشت', users: 190 },
  { month: 'خرداد', users: 300 },
  { month: 'تیر', users: 450 },
  { month: 'مرداد', users: 600 },
  { month: 'شهریور', users: 850 },
];

const listsByCategory = [
  { category: 'فیلم', count: 45 },
  { category: 'کتاب', count: 32 },
  { category: 'کافه', count: 28 },
  { category: 'پادکست', count: 15 },
  { category: 'ماشین', count: 12 },
];

const itemDistribution = [
  { name: 'تایید شده', value: 65, color: '#10B981' },
  { name: 'در انتظار', value: 25, color: '#F59E0B' },
  { name: 'رد شده', value: 10, color: '#EF4444' },
];

export default function Charts() {
  return (
    <div className="space-y-6">
      {/* User Growth Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">
          رشد کاربران (۶ ماه اخیر)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={userGrowthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="month"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#6366F1"
              strokeWidth={3}
              dot={{ fill: '#6366F1', r: 5 }}
              activeDot={{ r: 8 }}
              name="کاربران"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lists by Category */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            لیست‌ها بر اساس دسته‌بندی
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={listsByCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="category"
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="count" fill="#6366F1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Item Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            توزیع آیتم‌ها
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={itemDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {itemDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

