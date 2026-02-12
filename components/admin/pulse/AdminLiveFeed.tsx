'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { Bookmark, MessageSquare, UserPlus, Package, Radio } from 'lucide-react';

type ActivityItem =
  | { type: 'save'; createdAt: string; userName: string; listTitle: string }
  | { type: 'comment'; createdAt: string; userName: string; itemTitle: string; contentSnippet: string; itemId: string }
  | { type: 'user'; createdAt: string; userName: string }
  | { type: 'item'; createdAt: string; itemTitle: string; listTitle: string; itemId: string };

const POLL_INTERVAL_MS = 15000;

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

function EventCard({ item, isNew }: { item: ActivityItem; isNew: boolean }) {
  const timeAgo = formatDistanceToNow(new Date(item.createdAt), {
    addSuffix: true,
    locale: faIR,
  });

  const content = (() => {
    switch (item.type) {
      case 'save':
        return (
          <>
            <span className="text-gray-200">{item.userName}</span>
            <span className="text-gray-400"> لیست «{item.listTitle}» را ذخیره کرد</span>
          </>
        );
      case 'comment':
        return (
          <>
            <span className="text-gray-200">{item.userName}</span>
            <span className="text-gray-400"> درباره «{item.itemTitle}» نظر نوشت</span>
            {item.contentSnippet && (
              <p className="text-gray-500 text-xs mt-1 truncate max-w-full" title={item.contentSnippet}>
                «{item.contentSnippet}»
              </p>
            )}
          </>
        );
      case 'user':
        return (
          <>
            <span className="text-gray-200">{item.userName}</span>
            <span className="text-gray-400"> ثبت‌نام کرد</span>
          </>
        );
      case 'item':
        return (
          <>
            <span className="text-gray-400">آیتم «</span>
            <span className="text-gray-200">{item.itemTitle}</span>
            <span className="text-gray-400">» به لیست «{item.listTitle}» اضافه شد</span>
          </>
        );
    }
  })();

  const icon = (() => {
    switch (item.type) {
      case 'save':
        return <Bookmark className="w-4 h-4 text-amber-400 flex-shrink-0" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-cyan-400 flex-shrink-0" />;
      case 'user':
        return <UserPlus className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
      case 'item':
        return <Package className="w-4 h-4 text-violet-400 flex-shrink-0" />;
    }
  })();

  const href =
    item.type === 'comment' || item.type === 'item'
      ? `/items/${(item as { itemId?: string }).itemId}`
      : undefined;

  const className = `flex gap-3 p-3 rounded-lg border border-gray-700/50 bg-gray-800/30 transition-all ${
    isNew ? 'animate-fade-in' : ''
  } ${href ? 'hover:bg-gray-700/40' : ''}`;

  const inner = (
    <>
      {icon}
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">{content}</p>
        <p className="text-xs text-gray-500 mt-0.5">{timeAgo}</p>
      </div>
    </>
  );

  if (href) {
    return <Link href={href} className={className}>{inner}</Link>;
  }
  return <div className={className}>{inner}</div>;
}

export default function AdminLiveFeed() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const prevIdsRef = useRef<Set<string>>(new Set());

  const fetchActivity = async () => {
    try {
      const res = await fetch('/api/admin/live-activity');
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        const next = json.data as ActivityItem[];
        const nextIdSet = new Set(next.map(getEventId));
        const added = new Set<string>();
        nextIdSet.forEach((id) => {
          if (!prevIdsRef.current.has(id)) added.add(id);
        });
        prevIdsRef.current = nextIdSet;
        setNewIds(added);
        setItems(next);
        if (added.size > 0) {
          window.setTimeout(() => setNewIds(new Set()), 2000);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
    const t = setInterval(fetchActivity, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="rounded-xl bg-gray-800/40 border border-gray-700/50 overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-gray-700/50">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        <h2 className="text-sm font-semibold text-gray-300">فعالیت زنده</h2>
        <span className="text-xs text-gray-500">به‌روزرسانی هر ۱۵ ثانیه</span>
      </div>
      <div className="max-h-[420px] overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-gray-700/30 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-gray-500 text-sm py-6 text-center">هنوز فعالیتی ثبت نشده</p>
        ) : (
          items.map((item) => (
            <EventCard
              key={getEventId(item)}
              item={item}
              isNew={newIds.has(getEventId(item))}
            />
          ))
        )}
      </div>
    </section>
  );
}
