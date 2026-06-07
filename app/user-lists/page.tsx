import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import CuratedLandingPageClient from '@/components/mobile/curated/CuratedLandingPageClient';
import { auth } from '@/lib/auth-config';
import { resolveSessionUserId } from '@/lib/api-db';
import { fetchExploreData, type ExplorePayload } from '@/lib/curated/explore-data';

export const dynamic = 'force-dynamic';

export default async function UserListsPage() {
  // داده‌ی اکسپلور سمت سرور واکشی می‌شود تا کلاینت skeleton + یک round-trip اضافه
  // نزند؛ react-query با initialData هیدریت می‌شود.
  let initialData: ExplorePayload | undefined;
  try {
    let userId: string | null = null;
    const session = await auth();
    if (session?.user) {
      userId = await resolveSessionUserId(session);
    }
    initialData = await fetchExploreData(userId);
  } catch (err) {
    console.warn('[UserListsPage] SSR explore fetch failed, falling back to client fetch:', err);
  }

  return (
    <div className="bg-wibe-surface">
      <Header title="اکسپلور" hideTitleOnDesktop hideOnDesktop showDesktopSearch={false} />
      <CuratedLandingPageClient initialData={initialData} />
      <BottomNav />
    </div>
  );
}
