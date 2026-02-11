import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { requireAuth } from '@/lib/auth';
import ProfilePageClient from './ProfilePageClient';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await requireAuth();
  const userId = session.user.id;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <Header title="پروفایل" />
      <main className="px-4 py-5">
        <ProfilePageClient userId={userId} />
      </main>
      <BottomNav />
    </div>
  );
}
