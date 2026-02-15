'use client';

import { AlertTriangle, TrendingUp, Flag, Zap } from 'lucide-react';
import Link from 'next/link';
import type { RiskItem as RiskItemType } from '@/lib/admin/types';

const icons: Record<RiskItemType['type'], typeof AlertTriangle> = {
  save_spike: Zap,
  suspicious_growth: TrendingUp,
  flagged_list: Flag,
  anomaly: AlertTriangle,
};

const severityClass = {
  high: 'bg-red-50 border-red-200 text-red-800',
  medium: 'bg-amber-50 border-amber-200 text-amber-800',
  low: 'bg-gray-50 border-gray-200 text-gray-700',
};

interface RiskModerationPanelProps {
  items: RiskItemType[];
}

export default function RiskModerationPanel({ items }: RiskModerationPanelProps) {
  return (
    <div className="rounded-2xl border-2 border-red-200 bg-red-50/30 overflow-hidden shadow-[var(--shadow-card)]">
      <div className="px-4 sm:px-6 py-4 border-b border-red-200/50 bg-red-100/50">
        <h2 className="text-base font-semibold text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          ریسک و مودریشن
        </h2>
        <p className="text-xs text-red-700/80 mt-0.5">
          هشدارها و موارد نیازمند اقدام
        </p>
      </div>
      <ul className="divide-y divide-red-200/50">
        {items.length === 0 ? (
          <li className="px-4 sm:px-6 py-6 text-center text-sm text-red-700/70">
            موردی یافت نشد.
          </li>
        ) : (
          items.map((item) => {
            const Icon = icons[item.type];
            const severity = severityClass[item.severity];
            return (
              <li key={item.id}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-red-100/50 transition-colors ${severity}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{item.label}</p>
                      {(item.description ?? item.count != null) && (
                        <p className="text-xs opacity-90">
                          {item.description ?? `${item.count?.toLocaleString('fa-IR')} مورد`}
                        </p>
                      )}
                    </div>
                  </Link>
                ) : (
                  <div
                    className={`flex items-center gap-3 px-4 sm:px-6 py-3 ${severity}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{item.label}</p>
                      {(item.description ?? item.count != null) && (
                        <p className="text-xs opacity-90">
                          {item.description ?? `${item.count?.toLocaleString('fa-IR')} مورد`}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
