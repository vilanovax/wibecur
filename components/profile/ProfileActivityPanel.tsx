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
    <div className="space-y-4 pb-4 lg:space-y-6 lg:pb-0">
      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:gap-4 lg:px-0">
        <ProfileRankCard userId={userId} />
        <ProfileLevel user={user} compact />
      </div>
      <div className="px-4 lg:px-0">
        <ProfileAchievements creatorStats={creatorStats} className="mt-0" />
      </div>
      <section className="lg:border-t lg:border-wibe lg:pt-5">
        <h2 className="wibe-h3 mb-3 px-4 lg:px-0">فعالیت اخیر</h2>
        <RecentActivityTab
          userId={userId}
          embedded
          initialActivities={initialActivities}
        />
      </section>
    </div>
  );
}
