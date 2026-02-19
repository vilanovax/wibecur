'use client';

import { Pencil, Trash2 } from 'lucide-react';
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
  Scheduled: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  Active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  Expired: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

const statusLabels: Record<string, string> = {
  Scheduled: 'برنامه‌ریزی شده',
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
  if (slots.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
        اسلات آینده‌ای تعریف نشده.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" dir="rtl">
      {slots.map((s) => {
        const status = getStatus(s, now);
        return (
          <div
            key={s.id}
            className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                  {s.list.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {formatDate(s.startAt)}
                  {s.endAt ? ` – ${formatDate(s.endAt)}` : ' – نامحدود'}
                </p>
                <span
                  className={`inline-block mt-2 px-2 py-0.5 rounded-lg text-xs font-medium ${statusStyles[status]}`}
                >
                  {statusLabels[status]}
                </span>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onEdit(s)}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="ویرایش"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(s.id)}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  aria-label="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
