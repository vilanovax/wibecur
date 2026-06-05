'use client';

import { Plug, CheckCircle, AlertCircle } from 'lucide-react';
import type { SettingsData } from '@/lib/admin/settings-types';
import { countConfiguredIntegrations } from '@/lib/admin/settings-types';

type Props = {
  settings: SettingsData;
};

export default function SettingsStatusStrip({ settings }: Props) {
  const { configured, total, partialGoogle } =
    countConfiguredIntegrations(settings);
  const missing = total - configured;

  return (
    <div className="space-y-2 mb-4" dir="rtl">
      {partialGoogle && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200/60 rounded-xl px-3 py-2">
          Google: Search Engine ID تنظیم است؛ برای جستجوی تصویر{' '}
          <strong>کلید API</strong> را هم وارد و ذخیره کنید.
        </p>
      )}
    <div
      className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3"
    >
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mb-1">
          <Plug className="w-3.5 h-3.5 text-[var(--primary)]" />
          سرویس‌های متصل
        </div>
        <p className="text-lg sm:text-xl font-bold tabular-nums text-[var(--color-text)]">
          {configured.toLocaleString('fa-IR')} / {total.toLocaleString('fa-IR')}
        </p>
      </div>
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mb-1">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          آماده استفاده
        </div>
        <p className="text-lg sm:text-xl font-bold tabular-nums text-emerald-700">
          {configured.toLocaleString('fa-IR')}
        </p>
      </div>
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mb-1">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          نیاز به تنظیم
        </div>
        <p className="text-lg sm:text-xl font-bold tabular-nums text-amber-700">
          {missing.toLocaleString('fa-IR')}
        </p>
      </div>
    </div>
    </div>
  );
}
