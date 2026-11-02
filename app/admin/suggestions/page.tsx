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

  const summaryParts = [
    `${stats.totalPending.toLocaleString('fa-IR')} در انتظار`,
    `${stats.itemPending.toLocaleString('fa-IR')} آیتم`,
    stats.itemMenuPending > 0
      ? `${stats.itemMenuPending.toLocaleString('fa-IR')} از منو`
      : null,
    `${stats.listPending.toLocaleString('fa-IR')} لیست`,
    `${stats.totalApproved.toLocaleString('fa-IR')} تأیید شده`,
  ].filter(Boolean);

  return (
    <div className="space-y-4" dir="rtl">
      <header className="space-y-1">
        <h1 className="text-xl font-bold leading-snug text-(--color-text)">پیشنهادها</h1>
        <p className="text-sm leading-relaxed text-wibe-secondary">
          پیشنهاد لیست، فرم آیتم و پیشنهاد سریع کاربران را بررسی کنید.
        </p>
        <p className="text-sm leading-relaxed text-wibe-secondary">
          {summaryParts.join(' · ')}
        </p>
      </header>

      <SuggestionsPageClient
        initialTab={tab}
        initialStatus={status}
        initialPage={page}
        initialSource={source}
        itemPendingCount={stats.itemPending}
        listPendingCount={stats.listPending}
      />
    </div>
  );
}
