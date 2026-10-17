import Link from 'next/link';
import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import NotFoundSearchButton from '@/components/site/NotFoundSearchButton';
import { EmptyState } from '@/components/ui/empty-state';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-wibe-surface" dir="rtl">
      <Header title="صفحه پیدا نشد" showBack />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <EmptyState
          title="صفحه‌ای که دنبالش بودی پیدا نشد"
          description="ممکن است آدرس اشتباه باشد یا این محتوا حذف شده باشد."
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-brand px-6 text-base font-semibold text-brand-foreground"
              >
                بازگشت به خانه
              </Link>
              <Link
                href="/lists"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-popover px-6 text-base font-semibold text-foreground"
              >
                مشاهده لیست‌ها
              </Link>
              <Link
                href="/explore"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-popover px-6 text-base font-semibold text-foreground"
              >
                اکسپلور
              </Link>
              <NotFoundSearchButton />
            </div>
          }
        />
      </main>
      <BottomNav />
    </div>
  );
}
