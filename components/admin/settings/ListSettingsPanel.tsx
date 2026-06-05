'use client';

import { List } from 'lucide-react';
import SettingsSectionCard from './SettingsSectionCard';
import SettingsSaveButton from './SettingsSaveButton';

type Props = {
  minItemsForPublicList: number;
  maxPersonalLists: number;
  personalListPublicInstructions: string;
  onChange: (patch: {
    minItemsForPublicList?: number;
    maxPersonalLists?: number;
    personalListPublicInstructions?: string;
  }) => void;
  saving: boolean;
  onSave: () => void;
};

const inputClass =
  'w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] focus:ring-2 focus:ring-[var(--primary)]/30 tabular-nums';

export default function ListSettingsPanel({
  minItemsForPublicList,
  maxPersonalLists,
  personalListPublicInstructions,
  onChange,
  saving,
  onSave,
}: Props) {
  const charCount = personalListPublicInstructions.length;

  return (
    <SettingsSectionCard
      title="لیست‌های کاربران"
      description="قوانین عمومی‌کردن و سقف لیست خصوصی"
      icon={<List className="w-5 h-5 text-[var(--primary)]" />}
      footer={
        <SettingsSaveButton
          onClick={onSave}
          loading={saving}
          label="ذخیره تنظیمات لیست"
        />
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-[var(--color-text)] mb-1.5 block">
            حداقل آیتم برای لیست عمومی
          </label>
          <input
            type="number"
            min={1}
            value={minItemsForPublicList}
            onChange={(e) =>
              onChange({
                minItemsForPublicList: parseInt(e.target.value, 10) || 5,
              })
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-[var(--color-text)] mb-1.5 block">
            حداکثر لیست خصوصی هر کاربر
          </label>
          <input
            type="number"
            min={1}
            value={maxPersonalLists}
            onChange={(e) =>
              onChange({
                maxPersonalLists: parseInt(e.target.value, 10) || 3,
              })
            }
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-sm font-medium text-[var(--color-text)]">
            پیام راهنمای عمومی‌کردن لیست
          </label>
          <span className="text-[10px] text-[var(--color-text-subtle)] tabular-nums">
            {charCount.toLocaleString('fa-IR')} کاراکتر
          </span>
        </div>
        <textarea
          value={personalListPublicInstructions}
          onChange={(e) =>
            onChange({ personalListPublicInstructions: e.target.value })
          }
          rows={4}
          className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] resize-y min-h-[96px] focus:ring-2 focus:ring-[var(--primary)]/30"
          placeholder="متنی که هنگام عمومی کردن لیست به کاربر نشان داده می‌شود…"
        />
        {personalListPublicInstructions.trim() && (
          <div className="mt-2 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] p-3">
            <p className="text-[10px] text-[var(--color-text-muted)] mb-1">
              پیش‌نمایش
            </p>
            <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap">
              {personalListPublicInstructions}
            </p>
          </div>
        )}
      </div>
    </SettingsSectionCard>
  );
}
