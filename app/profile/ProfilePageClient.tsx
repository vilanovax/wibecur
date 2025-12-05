'use client';

import { useState, useEffect } from 'react';
import ProfileHeader from '@/components/mobile/profile/ProfileHeader';
import ProfileTabs from '@/components/mobile/profile/ProfileTabs';

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  stats: {
    listsCreated: number;
    bookmarks: number;
    likes: number;
    itemLikes: number;
  };
}

interface ProfilePageClientProps {
  userId: string;
}

export default function ProfilePageClient({ userId }: ProfilePageClientProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();

      if (data.success) {
        setUser(data.data.user);
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
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-3xl p-6 animate-pulse">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-24 h-24 rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
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
      <div className="bg-red-50 text-red-600 p-6 rounded-xl text-center">
        <p>{error}</p>
        <button
          onClick={fetchProfile}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12 bg-white rounded-xl">
        <p className="text-gray-500">کاربر یافت نشد</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProfileHeader user={user} onUpdate={fetchProfile} />
      <ProfileTabs userId={userId} />
    </div>
  );
}

