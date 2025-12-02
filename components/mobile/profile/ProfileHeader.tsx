'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Edit2, Camera, LogOut } from 'lucide-react';
import EditProfileForm from './EditProfileForm';
import AvatarUploadForm from './AvatarUploadForm';

interface ProfileHeaderProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    stats: {
      listsCreated: number;
      bookmarks: number;
      likes: number;
      itemVotes: number;
    };
  };
  onUpdate: () => void;
}

export default function ProfileHeader({ user, onUpdate }: ProfileHeaderProps) {
  const router = useRouter();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAvatarForm, setShowAvatarForm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <>
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-3xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden ring-4 ring-white shadow-lg">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || user.email}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark text-white text-2xl font-bold">
                  {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowAvatarForm(true)}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="تغییر آواتار"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {user.name || 'کاربر بدون نام'}
            </h1>
            <p className="text-gray-600 text-sm mb-3">{user.email}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowEditForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-primary rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
              >
                <Edit2 className="w-4 h-4" />
                ویرایش پروفایل
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium shadow-sm disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                {isLoggingOut ? 'در حال خروج...' : 'خروج'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {user.stats.listsCreated}
            </div>
            <div className="text-xs text-gray-600 mt-1">لیست</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {user.stats.bookmarks}
            </div>
            <div className="text-xs text-gray-600 mt-1">ذخیره</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {user.stats.likes}
            </div>
            <div className="text-xs text-gray-600 mt-1">لایک</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {user.stats.itemVotes}
            </div>
            <div className="text-xs text-gray-600 mt-1">رأی</div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <EditProfileForm
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        user={user}
        onUpdate={onUpdate}
      />

      {/* Avatar Upload Form */}
      <AvatarUploadForm
        isOpen={showAvatarForm}
        onClose={() => setShowAvatarForm(false)}
        currentAvatar={user.image}
        onUpdate={onUpdate}
      />
    </>
  );
}

