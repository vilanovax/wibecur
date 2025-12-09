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
      itemLikes: number;
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
      <div className="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pb-8 -mx-4 -mt-5">
        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-200 rounded-full opacity-20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-200 rounded-full opacity-20 blur-3xl" />
        </div>

        <div className="relative z-10 px-4 pt-8">
          {/* Avatar with animated ring */}
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-sm animate-pulse" />
              <div className="relative w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || user.email}
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-2xl font-bold">
                    {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowAvatarForm(true)}
                className="absolute bottom-1 right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="تغییر آواتار"
              >
                <Camera className="w-4 h-4 text-indigo-600" />
              </button>
            </div>
          </div>

          {/* Name & email */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-1 text-gray-900">
              {user.name || 'کاربر بدون نام'}
            </h1>
            <p className="text-gray-500 text-sm">{user.email}</p>
          </div>

          {/* Action buttons */}
          <div className="flex justify-center gap-3 mb-8">
            <button
              onClick={() => setShowEditForm(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              <Edit2 className="w-4 h-4" />
              <span className="text-sm font-medium">ویرایش پروفایل</span>
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="p-2.5 text-red-500 bg-white rounded-xl shadow-sm hover:shadow-md hover:bg-red-50 transition-all disabled:opacity-50"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 mb-2">
                <span className="text-2xl font-bold bg-gradient-to-br from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {user.stats.listsCreated}
                </span>
              </div>
              <p className="text-xs text-gray-500">لیست</p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 mb-2">
                <span className="text-2xl font-bold bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {user.stats.bookmarks}
                </span>
              </div>
              <p className="text-xs text-gray-500">ذخیره</p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 mb-2">
                <span className="text-2xl font-bold bg-gradient-to-br from-orange-600 to-red-600 bg-clip-text text-transparent">
                  {user.stats.itemLikes ?? 0}
                </span>
              </div>
              <p className="text-xs text-gray-500">لایک</p>
            </div>
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

