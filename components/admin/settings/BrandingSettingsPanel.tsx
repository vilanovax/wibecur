'use client';

import { ImageIcon } from 'lucide-react';
import ImageUpload from '@/components/admin/upload/ImageUpload';
import SettingsSectionCard from './SettingsSectionCard';
import SettingsSaveButton from './SettingsSaveButton';

type Props = {
  siteLogoUrl: string;
  onChange: (siteLogoUrl: string) => void;
  saving: boolean;
  onSave: () => void;
};

export default function BrandingSettingsPanel({
  siteLogoUrl,
  onChange,
  saving,
  onSave,
}: Props) {
  return (
    <SettingsSectionCard
      title="لوگوی سایت"
      description="نمایش در هدر، SEO و پنل مدیریت"
      icon={<ImageIcon className="w-5 h-5 text-[var(--primary)]" />}
      footer={
        <SettingsSaveButton onClick={onSave} loading={saving} label="ذخیره لوگو" />
      }
    >
      <div className="rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-bg)]/60 p-3 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[var(--color-text-muted)]">
          <div>
            <p className="font-medium text-[var(--color-text)] mb-1">ابعاد پیشنهادی</p>
            <ul className="space-y-0.5 list-disc list-inside leading-relaxed">
              <li>عرض: ۲۴۰ تا ۴۸۰ پیکسل</li>
              <li>ارتفاع: ۴۸ تا ۱۲۰ پیکسل</li>
              <li>نسبت تقریبی: ۴:۱ (لوگوی افقی)</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-[var(--color-text)] mb-1">فرمت و خروجی</p>
            <ul className="space-y-0.5 list-disc list-inside leading-relaxed">
              <li>PNG یا WebP با پس‌زمینه شفاف</li>
              <li>پس از آپلود: WebP تا ۴۸۰×۱۲۰</li>
              <li>حداکثر ~۱۲۰KB</li>
            </ul>
          </div>
        </div>
      </div>

      <ImageUpload
        value={siteLogoUrl}
        onChange={onChange}
        label="فایل لوگو"
        uploadPurpose="site-logo"
        previewVariant="logo"
        compact
      />
    </SettingsSectionCard>
  );
}
