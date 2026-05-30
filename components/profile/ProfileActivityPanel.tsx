'use client';

import ProfileRankCard from '@/components/profile/ProfileRankCard';
import ProfileLevel from '@/components/profile/ProfileLevel';
import ProfileAchievements from '@/components/profile/ProfileAchievements';
import RecentActivityTab from '@/components/mobile/profile/tabs/RecentActivityTab';
import type { CreatorStats, ProfileUser } from '@/components/profile/types';

import type { ProfileActivitySSR } from '@/lib/profile-ssr-types';

interface ProfileActivityPanelProps {
  userId: string;
  user: ProfileUser;
  creatorStats: CreatorStats;
  initialActivities?: ProfileActivitySSR[];
}

/** رتبه، سطح، دستاوردها + فید فعالیت — داخل تب فعالیت */
export default function ProfileActivityPanel({
  userId,
  user,
  creatorStats,
  initialActivities,
}: ProfileActivityPanelProps) {
  return (
    <div className="space-y-4 pb-4">
      <div className="px-4">
        <ProfileRankCard userId={userId} />
      </div>
      <div className="px-4">
        <ProfileLevel user={user} compact />
      </div>
      <div className="px-4">
        <ProfileAchievements creatorStats={creatorStats} className="mt-0" />
      </div>
      <section>
        <h2 className="wibe-h3 mb-3 px-4">فعالیت اخیر</h2>
        <RecentActivityTab
          userId={userId}
          embedded
          initialActivities={initialActivities}
        />
      </section>
    </div>
  );
}
