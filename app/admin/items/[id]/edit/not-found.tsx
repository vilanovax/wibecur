import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[var(--color-text)] mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-[var(--color-text)] mb-4">
          آیتم یافت نشد
        </h2>
        <p className="text-[var(--color-text-muted)] mb-8">
          آیتم مورد نظر حذف شده یا وجود ندارد
        </p>
        <Link
          href="/admin/lists?view=catalog"
          className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors"
        >
          بازگشت به لیست آیتم‌ها
        </Link>
      </div>
    </div>
  );
}
