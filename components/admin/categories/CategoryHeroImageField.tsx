'use client';

import ImageUpload from '@/components/admin/upload/ImageUpload';

interface CategoryHeroImageFieldProps {
  value: string;
  onChange: (url: string) => void;
  compact?: boolean;
}

/** تصویر کاور / هیرو صفحه دسته — آپلود بهینه‌شده (hubCover) */
export default function CategoryHeroImageField({
  value,
  onChange,
  compact = true,
}: CategoryHeroImageFieldProps) {
  return (
    <div>
      <ImageUpload
        value={value}
        onChange={onChange}
        label="تصویر کاور دسته"
        uploadPurpose="category-hero"
        previewVariant="horizontal"
        compact={compact}
      />
      <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
        در ParsPack (پوشه hubs) ذخیره می‌شود — نسبت ۱۶:۹ · JPG/PNG/WebP تا ۱۰MB · تبدیل به WebP
        (حداکثر ۱۶۰۰×۹۰۰، ~۳۲۰KB)
      </p>
    </div>
  );
}
