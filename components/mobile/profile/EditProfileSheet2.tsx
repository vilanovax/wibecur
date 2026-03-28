'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [bio, setBio] = useState(user.bio && user.bio !== 'null' ? user.bio : '');
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
  const prevOpenRef = useRef(false);

  const initialBio = user.bio && user.bio !== 'null' ? user.bio : '';
  const hasChanges =
    displayName !== (user.name ?? '') ||
    username !== (user.username ?? '') ||
    bio !== initialBio ||
    showBadge !== (user.showBadge ?? true) ||
    allowCommentNotifications !== (user.allowCommentNotifications ?? true) ||
    avatarType !== (user.avatarType ?? 'DEFAULT') ||
    avatarId !== (user.avatarId ?? null);

  // فقط موقع باز شدن شیت از user پر کنیم تا انتخاب آواتار با رندر والد پاک نشود
  useEffect(() => {
    const justOpened = isOpen && !prevOpenRef.current;
    prevOpenRef.current = isOpen;
    if (justOpened) {
      setDisplayName(user.name ?? '');
      setUsername(user.username ?? '');
      setBio((user.bio && user.bio !== 'null' ? user.bio : '').slice(0, BIO_MAX));
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
          bio: (bio || '').slice(0, BIO_MAX) || null,
          showBadge,
          allowCommentNotifications,
          avatarType: avatarType || 'DEFAULT',
          avatarId: (avatarType === 'DEFAULT' && avatarId) ? String(avatarId) : null,
        }),
      });
      let data: { success?: boolean; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        setError('پاسخ سرور نامعتبر بود. دوباره تلاش کنید.');
        return;
      }
      if (!data.success) {
        setError(data.error || 'خطا در ذخیره');
        return;
      }
      onClose();
      onUpdate();
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('profile-updated'));
      setToast({ message: 'تغییرات با موفقیت ذخیره شد', type: 'success' });
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
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('profile-updated'));
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
            {/* 1. Avatar + Basic Info */}
            <section className="pt-4 pb-4">
              <div className="rounded-[20px] bg-white p-5 shadow-sm flex flex-col items-center">
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
                  className="mt-3 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  تغییر آواتار
                </button>

                {/* Basic Info inside same card */}
                <div className="w-full mt-5 pt-4 border-t border-gray-100 space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">نام نمایشی</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="نام شما"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] outline-none transition text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">نام کاربری</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                      placeholder="username"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] outline-none transition font-mono text-sm"
                    />
                    {username.startsWith('user_') && (
                      <p className="text-[11px] text-amber-600 mt-1">
                        یه نام کاربری شخصی انتخاب کن تا راحت‌تر پیدات کنن
                      </p>
                    )}
                  </div>
                  {isTrustedOrAbove && (
                    <p className="flex items-center gap-2 text-sm text-[#7C3AED]">
                      <Sparkles className="w-4 h-4" />
                      Trusted Curator 🟣
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* 3. Bio + Settings */}
            <section className="pb-4">
              <div className="rounded-[20px] bg-white p-5 shadow-sm space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">معرفی</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                    placeholder="چند خط درباره vibe خودت بنویس…"
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] outline-none transition resize-none text-sm"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    {bio.length}/{BIO_MAX} — در پروفایل عمومی نمایش داده می‌شود
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <div>
                      <span className="text-sm text-gray-700 block">نمایش نشان کیوریتور</span>
                      <span className="text-[11px] text-gray-400">نشان سطح شما کنار نامتون دیده بشه</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showBadge}
                      onChange={(e) => setShowBadge(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-[#7C3AED] focus:ring-[#7C3AED]"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <div>
                      <span className="text-sm text-gray-700 block">اعلان کامنت‌ها</span>
                      <span className="text-[11px] text-gray-400">وقتی روی لیست‌هات نظر میذارن</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowCommentNotifications}
                      onChange={(e) => setAllowCommentNotifications(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-[#7C3AED] focus:ring-[#7C3AED]"
                    />
                  </label>
                </div>
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
              disabled={isSaving || !hasChanges}
              className={`w-full py-3.5 rounded-[20px] font-medium flex items-center justify-center gap-2 transition-all ${
                hasChanges
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white shadow-lg'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
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
