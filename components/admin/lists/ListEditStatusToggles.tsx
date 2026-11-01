'use client';

import { Eye, Globe, Star, Power, MessageSquare } from 'lucide-react';

type ToggleKey =
  | 'isPublic'
  | 'isFeatured'
  | 'isActive'
  | 'commentsEnabled'
  | 'itemDetailEnabled';

const TOGGLES: Array<{
  key: ToggleKey;
  label: string;
  hint: string;
  icon: typeof Globe;
  onClass: string;
}> = [
  {
    key: 'isPublic',
    label: 'عمومی',
    hint: 'برای همه قابل مشاهده',
    icon: Globe,
    onClass: 'border-emerald-400 bg-emerald-50/80 ring-1 ring-emerald-400/40',
  },
  {
    key: 'isFeatured',
    label: 'Featured',
    hint: 'نمایش در صفحه اصلی',
    icon: Star,
    onClass: 'border-amber-400 bg-amber-50/80 ring-1 ring-amber-400/40',
  },
  {
    key: 'isActive',
    label: 'فعال',
    hint: 'لیست در اپ نمایش داده می‌شود',
    icon: Power,
    onClass: 'border-(--primary) bg-primary/8 ring-1 ring-(--primary)/30',
  },
  {
    key: 'commentsEnabled',
    label: 'کامنت‌ها',
    hint: 'امکان ثبت نظر',
    icon: MessageSquare,
    onClass: 'border-indigo-400 bg-indigo-50/80 ring-1 ring-indigo-400/40',
  },
  {
    key: 'itemDetailEnabled',
    label: 'مشاهده',
    hint: 'دکمهٔ مشاهده در پیش‌نمایش آیتم',
    icon: Eye,
    onClass: 'border-sky-400 bg-sky-50/80 ring-1 ring-sky-400/40',
  },
];

interface ListEditStatusTogglesProps {
  values: Record<ToggleKey, boolean>;
  onChange: (key: ToggleKey, value: boolean) => void;
}

export default function ListEditStatusToggles({ values, onChange }: ListEditStatusTogglesProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2" dir="rtl">
      {TOGGLES.map(({ key, label, hint, icon: Icon, onClass }) => {
        const on = values[key];
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key, !on)}
            className={`min-h-11 rounded-xl border p-3 text-right transition-all ${
              on ? onClass : 'border-(--color-border-muted) hover:border-(--color-border) hover:bg-(--color-bg)/60'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <Icon className={`w-4 h-4 shrink-0 ${on ? 'text-(--color-text)' : 'text-wibe-secondary'}`} />
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  on ? 'bg-white/80 text-(--color-text)' : 'bg-(--color-bg) text-wibe-secondary'
                }`}
              >
                {on ? 'روشن' : 'خاموش'}
              </span>
            </div>
            <p className="text-sm font-semibold text-(--color-text)">{label}</p>
            <p className="text-[10px] text-wibe-secondary mt-0.5 leading-snug">{hint}</p>
          </button>
        );
      })}
    </div>
  );
}
