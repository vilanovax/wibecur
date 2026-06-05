'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { Pause, Play } from 'lucide-react';
import clsx from 'clsx';

type ActivityType = 'save' | 'comment' | 'user' | 'item';

type ActivityItem =
  | { type: 'save'; createdAt: string; userName: string; listTitle: string; listId: string }
  | { type: 'comment'; createdAt: string; userName: string; itemTitle: string; contentSnippet: string; itemId: string }
  | { type: 'user'; createdAt: string; userName: string }
  | { type: 'item'; createdAt: string; itemTitle: string; listTitle: string; itemId: string };

const POLL_INTERVAL_MS = 15000;
type ConnectionMode = 'sse' | 'poll';

const FILTERS: { id: 'all' | ActivityType; label: string }[] = [
  { id: 'all', label: 'همه' },
  { id: 'save', label: 'ذخیره' },
  { id: 'comment', label: 'کامنت' },
  { id: 'user', label: 'کاربر' },
  { id: 'item', label: 'آیتم' },
];

const BADGE: Record<ActivityType, { label: string; className: string }> = {
  save: { label: 'ذخیره', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' },
  comment: { label: 'کامنت', className: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' },
  user: { label: 'کاربر', className: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300' },
  item: { label: 'آیتم', className: 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300' },
};

function getEventId(item: ActivityItem): string {
  switch (item.type) {
    case 'save':
      return `save-${item.createdAt}-${item.userName}-${item.listTitle}`;
    case 'comment':
      return `comment-${item.createdAt}-${item.userName}-${item.itemId}`;
    case 'user':
      return `user-${item.createdAt}-${item.userName}`;
    case 'item':
      return `item-${item.createdAt}-${item.itemId}`;
  }
}

function getAdminHref(item: ActivityItem): string | undefined {
  switch (item.type) {
    case 'save':
      return `/admin/lists/${item.listId}/edit`;
    case 'comment':
    case 'item':
      return `/admin/items/${item.itemId}/edit`;
    default:
      return undefined;
  }
}

function eventSummary(item: ActivityItem): string {
  switch (item.type) {
    case 'save':
      return `${item.userName} · «${item.listTitle}»`;
    case 'comment':
      return `${item.userName} · «${item.itemTitle}»`;
    case 'user':
      return item.userName;
    case 'item':
      return `«${item.itemTitle}» → «${item.listTitle}»`;
  }
}

function EventRow({ item, isNew }: { item: ActivityItem; isNew: boolean }) {
  const timeAgo = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: faIR });
  const badge = BADGE[item.type];
  const href = getAdminHref(item);
  const summary = eventSummary(item);

  const className = clsx(
    'block rounded-md border border-transparent px-2 py-1.5 transition-colors',
    'hover:bg-admin-muted/80 dark:hover:bg-gray-700/50 hover:border-admin-border dark:hover:border-gray-600',
    isNew && 'bg-violet-50/50 dark:bg-violet-500/5 border-violet-200/60 dark:border-violet-500/20'
  );

  const inner = (
    <div className="flex items-start gap-2.5 min-w-0">
      <span className={clsx('shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold', badge.className)}>
        {badge.label}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-admin-text-primary leading-snug line-clamp-2">{summary}</p>
        {item.type === 'comment' && item.contentSnippet && (
          <p className="text-xs text-admin-text-tertiary mt-0.5 line-clamp-1">«{item.contentSnippet}»</p>
        )}
        <p className="text-[10px] text-admin-text-tertiary mt-1">{timeAgo}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }
  return <div className={className}>{inner}</div>;
}

export default function AdminLiveFeed() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | ActivityType>('all');
  const [paused, setPaused] = useState(false);
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('sse');
  const prevIdsRef = useRef<Set<string>>(new Set());

  const applyActivity = useCallback((next: ActivityItem[]) => {
    const nextIdSet = new Set(next.map(getEventId));
    const added = new Set<string>();
    nextIdSet.forEach((id) => {
      if (!prevIdsRef.current.has(id)) added.add(id);
    });
    prevIdsRef.current = nextIdSet;
    setNewIds(added);
    setItems(next);
    setError(false);
    setLoading(false);
    if (added.size > 0) {
      window.setTimeout(() => setNewIds(new Set()), 2000);
    }
  }, []);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/live-activity');
      if (!res.ok) {
        setError(true);
        return;
      }
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        applyActivity(json.data as ActivityItem[]);
      }
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [applyActivity]);

  useEffect(() => {
    if (paused) return;

    if (connectionMode === 'sse' && typeof EventSource !== 'undefined') {
      const es = new EventSource('/api/admin/live-activity/stream');
      es.onmessage = (ev) => {
        try {
          const json = JSON.parse(ev.data as string) as { data?: ActivityItem[] };
          if (json.data && Array.isArray(json.data)) {
            applyActivity(json.data);
          }
        } catch (e) {
          console.error(e);
        }
      };
      es.onerror = () => {
        es.close();
        setConnectionMode('poll');
      };
      return () => es.close();
    }

    void fetchActivity();
    const t = setInterval(() => void fetchActivity(), POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [paused, connectionMode, fetchActivity, applyActivity]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((i) => i.type === filter);
  }, [items, filter]);

  const connectionHint = paused
    ? 'متوقف'
    : connectionMode === 'sse'
      ? 'SSE · ~۱۲ث'
      : 'هر ۱۵ث';

  return (
    <section className="flex flex-col rounded-xl border border-admin-border dark:border-gray-600 bg-white dark:bg-gray-800/40 shadow-sm overflow-hidden xl:sticky xl:top-3 max-h-[calc(100vh-11rem)] min-h-[320px]">
      <div className="shrink-0 px-2.5 py-2 border-b border-admin-border dark:border-gray-600 bg-admin-muted/20 dark:bg-gray-800/60">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            {!paused && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            )}
            <h2 className="text-sm font-bold text-admin-text-primary">فعالیت زنده</h2>
            <span className="text-[10px] text-admin-text-tertiary rounded-md bg-white dark:bg-gray-700 px-1.5 py-0.5 border border-admin-border/60">
              {connectionHint}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="inline-flex items-center gap-1 rounded-lg border border-admin-border dark:border-gray-600 px-2 py-1 text-xs text-admin-text-secondary hover:bg-white dark:hover:bg-gray-700"
            aria-label={paused ? 'ادامه به‌روزرسانی' : 'توقف به‌روزرسانی'}
          >
            {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          </button>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-thin">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={clsx(
                'shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                filter === f.id
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-admin-text-secondary hover:bg-white dark:hover:bg-gray-700'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 min-h-0">
        {loading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-admin-muted dark:bg-gray-700/30 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <p className="text-red-600 text-sm py-8 text-center px-4">
            خطا در بارگذاری
            <button
              type="button"
              onClick={() => void fetchActivity()}
              className="block mx-auto mt-2 text-violet-600 underline text-xs"
            >
              تلاش مجدد
            </button>
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-admin-text-tertiary text-sm py-12 text-center px-4">
            {filter === 'all' ? 'هنوز فعالیتی ثبت نشده' : 'رویدادی با این فیلتر نیست'}
          </p>
        ) : (
          <div className="divide-y divide-admin-border/60 dark:divide-gray-700/60">
            {filtered.map((item) => (
              <EventRow key={getEventId(item)} item={item} isNew={newIds.has(getEventId(item))} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
