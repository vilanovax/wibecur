import { requireAdmin } from '@/lib/auth';
import { getSuggestionsStats } from '@/lib/admin/suggestions-stats';
import SuggestionsPageClient from './SuggestionsPageClient';

export const metadata = {
  title: 'پیشنهادها | پنل مدیریت',
  description: 'مدیریت پیشنهادات لیست و آیتم',
};

export default async function SuggestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string; page?: string; source?: string }>;
}) {
  await requireAdmin();

  const { tab = 'items', status = 'pending', page = '1', source = 'all' } = await searchParams;
  const stats = await getSuggestionsStats();

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="rounded-2xl border border-violet-100 bg-gradient-to-l from-violet-600 to-indigo-600 px-5 py-5 text-white shadow-sm md:px-6">
        <h1 className="text-xl font-bold md:text-2xl">پیشنهادها</h1>
        <p className="mt-1 text-sm text-white/75">
          بررسی پیشنهاد لیست، فرم آیتم، و پیشنهاد سریع کاربران
        </p>
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1.5 text-sm text-amber-100 ring-1 ring-amber-400/20">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              {stats.totalPending.toLocaleString('fa-IR')} در انتظار
            </span>
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/90 ring-1 ring-white/10">
              {stats.itemPending.toLocaleString('fa-IR')} آیتم
              {stats.itemMenuPending > 0 && (
                <span className="mr-1 text-white/60">· {stats.itemMenuPending.toLocaleString('fa-IR')} منو</span>
              )}
            </span>
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/90 ring-1 ring-white/10">
              {stats.listPending.toLocaleString('fa-IR')} لیست
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1.5 text-sm text-emerald-100 ring-1 ring-emerald-400/20">
              {stats.totalApproved.toLocaleString('fa-IR')} تأیید شده
            </span>
          </div>
        </div>
      </header>

      <SuggestionsPageClient
        initialTab={tab}
        initialStatus={status}
        initialPage={page}
        initialSource={source}
        itemPendingCount={stats.itemPending}
      />
    </div>
  );
}
