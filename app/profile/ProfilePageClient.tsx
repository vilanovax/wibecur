'use client';

import { useState, useEffect } from 'react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileStats from '@/components/profile/ProfileStats';
import ProfileRankCard from '@/components/profile/ProfileRankCard';
import ProfileTopLists from '@/components/profile/ProfileTopLists';
import ProfileLevel from '@/components/profile/ProfileLevel';
import ProfileAchievements from '@/components/profile/ProfileAchievements';
import ProfileTabs from '@/components/profile/ProfileTabs';
import type { ProfileUser } from '@/components/profile/types';

interface ProfilePageClientProps {
  userId: string;
}

export default function ProfilePageClient({ userId }: ProfilePageClientProps) {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();

      if (data.success) {
        setUser(data.data.user as ProfileUser);
      } else {
        setError(data.error || 'خطا در دریافت اطلاعات پروفایل');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات پروفایل');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-200/60 p-6 animate-pulse">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gray-200" />
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200/60 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-2xl text-center">
        <p className="text-sm">{error}</p>
        <button
          onClick={fetchProfile}
          className="mt-4 px-5 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-200/60">
        <p className="text-gray-500 text-sm">کاربر یافت نشد</p>
      </div>
    );
  }

  const creatorStats = user.creatorStats ?? {
    viralListsCount: 0,
    popularListsCount: 0,
    totalLikesReceived: 0,
    profileViews: 0,
    totalItemsCurated: 0,
  };

  return (
    <div className="space-y-0">
      <ProfileHeader user={user} isOwner onUpdate={fetchProfile} />

      <div className="px-4 -mt-2 relative z-20">
        <div className="bg-white rounded-t-2xl shadow-sm border border-gray-100/80 border-b-0 pt-5 pb-4 px-4">
          <ProfileStats creatorStats={creatorStats} />

          <div className="mt-4">
            <ProfileRankCard userId={userId} />
          </div>

          <ProfileTopLists userId={userId} />

          <div className="mt-6">
            <ProfileLevel user={user} />
          </div>
        </div>
      </div>

      <div className="px-4">
        <ProfileAchievements creatorStats={creatorStats} />
      </div>

      <div className="px-4">
        <ProfileTabs userId={userId} />
      </div>
    </div>
  );
}
