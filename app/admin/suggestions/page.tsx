import { requireAdmin } from '@/lib/auth';
import SuggestionsPageClient from './SuggestionsPageClient';

export const metadata = {
  title: 'پیشنهادها | پنل مدیریت',
  description: 'مدیریت پیشنهادات لیست و آیتم',
};

export default async function SuggestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string; page?: string }>;
}) {
  await requireAdmin();

  const { tab = 'lists', status = 'pending', page = '1' } = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">پیشنهادها</h1>
        <p className="text-gray-600">
          مدیریت و بررسی پیشنهادات لیست و آیتم از کاربران
        </p>
      </div>

      <SuggestionsPageClient
        initialTab={tab}
        initialStatus={status}
        initialPage={page}
      />
    </div>
  );
}

