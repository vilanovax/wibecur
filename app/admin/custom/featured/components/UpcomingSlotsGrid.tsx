'use client';

import { Pencil, Trash2 } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { SlotItem } from '../FeaturedManagementClient';

export type { SlotItem };

type Props = {
  slots: SlotItem[];
  formatDate: (s: string) => string;
  now: Date;
  onEdit: (slot: SlotItem) => void;
  onDelete: (slotId: string) => void;
};

function getStatus(slot: SlotItem, now: Date): 'Scheduled' | 'Active' | 'Expired' {
  const start = new Date(slot.startAt);
  const end = slot.endAt ? new Date(slot.endAt) : null;
  if (end && end < now) return 'Expired';
  if (start <= now && (!end || end > now)) return 'Active';
  return 'Scheduled';
}

const statusStyles: Record<string, string> = {
  Scheduled: 'bg-sky-50 text-sky-800',
  Active: 'bg-emerald-50 text-emerald-800',
  Expired: 'bg-(--color-bg) text-wibe-secondary',
};

const statusLabels: Record<string, string> = {
  Scheduled: 'در صف',
  Active: 'فعال',
  Expired: 'منقضی',
};

export default function UpcomingSlotsGrid({
  slots,
  formatDate,
  now,
  onEdit,
  onDelete,
}: Props) {
  if (slots.length === 0) return null;

  return (
    <ul className="space-y-2" dir="rtl">
      {slots.map((s) => {
        const status = getStatus(s, now);
        return (
          <li
            key={s.id}
            className="flex items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-3"
          >
            <div className="relative aspect-square size-14 shrink-0 overflow-hidden rounded-lg bg-(--color-bg)">
              <ImageWithFallback
                src={s.list.coverImage ?? ''}
                alt={s.list.title}
                className="size-full object-cover"
                fallbackIcon="🎬"
                fallbackClassName="size-full"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-medium leading-snug text-(--color-text)">
                  {s.list.title}
                </h3>
                <span
                  className={`inline-flex rounded-md px-2 py-0.5 text-sm font-medium ${statusStyles[status]}`}
                >
                  {statusLabels[status]}
                </span>
              </div>
              <p className="mt-1 text-sm text-wibe-secondary">
                {formatDate(s.startAt)}
                {s.endAt ? ` → ${formatDate(s.endAt)}` : ' · نامحدود'}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => onEdit(s)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-wibe-secondary hover:bg-(--color-bg) hover:text-(--color-text)"
                aria-label="ویرایش زمان"
              >
                <Pencil className="size-4" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(s.id)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-red-700 hover:bg-red-50"
                aria-label="حذف اسلات"
              >
                <Trash2 className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
