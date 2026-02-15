'use client';

import { Clock, Plus, FileText, Shield, Star, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import Link from 'next/link';
import type { ActivityEvent } from '@/lib/admin/types';

interface ActivityFeedProps {
  events: ActivityEvent[];
}

const eventIcons: Record<string, typeof Plus> = {
  list_created: FileText,
  item_added: Plus,
  report_submitted: Shield,
  curator_featured: Star,
  user_joined: User,
};

const eventBg: Record<string, string> = {
  list_created: 'bg-blue-100 text-blue-700',
  item_added: 'bg-emerald-100 text-emerald-700',
  report_submitted: 'bg-amber-100 text-amber-700',
  curator_featured: 'bg-purple-100 text-purple-700',
  user_joined: 'bg-gray-100 text-[var(--color-text)]',
};

export default function ActivityFeed({ events }: ActivityFeedProps) {
  return (
    <div className="rounded-[16px] p-4 sm:p-5 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)] h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[var(--color-text)] flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--color-text-muted)]" />
          جریان فعالیت
        </h3>
      </div>
      <ul className="space-y-2 flex-1 min-h-0">
        {events.length === 0 ? (
          <li className="text-sm text-[var(--color-text-muted)] py-4">
            فعالیتی ثبت نشده.
          </li>
        ) : (
          events.slice(0, 10).map((event) => {
            const Icon = eventIcons[event.type] ?? FileText;
            const bg = eventBg[event.type] ?? eventBg.user_joined;
            return (
              <li key={event.id}>
                <div className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] hover:bg-[var(--color-bg)] transition-colors group">
                  <div
                    className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      {event.title}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">
                      {event.description}
                      {event.actor && ` · ${event.actor}`}
                    </p>
                    <p className="text-xs text-[var(--color-text-subtle)] mt-1">
                      {formatDistanceToNow(new Date(event.timestamp), {
                        addSuffix: true,
                        locale: faIR,
                      })}
                    </p>
                  </div>
                  {event.href && (
                    <Link
                      href={event.href}
                      className="shrink-0 text-xs text-[var(--primary)] hover:underline"
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
