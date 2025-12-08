'use client';

import {
  AreaChart,
  Area,
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
import { TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';

interface ChartsClientProps {
  userGrowthData: { month: string; users: number }[];
  listsByCategory: { category: string; count: number }[];
  itemDistribution: { name: string; value: number; color: string }[];
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg border border-gray-100">
        <p className="text-sm font-semibold text-gray-900 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm text-gray-600">
            <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
            {entry.name}: <span className="font-semibold text-gray-900">{entry.value.toLocaleString('fa-IR')}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom pie tooltip
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg border border-gray-100">
        <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: data.payload.color }}></span>
          {data.name}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          تعداد: <span className="font-semibold text-gray-900">{data.value.toLocaleString('fa-IR')}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function ChartsClient({
  userGrowthData,
  listsByCategory,
  itemDistribution,
}: ChartsClientProps) {
  return (
    <div className="space-y-6">
      {/* User Growth Chart - Area Chart with Gradient */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl text-white shadow-lg shadow-indigo-500/30">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">رشد کاربران</h3>
            <p className="text-sm text-gray-500">۶ ماه اخیر</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={userGrowthData}>
            <defs>
              <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#9CA3AF"
              style={{ fontSize: '12px', fontFamily: 'Vazirmatn' }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              stroke="#9CA3AF"
              style={{ fontSize: '12px', fontFamily: 'Vazirmatn' }}
              axisLine={false}
              tickLine={false}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="users"
              stroke="#6366F1"
              strokeWidth={3}
              fill="url(#userGradient)"
              dot={{ fill: '#6366F1', r: 4, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#6366F1', stroke: '#fff', strokeWidth: 3 }}
              name="کاربران"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lists by Category - Modern Bar Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl text-white shadow-lg shadow-emerald-500/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">لیست‌ها</h3>
              <p className="text-sm text-gray-500">بر اساس دسته‌بندی</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={listsByCategory} barCategoryGap="20%">
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis
                dataKey="category"
                stroke="#9CA3AF"
                style={{ fontSize: '11px', fontFamily: 'Vazirmatn' }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                stroke="#9CA3AF"
                style={{ fontSize: '12px', fontFamily: 'Vazirmatn' }}
                axisLine={false}
                tickLine={false}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                fill="url(#barGradient)"
                radius={[8, 8, 0, 0]}
                name="تعداد لیست"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Item Distribution - Donut Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl text-white shadow-lg shadow-amber-500/30">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">توزیع آیتم‌ها</h3>
              <p className="text-sm text-gray-500">بر اساس دسته‌بندی</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={itemDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={3}
                stroke="none"
              >
                {itemDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className="hover:opacity-80 transition-opacity duration-200"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
