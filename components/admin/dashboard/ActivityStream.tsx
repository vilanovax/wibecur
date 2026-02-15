'use client';

import { useState, useMemo } from 'react';
import { Clock, Plus, FileText, Shield, Star, User, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import Link from 'next/link';
import type { ActivityEvent } from '@/lib/admin/types';

const eventTags: Record<
  ActivityEvent['type'],
  { label: string; className: string; icon: typeof FileText }
> = {
  list_created: {
    label: 'لیست',
    className: 'bg-blue-100 text-blue-700',
    icon: FileText,
  },
  item_added: {
    label: 'آیتم',
    className: 'bg-emerald-100 text-emerald-700',
    icon: Plus,
  },
  report_submitted: {
    label: 'ریپورت',
    className: 'bg-amber-100 text-amber-700',
    icon: Shield,
  },
  curator_featured: {
    label: 'کیوریتور',
    className: 'bg-purple-100 text-purple-700',
    icon: Star,
  },
  user_joined: {
    label: 'کاربر',
    className: 'bg-gray-100 text-gray-700',
    icon: User,
  },
};

interface ActivityStreamProps {
  events: ActivityEvent[];
}

export default function ActivityStream({ events }: ActivityStreamProps) {
  const [filterType, setFilterType] = useState<ActivityEvent['type'] | 'all'>('all');

  const filtered = useMemo(() => {
    if (filterType === 'all') return events;
    return events.filter((e) => e.type === filterType);
  }, [events, filterType]);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-[var(--color-text)] flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--color-text-muted)]" />
          جریان فعالیت
        </h2>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--color-text-muted)]" />
          <select
            value={filterType}
            onChange={(e) =>
              setFilterType(e.target.value as ActivityEvent['type'] | 'all')
            }
            className="text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="all">همه</option>
            {(Object.keys(eventTags) as ActivityEvent['type'][]).map((t) => (
              <option key={t} value={t}>
                {eventTags[t].label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <ul className="divide-y divide-[var(--color-border-muted)] max-h-[320px] overflow-y-auto">
        {filtered.length === 0 ? (
          <li className="px-4 sm:px-6 py-8 text-center text-sm text-[var(--color-text-muted)]">
            فعالیتی یافت نشد.
          </li>
        ) : (
          filtered.slice(0, 15).map((event) => {
            const tag = eventTags[event.type];
            const Icon = tag.icon;
            const ts = typeof event.timestamp === 'string' ? new Date(event.timestamp) : event.timestamp;
            return (
              <li key={event.id}>
                <div className="flex items-center gap-3 px-4 sm:px-6 py-2.5 hover:bg-[var(--color-bg)] transition-colors group">
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${tag.className}`}
                  >
                    <Icon className="w-3 h-3" />
                    {tag.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[var(--color-text)] truncate">
                      {event.title}
                      {event.description && (
                        <span className="text-[var(--color-text-muted)]">
                          {' — '}
                          {event.description}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-subtle)]">
                      {formatDistanceToNow(ts, { addSuffix: true, locale: faIR })}
                      {event.actor && ` · ${event.actor}`}
                    </p>
                  </div>
                  {event.href && (
                    <Link
                      href={event.href}
                      className="shrink-0 text-xs text-[var(--primary)] hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      باز کردن
                    </Link>
                  )}
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
