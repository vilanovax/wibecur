'use client';

import Link from 'next/link';
import { MessageSquare, ExternalLink } from 'lucide-react';
import type { CommentSettingsState } from '@/lib/admin/settings-types';
import SettingsSectionCard from './SettingsSectionCard';
import SettingsSaveButton from './SettingsSaveButton';

type Props = {
  value: CommentSettingsState;
  onChange: (patch: Partial<CommentSettingsState>) => void;
  saving: boolean;
  onSave: () => void;
};

const inputClass =
  'w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] focus:ring-2 focus:ring-[var(--primary)]/30 tabular-nums';

export default function CommentSettingsPanel({
  value,
  onChange,
  saving,
  onSave,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <p className="text-[var(--color-text-muted)]">
          این تنظیمات روی آیتم‌های جدید و رفتار سراسری کامنت اثر می‌گذارد.
        </p>
        <Link
          href="/admin/comments/bad-words"
          className="inline-flex items-center gap-1 text-[var(--primary)] font-medium hover:underline"
        >
          کلمات ممنوع
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <SettingsSectionCard
        title="تنظیمات کامنت"
        description="محدودیت طول، تعداد و فاصله زمانی"
        icon={<MessageSquare className="w-5 h-5 text-[var(--primary)]" />}
        footer={
          <SettingsSaveButton
            onClick={onSave}
            loading={saving}
            label="ذخیره تنظیمات کامنت"
          />
        }
      >
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={value.defaultCommentsEnabled}
            onChange={(e) =>
              onChange({ defaultCommentsEnabled: e.target.checked })
            }
            className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--primary)]"
          />
          <span className="text-sm font-medium text-[var(--color-text)]">
            فعال بودن کامنت‌ها به‌صورت پیش‌فرض
          </span>
        </label>
        <p className="text-[11px] text-[var(--color-text-subtle)] -mt-2 mr-7">
          برای آیتم‌های جدید اعمال می‌شود
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-[var(--color-text)] mb-1.5 block">
              حداکثر کاراکتر کامنت
            </label>
            <input
              type="number"
              min={1}
              value={value.maxCommentLength ?? ''}
              onChange={(e) =>
                onChange({
                  maxCommentLength: e.target.value
                    ? parseInt(e.target.value, 10)
                    : null,
                })
              }
              className={inputClass}
              placeholder="نامحدود"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-text)] mb-1.5 block">
              حداکثر کامنت هر آیتم
            </label>
            <input
              type="number"
              min={1}
              value={value.defaultMaxComments ?? ''}
              onChange={(e) =>
                onChange({
                  defaultMaxComments: e.target.value
                    ? parseInt(e.target.value, 10)
                    : null,
                })
              }
              className={inputClass}
              placeholder="نامحدود"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-text)] mb-1.5 block">
              فاصله بین کامنت‌ها (دقیقه)
            </label>
            <input
              type="number"
              min={1}
              value={value.rateLimitMinutes}
              onChange={(e) =>
                onChange({
                  rateLimitMinutes: parseInt(e.target.value, 10) || 5,
                })
              }
              className={inputClass}
            />
            <p className="text-[11px] text-[var(--color-text-subtle)] mt-1">
              در یک آیتم
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-text)] mb-1.5 block">
              فاصله سراسری (دقیقه)
            </label>
            <input
              type="number"
              min={1}
              value={value.globalRateLimitMinutes ?? ''}
              onChange={(e) =>
                onChange({
                  globalRateLimitMinutes: e.target.value
                    ? parseInt(e.target.value, 10)
                    : null,
                })
              }
              className={inputClass}
              placeholder="غیرفعال"
            />
            <p className="text-[11px] text-[var(--color-text-subtle)] mt-1">
              بین همه آیتم‌ها — خالی = خاموش
            </p>
          </div>
        </div>
      </SettingsSectionCard>
    </div>
  );
}
