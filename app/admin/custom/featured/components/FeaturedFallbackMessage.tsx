'use client';

type Props = {
  fallbackList: { id: string; title: string; slug: string } | null;
};

export default function FeaturedFallbackMessage({ fallbackList }: Props) {
  return (
    <div
      className="rounded-3xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-900/20 p-6"
      dir="rtl"
    >
      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
        هیچ اسلات رزروی فعالی نیست. در هوم اپ از لیست <strong>ویژه (ستاره‌دار)</strong> به‌عنوان منتخب استفاده می‌شود.
      </p>
      {fallbackList ? (
        <p className="text-sm text-amber-800 dark:text-amber-200 mt-2">
          الان این لیست به‌عنوان منتخب نمایش داده می‌شود: <strong>{fallbackList.title}</strong>
          {' — '}
          <span className="text-xs">(از هوش لیست‌ها با دکمه «ویژه» تنظیم می‌شود)</span>
        </p>
      ) : (
        <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
          هیچ لیست ویژه‌ای در هوش لیست‌ها تعریف نشده. در لیست‌ها یک لیست را «ویژه» کنید.
        </p>
      )}
      <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
        حذف و ویرایش زمان‌بندی فقط برای اسلات رزروی امکان‌پذیر است. برای تعیین منتخب با زمان‌بندی، از کارت «افزودن اسلات» استفاده کنید.
      </p>
    </div>
  );
}
