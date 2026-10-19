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
      <div className="relative -mx-4 -mt-5 bg-gradient-to-br from-primary/10 via-primary/5 to-warning/10 pb-8">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/20 opacity-20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-primary/15 opacity-20 blur-3xl" />
        </div>

        <div className="relative z-10 px-4 pt-8">
          <div className="mb-6 flex justify-center">
            <div className="group relative">
              <div className="absolute -inset-1 animate-pulse rounded-full bg-gradient-to-r from-primary via-primary to-warning blur-sm" />
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-xl">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || user.email}
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary text-2xl font-bold text-white">
                    {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowAvatarForm(true)}
                className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                aria-label="تغییر آواتار"
              >
                <Camera className="h-4 w-4 text-primary" />
              </button>
            </div>
          </div>

          <div className="mb-6 text-center">
            <h1 className="mb-1 text-2xl font-bold text-foreground">
              {user.name || 'کاربر بدون نام'}
            </h1>
            <p className="text-sm text-wibe-secondary">{user.email}</p>
          </div>

          <div className="mb-8 flex justify-center gap-3">
            <button
              onClick={() => setShowEditForm(true)}
              className="flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 shadow-sm transition-colors hover:shadow-md"
            >
              <Edit2 className="h-4 w-4" />
              <span className="text-sm font-medium">ویرایش پروفایل</span>
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-xl bg-white p-2.5 text-red-500 shadow-sm transition-colors hover:bg-red-50 hover:shadow-md disabled:opacity-50"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
              <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <span className="text-2xl font-bold text-primary">
                  {user.stats.listsCreated}
                </span>
              </div>
              <p className="text-xs text-wibe-secondary">لیست</p>
            </div>

            <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
              <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <span className="text-2xl font-bold text-primary">
                  {user.stats.bookmarks}
                </span>
              </div>
              <p className="text-xs text-wibe-secondary">ذخیره</p>
            </div>

            <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
              <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-warning/15">
                <span className="text-2xl font-bold text-warning">
                  {user.stats.itemLikes ?? 0}
                </span>
              </div>
              <p className="text-xs text-wibe-secondary">لایک</p>
            </div>
          </div>
        </div>
      </div>

      <EditProfileForm
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        user={user}
        onUpdate={onUpdate}
      />

      <AvatarUploadForm
        isOpen={showAvatarForm}
        onClose={() => setShowAvatarForm(false)}
        currentAvatar={user.image}
        onUpdate={onUpdate}
      />
    </>
  );
}
