'use client';

import ImageUpload from '@/components/admin/upload/ImageUpload';

interface ListCoverImageFieldsProps {
  coverImage: string;
  horizontalImage: string;
  onCoverChange: (url: string) => void;
  onHorizontalChange: (url: string) => void;
}

/** فیلدهای کاور عمودی + بنر افقی لیست */
export default function ListCoverImageFields({
  coverImage,
  horizontalImage,
  onCoverChange,
  onHorizontalChange,
}: ListCoverImageFieldsProps) {
  return (
    <div className="space-y-5 md:col-span-2">
      <div>
        <ImageUpload
          value={coverImage}
          onChange={onCoverChange}
          label="تصویر کاور (عمودی)"
          uploadPurpose="list-cover"
          previewVariant="cover"
          compact
        />
        <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
          برای کارت لیست در فید و گرید — نسبت پیشنهادی ۴:۳ یا ۳:۴
        </p>
      </div>
      <div>
        <ImageUpload
          value={horizontalImage}
          onChange={onHorizontalChange}
          label="تصویر افقی (بنر)"
          uploadPurpose="list-horizontal"
          previewVariant="horizontal"
          compact
        />
        <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
          برای بنر Featured و هدر جزئیات لیست — نسبت پیشنهادی ۲۱:۹ یا ۱۶:۹
        </p>
      </div>
    </div>
  );
}
