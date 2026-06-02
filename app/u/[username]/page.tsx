import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { auth } from '@/lib/auth-config';
import { fetchPublicProfile } from '@/lib/public-profile-server';
import PublicProfilePageClient from './PublicProfilePageClient';
import { notFound } from 'next/navigation';

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

  const profileData = await fetchPublicProfile(username, currentUserId);
  if (!profileData) notFound();

  const initialData = JSON.parse(JSON.stringify(profileData));

  return (
    <div className="bg-wibe-surface">
      <Header title={`@${username}`} showBack />
      <main className="min-h-screen">
        <PublicProfilePageClient
          username={username}
          currentUserId={currentUserId}
          initialData={initialData}
        />
      </main>
      <BottomNav />
    </div>
  );
}
