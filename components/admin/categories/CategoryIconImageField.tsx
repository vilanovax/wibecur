'use client';

import ImageUpload from '@/components/admin/upload/ImageUpload';

interface CategoryIconImageFieldProps {
  value: string;
  onChange: (url: string) => void;
  compact?: boolean;
}

/** آیکون گرافیکی دسته — آپلود مربع کوچک با شفافیت */
export default function CategoryIconImageField({
  value,
  onChange,
  compact = true,
}: CategoryIconImageFieldProps) {
  return (
    <div>
      <ImageUpload
        value={value}
        onChange={onChange}
        label="آیکون گرافیکی (اختیاری)"
        uploadPurpose="category-icon"
        previewVariant="icon"
        compact={compact}
      />
      <p className="mt-1.5 text-xs leading-relaxed text-wibe-secondary">
        اگر آپلود شود، در اپ به‌جای ایموجی نشان داده می‌شود. PNG شفاف یا WebP ترجیح دارد · حداکثر
        ۲۵۶×۲۵۶.
      </p>
    </div>
  );
}
