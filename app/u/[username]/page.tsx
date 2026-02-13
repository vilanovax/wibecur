import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { auth } from '@/lib/auth-config';
import PublicProfilePageClient from './PublicProfilePageClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return {
    title: `@${username} | وایب`,
    description: `پروفایل عمومی @${username} در وایب`,
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const session = await auth();
  const currentUserId = session?.user?.id ?? null;

  return (
    <div className="min-h-screen bg-white pb-20">
      <Header title="" />
      <main className="min-h-screen">
        <PublicProfilePageClient
          username={username}
          currentUserId={currentUserId}
        />
      </main>
      <BottomNav />
    </div>
  );
}
