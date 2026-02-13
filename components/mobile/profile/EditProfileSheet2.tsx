'use client';

import { useState, useEffect } from 'react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import Toast from '@/components/shared/Toast';
import AvatarSelectionSheet from './AvatarSelectionSheet';
import { Loader2, Sparkles } from 'lucide-react';
import { VIBE_AVATARS, isUserEliteLevel } from '@/lib/vibe-avatars';
import type { CuratorLevelKey } from '@/lib/curator';
import { getLevelConfig } from '@/lib/curator';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import EliteAvatarFrame from '@/components/shared/EliteAvatarFrame';

export interface EditProfileUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  username?: string | null;
  bio?: string | null;
  avatarType?: 'DEFAULT' | 'UPLOADED';
  avatarId?: string | null;
  avatarStatus?: 'APPROVED' | 'PENDING' | 'REJECTED' | null;
  showBadge?: boolean;
  allowCommentNotifications?: boolean;
  curatorLevel?: string;
}

interface EditProfileSheet2Props {
  isOpen: boolean;
  onClose: () => void;
  user: EditProfileUser;
  userLevel: CuratorLevelKey;
  onUpdate: () => void;
}

const BIO_MAX = 160;

export default function EditProfileSheet2({
  isOpen,
  onClose,
  user,
  userLevel,
  onUpdate,
}: EditProfileSheet2Props) {
  const [displayName, setDisplayName] = useState(user.name ?? '');
  const [username, setUsername] = useState(user.username ?? '');
  const [bio, setBio] = useState(user.bio ?? '');
  const [showBadge, setShowBadge] = useState(user.showBadge ?? true);
  const [allowCommentNotifications, setAllowCommentNotifications] = useState(
    user.allowCommentNotifications ?? true
  );
  const [avatarType, setAvatarType] = useState<'DEFAULT' | 'UPLOADED'>(user.avatarType ?? 'DEFAULT');
  const [avatarId, setAvatarId] = useState<string | null>(user.avatarId ?? null);
  const [avatarStatus, setAvatarStatus] = useState<'APPROVED' | 'PENDING' | 'REJECTED' | null>(
    user.avatarStatus ?? null
  );
  const [imageUrl, setImageUrl] = useState<string | null>(user.image ?? null);

  const [showAvatarSheet, setShowAvatarSheet] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDisplayName(user.name ?? '');
      setUsername(user.username ?? '');
      setBio((user.bio ?? '').slice(0, BIO_MAX));
      setShowBadge(user.showBadge ?? true);
      setAllowCommentNotifications(user.allowCommentNotifications ?? true);
      setAvatarType(user.avatarType ?? 'DEFAULT');
      setAvatarId(user.avatarId ?? null);
      setAvatarStatus(user.avatarStatus ?? null);
      setImageUrl(user.image ?? null);
      setError('');
    }
  }, [isOpen, user]);

  const handleSave = async () => {
    setError('');
    if (!displayName.trim()) {
      setError('نام نمایشی الزامی است');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: displayName.trim(),
          username: username.trim() || undefined,
          bio: bio.slice(0, BIO_MAX) || null,
          showBadge,
          allowCommentNotifications,
          ...(avatarType === 'DEFAULT' && avatarId ? { avatarType: 'DEFAULT', avatarId } : {}),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'خطا در ذخیره');
      onUpdate();
      setToast({ message: 'پروفایل با موفقیت به‌روزرسانی شد 🎉', type: 'success' });
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ذخیره');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectVibeAvatar = (id: string) => {
    setAvatarType('DEFAULT');
    setAvatarId(id);
    setAvatarStatus(null);
    setShowAvatarSheet(false);
  };

  const handleUploadPhoto = async (file: File): Promise<{ success: boolean; message?: string }> => {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    try {
      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: base64 }),
      });
      const data = await res.json();
      if (!data.success) return { success: false, message: data.error };
      setAvatarType('UPLOADED');
      setAvatarStatus('PENDING');
      setImageUrl(data.data?.user?.image ?? null);
      onUpdate();
      return { success: true };
    } catch {
      return { success: false, message: 'خطا در آپلود' };
    }
  };

  const currentVibeAvatar = VIBE_AVATARS.find((a) => a.id === avatarId);
  const levelKey = (user.curatorLevel ?? 'EXPLORER') as CuratorLevelKey;
  const levelConfig = getLevelConfig(levelKey);
  const isElite = isUserEliteLevel(levelKey);
  const isTrustedOrAbove =
    ['TRUSTED_CURATOR', 'INFLUENTIAL_CURATOR', 'ELITE_CURATOR', 'VIBE_LEGEND'].indexOf(levelKey) >= 0;

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="ویرایش پروفایل"
        maxHeight="90vh"
      >
        <div className="flex flex-col min-h-0 flex-1 bg-[#F8F7FC]">
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4">
            {/* 1. Avatar */}
            <section className="pt-4 pb-6">
              <div className="rounded-[20px] bg-white p-6 shadow-sm flex flex-col items-center">
                {isElite ? (
                  <EliteAvatarFrame size={96} className="mb-2">
                    <div className="relative">
                      <div
                        className={`absolute -inset-1.5 rounded-full blur-md ${levelConfig.glowClass} opacity-60`}
                      />
                      <div className="relative w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-white shadow-lg">
                        {avatarType === 'DEFAULT' && currentVibeAvatar ? (
                          <div
                            className={`w-full h-full flex items-center justify-center text-4xl ${currentVibeAvatar.bgClass}`}
                          >
                            {currentVibeAvatar.emoji}
                          </div>
                        ) : imageUrl ? (
                          <ImageWithFallback
                            src={imageUrl}
                            alt="آواتار"
                            className="w-full h-full object-cover"
                            fallbackIcon={(displayName?.[0] || '?').toUpperCase()}
                            fallbackClassName="w-full h-full bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white text-2xl font-bold flex items-center justify-center"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white text-2xl font-bold">
                            {(displayName?.[0] || user.email?.[0] || '?').toUpperCase()}
                          </div>
                        )}
                      </div>
                      {avatarType === 'UPLOADED' && avatarStatus === 'PENDING' && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                          در انتظار بررسی
                        </span>
                      )}
                    </div>
                  </EliteAvatarFrame>
                ) : (
                <div className="relative">
                  <div
                    className={`absolute -inset-1.5 rounded-full blur-md ${levelConfig.glowClass} opacity-60`}
                  />
                  <div className="relative w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-white shadow-lg">
                    {avatarType === 'DEFAULT' && currentVibeAvatar ? (
                      <div
                        className={`w-full h-full flex items-center justify-center text-4xl ${currentVibeAvatar.bgClass}`}
                      >
                        {currentVibeAvatar.emoji}
                      </div>
                    ) : imageUrl ? (
                      <ImageWithFallback
                        src={imageUrl}
                        alt="آواتار"
                        className="w-full h-full object-cover"
                        fallbackIcon={(displayName?.[0] || '?').toUpperCase()}
                        fallbackClassName="w-full h-full bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white text-2xl font-bold flex items-center justify-center"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#7C3AED] to-[#9333EA] text-white text-2xl font-bold">
                        {(displayName?.[0] || user.email?.[0] || '?').toUpperCase()}
                      </div>
                    )}
                  </div>
                  {avatarType === 'UPLOADED' && avatarStatus === 'PENDING' && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                      در انتظار بررسی
                    </span>
                  )}
                </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowAvatarSheet(true)}
                  className="mt-4 px-5 py-2.5 rounded-[20px] bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white text-sm font-medium shadow-md hover:shadow-lg transition-all"
                >
                  تغییر آواتار
                </button>
              </div>
            </section>

            {/* 2. Basic Info */}
            <section className="pb-6">
              <div className="rounded-[20px] bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">اطلاعات پایه</h3>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">نام نمایشی (اجباری)</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="نام شما"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">نام کاربری (یونیک، انگلیسی)</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    placeholder="username"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] outline-none transition font-mono text-sm"
                  />
                </div>
                {isTrustedOrAbove && (
                  <p className="flex items-center gap-2 text-sm text-[#7C3AED]">
                    <Sparkles className="w-4 h-4" />
                    Trusted Curator 🟣
                  </p>
                )}
              </div>
            </section>

            {/* 3. Bio */}
            <section className="pb-6">
              <div className="rounded-[20px] bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">بیو</h3>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                  placeholder="چند خط درباره vibe خودت بنویس…"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] outline-none transition resize-none"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  {bio.length}/{BIO_MAX} — این متن در پروفایل عمومی شما نمایش داده می‌شود
                </p>
              </div>
            </section>

            {/* 4. Privacy */}
            <section className="pb-6">
              <div className="rounded-[20px] bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">حریم خصوصی</h3>
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-sm text-gray-700">نمایش Badge</span>
                  <input
                    type="checkbox"
                    checked={showBadge}
                    onChange={(e) => setShowBadge(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                </label>
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-sm text-gray-700">دریافت اعلان کامنت</span>
                  <input
                    type="checkbox"
                    checked={allowCommentNotifications}
                    onChange={(e) => setAllowCommentNotifications(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                </label>
              </div>
            </section>

            {error && (
              <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>
            )}
          </div>

          {/* 5. Fixed Save Button */}
          <div className="flex-shrink-0 p-4 pt-3 bg-[#F8F7FC] border-t border-gray-200/80">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-3.5 rounded-[20px] bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white font-medium shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  در حال ذخیره...
                </>
              ) : (
                'ذخیره تغییرات'
              )}
            </button>
          </div>
        </div>
      </BottomSheet>

      <AvatarSelectionSheet
        isOpen={showAvatarSheet}
        onClose={() => setShowAvatarSheet(false)}
        currentAvatarId={avatarId}
        currentAvatarType={avatarType}
        currentAvatarStatus={avatarStatus}
        currentImageUrl={imageUrl}
        userLevel={userLevel}
        onSelectVibeAvatar={handleSelectVibeAvatar}
        onUploadPhoto={handleUploadPhoto}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
