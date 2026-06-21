'use client';

import { AlertTriangle } from 'lucide-react';
import SiteMaintenancePage from '@/components/site/SiteMaintenancePage';
import SettingsSectionCard from './SettingsSectionCard';
import SettingsSaveButton from './SettingsSaveButton';
import type { MaintenanceModeSettings } from '@/lib/maintenance-mode-types';

type Props = {
  value: MaintenanceModeSettings;
  siteLogoUrl: string | null;
  onChange: (patch: Partial<MaintenanceModeSettings>) => void;
  saving: boolean;
  onSave: () => void;
};

const inputClass =
  'w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] focus:ring-2 focus:ring-[var(--primary)]/30';

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  danger,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  danger?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div>
        <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
        {description ? (
          <p className="text-[11px] text-[var(--color-text-subtle)] mt-0.5 leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 mt-0.5 ${
          checked
            ? danger
              ? 'bg-amber-500'
              : 'bg-[var(--primary)]'
            : 'bg-[var(--color-border)]'
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}

export default function MaintenanceModePanel({
  value,
  siteLogoUrl,
  onChange,
  saving,
  onSave,
}: Props) {
  const previewLogoUrl = value.showLogo && siteLogoUrl ? siteLogoUrl : null;

  return (
    <div className="space-y-4">
      {value.enabled ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-3 text-sm text-amber-900">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
          <p>
            حالت اضطراری <strong>فعال</strong> است. بازدیدکنندگان به‌جای سایت، صفحه
            سفارشی را می‌بینند. پنل ادمین همچنان در دسترس است.
            {value.allowAdminBrowse ? (
              <>
                {' '}
                اگر «دسترسی ادمین به سایت عادی» روشن باشد، <strong>شما</strong> (ادمین
                واردشده) سایت را مثل حالت عادی می‌بینید — برای تست بازدیدکننده، این گزینه
                را خاموش کنید یا از مرورگر ناشناس استفاده کنید.
              </>
            ) : null}
          </p>
        </div>
      ) : null}

      <SettingsSectionCard
        title="حالت اضطراری سایت"
        description="نمایش یک صفحه سفارشی به‌جای کل سایت — مناسب به‌روزرسانی و تغییرات مهم"
        icon={<AlertTriangle className="w-5 h-5 text-[var(--primary)]" />}
        footer={
          <SettingsSaveButton
            onClick={onSave}
            loading={saving}
            label={value.enabled ? 'ذخیره و اعمال' : 'ذخیره تنظیمات'}
          />
        }
      >
        <ToggleRow
          label="فعال‌سازی صفحه اضطراری"
          description="با فعال شدن، تمام صفحات عمومی سایت جایگزین می‌شوند"
          checked={value.enabled}
          onChange={(enabled) => onChange({ enabled })}
          danger
        />

        <ToggleRow
          label="نمایش لوگوی سایت"
          description="از لوگوی آپلودشده در تب «ظاهر سایت» استفاده می‌شود"
          checked={value.showLogo}
          onChange={(showLogo) => onChange({ showLogo })}
        />

        <ToggleRow
          label="دسترسی ادمین به سایت عادی"
          description="ادمین‌های واردشده می‌توانند سایت را مثل حالت عادی ببینند"
          checked={value.allowAdminBrowse}
          onChange={(allowAdminBrowse) => onChange({ allowAdminBrowse })}
        />

        <div>
          <label className="text-sm font-medium text-[var(--color-text)] mb-1.5 block">
            عنوان صفحه
          </label>
          <input
            type="text"
            value={value.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className={inputClass}
            placeholder="در حال به‌روزرسانی"
            maxLength={120}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--color-text)] mb-1.5 block">
            زیرعنوان (اختیاری)
          </label>
          <input
            type="text"
            value={value.subtitle}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            className={inputClass}
            placeholder="مثلاً: به‌زودی برمی‌گردیم"
            maxLength={160}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--color-text)] mb-1.5 block">
            متن پیام
          </label>
          <textarea
            value={value.message}
            onChange={(e) => onChange({ message: e.target.value })}
            rows={4}
            className={`${inputClass} resize-y min-h-[96px]`}
            placeholder="توضیح کوتاه برای بازدیدکنندگان..."
            maxLength={2000}
          />
          <p className="text-[11px] text-[var(--color-text-subtle)] mt-1">
            {value.message.length}/2000 — خط جدید با Enter
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--color-text)] mb-1.5 block">
            رنگ تأکید
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={value.accentColor}
              onChange={(e) => onChange({ accentColor: e.target.value })}
              className="h-10 w-14 rounded-lg border border-[var(--color-border)] cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={value.accentColor}
              onChange={(e) => onChange({ accentColor: e.target.value })}
              className={`${inputClass} max-w-[140px] font-mono text-xs`}
              pattern="^#[0-9A-Fa-f]{6}$"
              placeholder="#6366F1"
            />
          </div>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="پیش‌نمایش"
        description="نمای تقریبی صفحه‌ای که بازدیدکنندگان می‌بینند"
      >
        <SiteMaintenancePage
          preview
          config={{
            title: value.title || 'در حال به‌روزرسانی',
            subtitle: value.subtitle || null,
            message: value.message,
            showLogo: value.showLogo,
            accentColor: value.accentColor,
            logoUrl: previewLogoUrl,
          }}
        />
      </SettingsSectionCard>
    </div>
  );
}
