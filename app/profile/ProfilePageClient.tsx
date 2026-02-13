'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import ProfileHero2, { type ProfileUser } from '@/components/mobile/profile/ProfileHero2';
import ProfileTabs2 from '@/components/mobile/profile/ProfileTabs2';
import ProfileAchievementsSection from '@/components/mobile/profile/ProfileAchievementsSection';

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
    } catch (err: any) {
      setError(err.message || 'خطا در دریافت اطلاعات پروفایل');
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

  return (
    <div className="space-y-0">
      <ProfileHero2 user={user} onUpdate={fetchProfile} />
      <ProfileAchievementsSection />
      <Link
        href="/leaderboard"
        className="mx-4 mt-4 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-amber-200 bg-amber-50/80 text-amber-800 font-medium text-sm"
      >
        <Trophy className="w-5 h-5 text-amber-500" />
        رتبه‌بندی کریتورها
      </Link>
      <ProfileTabs2 userId={userId} />
    </div>
  );
}

