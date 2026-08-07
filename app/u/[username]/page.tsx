import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { auth } from '@/lib/auth-config';
import {
  getCachedPublicProfileBase,
  resolveIsFollowing,
  serializePublicProfile,
} from '@/lib/public-profile-server';
import { buildPublicProfileJsonLd } from '@/lib/profile-schema';
import { serializeJsonLd } from '@/lib/json-ld';
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

  // auth + public profile in parallel (async-defer-await / async-parallel)
  const [session, profileData] = await Promise.all([
    auth(),
    getCachedPublicProfileBase(username),
  ]);

  if (!profileData) notFound();

  const currentUserId = session?.user?.id ?? null;
  if (currentUserId && currentUserId !== profileData.user.id) {
    profileData.isFollowing = await resolveIsFollowing(currentUserId, profileData.user.id);
  }

  const initialData = serializePublicProfile(profileData);
  const profileJsonLd = buildPublicProfileJsonLd({
    username: profileData.user.username,
    name: profileData.user.name,
    bio: profileData.user.bio,
    image: profileData.user.image,
  });

  return (
    <div className="bg-wibe-surface">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(profileJsonLd) }}
      />
      <Header title={`@${username}`} showBack />
      <main className="min-h-screen">
        <PublicProfilePageClient
          username={username}
          currentUserId={currentUserId}
          initialData={
            initialData as unknown as NonNullable<
              React.ComponentProps<typeof PublicProfilePageClient>['initialData']
            >
          }
        />
      </main>
      <BottomNav />
    </div>
  );
}
