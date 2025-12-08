'use client';

import { ArrowUp, ArrowDown, Users, List, Package, Eye, TrendingUp } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  iconName: 'Users' | 'List' | 'Package' | 'Eye';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradient: string;
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
  gradient,
}: StatCardProps) {
  const Icon = iconMap[iconName];

  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 ${gradient} text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
      {/* Background Pattern */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-white rounded-full" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white rounded-full" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
            <Icon className="w-6 h-6 text-white" />
          </div>
          {trend && trend.value > 0 && (
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${
              trend.isPositive
                ? 'bg-white/20 text-white'
                : 'bg-red-500/30 text-white'
            }`}>
              {trend.isPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5" />
              )}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        <div>
          <p className="text-4xl font-bold mb-1 tabular-nums">
            {typeof value === 'number' ? value.toLocaleString('fa-IR') : value}
          </p>
          <p className="text-sm text-white/80 font-medium">{title}</p>
        </div>
      </div>
    </div>
  );
}
