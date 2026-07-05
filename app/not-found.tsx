import Link from 'next/link';
import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import NotFoundSearchButton from '@/components/site/NotFoundSearchButton';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-wibe-surface" dir="rtl">
      <Header title="صفحه پیدا نشد" showBack />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <p className="text-6xl font-bold text-primary/20 tabular-nums">۴۰۴</p>
        <h1 className="mt-4 text-xl font-bold text-foreground">صفحه‌ای که دنبالش بودی پیدا نشد</h1>
        <p className="mt-2 max-w-sm wibe-small text-wibe-secondary">
          ممکن است آدرس اشتباه باشد یا این محتوا حذف شده باشد.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 wibe-small font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            بازگشت به خانه
          </Link>
          <Link
            href="/lists"
            className="inline-flex items-center justify-center rounded-xl border border-wibe px-5 py-2.5 wibe-small font-semibold text-foreground hover:border-primary/40 transition-colors"
          >
            مشاهده لیست‌ها
          </Link>
          <Link
            href="/user-lists"
            className="inline-flex items-center justify-center rounded-xl border border-wibe px-5 py-2.5 wibe-small font-semibold text-foreground hover:border-primary/40 transition-colors"
          >
            اکسپلور
          </Link>
          <NotFoundSearchButton />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
