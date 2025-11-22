'use client';

import { ArrowUp, ArrowDown, Users, List, Package, Eye } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  iconName: 'Users' | 'List' | 'Package' | 'Eye';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconColor: string;
  bgGradient: string;
}

const iconMap = {
  Users,
  List,
  Package,
  Eye,
};

export default function StatCard({
  title,
  value,
  iconName,
  trend,
  iconColor,
  bgGradient,
}: StatCardProps) {
  const Icon = iconMap[iconName];

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-gray-100 group">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`p-3 rounded-lg ${bgGradient} group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend.isPositive
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {trend.isPositive ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            )}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 tabular-nums">
          {typeof value === 'number' ? value.toLocaleString('fa-IR') : value}
        </p>
      </div>
    </div>
  );
}
