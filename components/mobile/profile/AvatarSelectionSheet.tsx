'use client';

import { useEffect, useRef, useState } from 'react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import VibeAvatarDisplay from '@/components/shared/VibeAvatarDisplay';
import {
  VIBE_AVATARS,
  getAvatarMinLevelLabel,
  isAvatarUnlocked,
  resolveVibeAvatar,
  type VibeAvatarOption,
} from '@/lib/vibe-avatars';
import type { CuratorLevelKey } from '@/lib/curator';
import { Check, ImagePlus, Loader2, Lock, Upload, X } from 'lucide-react';

interface AvatarSelectionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarId: string | null;
  currentAvatarType: 'DEFAULT' | 'UPLOADED';
  currentAvatarStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | null;
  currentImageUrl: string | null;
  userLevel: CuratorLevelKey;
  onSelectVibeAvatar: (avatarId: string) => void;
  onUploadPhoto: (file: File) => Promise<{ success: boolean; message?: string }>;
}

type AvatarTab = 'collection' | 'upload';

export default function AvatarSelectionSheet({
  isOpen,
  onClose,
  currentAvatarId,
  currentAvatarType,
  currentAvatarStatus,
  currentImageUrl,
  userLevel,
  onSelectVibeAvatar,
  onUploadPhoto,
}: AvatarSelectionSheetProps) {
  const [tab, setTab] = useState<AvatarTab>('collection');
  const [selectedId, setSelectedId] = useState<string | null>(currentAvatarId);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTab(currentAvatarType === 'UPLOADED' ? 'upload' : 'collection');
      setSelectedId(currentAvatarId);
      setUploadPreview(null);
      setUploadFile(null);
      setUploadError('');
    }
  }, [isOpen, currentAvatarId, currentAvatarType]);

  const currentVibe = resolveVibeAvatar(currentAvatarId);
  const previewAvatar =
    tab === 'collection' ? resolveVibeAvatar(selectedId) ?? currentVibe : null;

  const handlePickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      setUploadError('لطفاً یک فایل تصویری انتخاب کنید');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('حجم فایل باید کمتر از ۵ مگابایت باشد');
      return;
    }
    setUploadError('');
    setUploadFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setUploadPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleConfirmUpload = async () => {
    if (!uploadFile) return;
    setIsUploading(true);
    setUploadError('');
    try {
      const result = await onUploadPhoto(uploadFile);
      if (result.success) {
        onClose();
      } else {
        setUploadError(result.message || 'خطا در آپلود');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectVibe = (avatar: VibeAvatarOption) => {
    if (!isAvatarUnlocked(avatar, userLevel)) return;
    setSelectedId(avatar.id);
    onSelectVibeAvatar(avatar.id);
    onClose();
  };

  const unlockedCount = VIBE_AVATARS.filter((a) => isAvatarUnlocked(a, userLevel)).length;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="انتخاب آواتار"
      subtitle={tab === 'collection' ? `${unlockedCount} آواتار در دسترس` : 'عکس شخصی'}
      maxHeight="92vh"
      desktopMaxWidth="lg"
    >
      <div className="px-2.5 pb-2 lg:px-0" dir="rtl">
        {/* Preview */}
        <div className="mb-4 flex items-center gap-4 rounded-2xl border border-wibe/80 bg-gradient-to-br from-primary/[0.06] via-white to-white p-4">
          <div className="relative shrink-0">
            {tab === 'upload' && (uploadPreview || (currentAvatarType === 'UPLOADED' && currentImageUrl)) ? (
              <div className="h-[72px] w-[72px] overflow-hidden rounded-full ring-2 ring-white shadow-md">
                <img
                  src={uploadPreview ?? currentImageUrl ?? ''}
                  alt="پیش‌نمایش"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : previewAvatar ? (
              <VibeAvatarDisplay avatar={previewAvatar} size={72} />
            ) : (
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-wibe-surface text-wibe-secondary">
                <ImagePlus className="h-7 w-7" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 text-right">
            <p className="wibe-small font-semibold text-foreground">
              {tab === 'upload' ? 'عکس شخصی' : previewAvatar?.label ?? 'یک آواتار انتخاب کن'}
            </p>
            <p className="mt-0.5 wibe-caption leading-relaxed text-wibe-secondary">
              {tab === 'upload'
                ? 'پس از بررسی در پروفایل نمایش داده می‌شود'
                : 'از مجموعه وایب یا عکس خودت استفاده کن'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="mb-4 flex gap-1.5 rounded-2xl border border-wibe/80 bg-wibe-surface/80 p-1"
          role="tablist"
          aria-label="روش انتخاب آواتار"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'collection'}
            onClick={() => setTab('collection')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 wibe-caption font-semibold transition-colors ${
              tab === 'collection'
                ? 'bg-white text-primary shadow-sm ring-1 ring-primary/10'
                : 'text-wibe-secondary hover:text-foreground'
            }`}
          >
            <SparklesTabIcon />
            مجموعه وایب
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'upload'}
            onClick={() => setTab('upload')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 wibe-caption font-semibold transition-colors ${
              tab === 'upload'
                ? 'bg-white text-primary shadow-sm ring-1 ring-primary/10'
                : 'text-wibe-secondary hover:text-foreground'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            آپلود عکس
          </button>
        </div>

        {tab === 'collection' ? (
          <div className="max-h-[min(52vh,420px)] overflow-y-auto overscroll-contain pe-0.5">
            <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
            {VIBE_AVATARS.map((avatar) => {
              const unlocked = isAvatarUnlocked(avatar, userLevel);
              const selected =
                currentAvatarType === 'DEFAULT' &&
                resolveVibeAvatar(currentAvatarId)?.id === avatar.id;
              const isActive = selectedId === avatar.id;

              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => handleSelectVibe(avatar)}
                  disabled={!unlocked}
                  aria-label={avatar.label}
                  className={`group relative flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 transition-colors ${
                    isActive || selected
                      ? 'border-primary/40 bg-primary/5 shadow-sm'
                      : 'border-transparent hover:border-wibe hover:bg-wibe-surface/70'
                  } ${!unlocked ? 'cursor-not-allowed' : 'active:scale-[0.97]'}`}
                >
                  <VibeAvatarDisplay
                    avatar={avatar}
                    size={52}
                    selected={isActive || selected}
                    locked={!unlocked}
                  />
                  <span className="max-w-full truncate text-center wibe-caption font-medium text-foreground">
                    {avatar.label}
                  </span>
                  {!unlocked && avatar.minLevel && (
                    <span className="flex items-center gap-0.5 wibe-caption text-wibe-secondary">
                      <Lock className="h-3 w-3" />
                      {getAvatarMinLevelLabel(avatar.minLevel)}
                    </span>
                  )}
                  {(isActive || selected) && unlocked && (
                    <span className="absolute end-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePickFile}
            />

            {!uploadPreview ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-wibe bg-wibe-surface/40 px-4 py-10 transition-colors hover:border-primary/35 hover:bg-primary/[0.03]"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Upload className="h-6 w-6" />
                </span>
                <span className="wibe-small font-semibold text-foreground">انتخاب تصویر</span>
                <span className="wibe-caption text-wibe-secondary">JPG یا PNG · حداکثر ۵ مگابایت</span>
              </button>
            ) : (
              <>
                <div className="relative mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-2xl border border-wibe bg-wibe-surface shadow-sm">
                  <img src={uploadPreview} alt="پیش‌نمایش" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setUploadPreview(null);
                      setUploadFile(null);
                    }}
                    className="absolute start-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
                    aria-label="حذف پیش‌نمایش"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-center wibe-caption leading-relaxed text-amber-800">
                  عکس شما پس از بررسی در پروفایل فعال می‌شود.
                </p>
                {uploadError && (
                  <p className="text-center wibe-caption text-red-600">{uploadError}</p>
                )}
                <div className="flex gap-2" dir="rtl">
                  <button
                    type="button"
                    onClick={handleConfirmUpload}
                    disabled={isUploading}
                    className="flex h-11 flex-[1.4] items-center justify-center gap-2 rounded-xl bg-primary wibe-small font-semibold text-white shadow-sm disabled:opacity-50"
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    آپلود و ارسال
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-11 flex-1 rounded-xl border border-wibe bg-white wibe-small font-semibold text-foreground"
                  >
                    تغییر تصویر
                  </button>
                </div>
              </>
            )}

            {currentAvatarType === 'UPLOADED' && currentAvatarStatus && !uploadPreview && (
              <div className="text-center">
                {currentAvatarStatus === 'PENDING' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 wibe-caption font-medium text-amber-800">
                    در انتظار بررسی
                  </span>
                )}
                {currentAvatarStatus === 'REJECTED' && (
                  <p className="wibe-caption leading-relaxed text-wibe-secondary">
                    عکس قبلی تأیید نشد. می‌توانید عکس دیگری آپلود کنید.
                  </p>
                )}
                {currentAvatarStatus === 'APPROVED' && currentImageUrl && (
                  <div className="mx-auto mt-2 h-[88px] w-[88px] overflow-hidden rounded-full ring-2 ring-wibe">
                    <img src={currentImageUrl} alt="آواتار فعلی" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            )}

            {uploadError && !uploadPreview && (
              <p className="text-center wibe-caption text-red-600">{uploadError}</p>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

function SparklesTabIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
      <path
        d="M12 3l1.4 4.3L18 8.6l-4.6 1.3L12 14.2 10.6 9.9 6 8.6l4.6-1.3L12 3z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M18 14l.8 2.4 2.4.8-2.4.8L18 20l-.8-2.4-2.4-.8 2.4-.8L18 14z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}
