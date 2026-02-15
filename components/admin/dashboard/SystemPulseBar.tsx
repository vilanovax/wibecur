'use client';

import { ArrowUp, ArrowDown, Minus, Flame, TrendingUp, Brain, AlertTriangle } from 'lucide-react';
import type { SystemPulseCard as SystemPulseCardType } from '@/lib/admin/types';

const icons: Record<SystemPulseCardType['id'], typeof Flame> = {
  save_velocity: Flame,
  trending_momentum: TrendingUp,
  active_lists_ratio: Brain,
  risk_alerts: AlertTriangle,
};

const colorMap = {
  emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200/50 text-emerald-700',
  blue: 'from-blue-500/10 to-blue-600/5 border-blue-200/50 text-blue-700',
  amber: 'from-amber-500/10 to-amber-600/5 border-amber-200/50 text-amber-700',
  red: 'from-red-500/10 to-red-600/5 border-red-200/50 text-red-700',
};

const deltaColorMap = {
  up: 'bg-emerald-100 text-emerald-700',
  down: 'bg-red-100 text-red-700',
  neutral: 'bg-gray-100 text-gray-600',
};

interface SystemPulseBarProps {
  cards: SystemPulseCardType[];
}

export default function SystemPulseBar({ cards }: SystemPulseBarProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = icons[card.id];
        const colors = colorMap[card.semanticColor];
        const maxSpark = Math.max(...card.sparkline, 1);

        return (
          <div
            key={card.id}
            className={`group relative rounded-2xl border bg-gradient-to-br ${colors} p-4 sm:p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]`}
            title={card.tooltip}
          >
            <div className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 max-w-[200px] rounded-lg bg-gray-900 text-white text-xs p-2 shadow-lg">
              {card.tooltip}
            </div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-white/60">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-[13px] font-medium text-[var(--color-text-muted)]">
                  {card.label}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs font-medium ${deltaColorMap[card.trend]}`}
              >
                {card.trend === 'up' && <ArrowUp className="w-3 h-3" />}
                {card.trend === 'down' && <ArrowDown className="w-3 h-3" />}
                {card.trend === 'neutral' && <Minus className="w-3 h-3" />}
                {card.deltaPercent !== 0 && (
                  <span>
                    {card.deltaPercent > 0 ? '+' : ''}
                    {card.deltaPercent.toLocaleString('fa-IR')}٪
                  </span>
                )}
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold tabular-nums text-[var(--color-text)] mb-3">
              {typeof card.value === 'number' ? card.value.toLocaleString('fa-IR') : card.value}
            </p>
            {card.sparkline.length > 0 && (
              <div className="h-8 flex items-end gap-0.5">
                {card.sparkline.map((v, i) => (
                  <div
                    key={i}
                    className="flex-1 min-w-0 rounded-t bg-current opacity-30"
                    style={{ height: `${Math.max(8, (v / maxSpark) * 100)}%` }}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
