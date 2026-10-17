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
import { Check, ImagePlus, Loader2, Lock, Sparkles, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      subtitle={tab === 'collection' ? `${unlockedCount.toLocaleString('fa-IR')} آواتار در دسترس` : 'عکس شخصی'}
      maxHeight="92vh"
      desktopMaxWidth="lg"
    >
      <div className="px-2.5 pb-2 lg:px-0" dir="rtl">
        {/* Preview */}
        <div className="mb-4 flex items-center gap-4 rounded-surface border border-border bg-muted/40 p-4">
          <div className="relative shrink-0">
            {tab === 'upload' && (uploadPreview || (currentAvatarType === 'UPLOADED' && currentImageUrl)) ? (
              <div className="size-20 overflow-hidden rounded-full ring-2 ring-popover shadow-md">
                <img
                  src={uploadPreview ?? currentImageUrl ?? ''}
                  alt="پیش‌نمایش"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : previewAvatar ? (
              <VibeAvatarDisplay avatar={previewAvatar} size={72} />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <ImagePlus className="h-7 w-7" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 text-start">
            <p className="wibe-small font-semibold text-foreground">
              {tab === 'upload' ? 'عکس شخصی' : previewAvatar?.label ?? 'یک آواتار انتخاب کن'}
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
              {tab === 'upload'
                ? 'پس از بررسی در پروفایل نمایش داده می‌شود'
                : 'از مجموعه وایب یا عکس خودت استفاده کن'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="mb-4 flex gap-1.5 rounded-surface border border-border bg-muted p-1"
          role="tablist"
          aria-label="روش انتخاب آواتار"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'collection'}
            onClick={() => setTab('collection')}
            className={`flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors ${
              tab === 'collection'
                ? 'bg-popover text-brand shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles aria-hidden />
            مجموعه وایب
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'upload'}
            onClick={() => setTab('upload')}
            className={`flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors ${
              tab === 'upload'
                ? 'bg-popover text-brand shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
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
                  className={`group relative flex min-h-11 flex-col items-center gap-1.5 rounded-surface border p-2.5 transition-colors ${
                    isActive || selected
                      ? 'border-brand/40 bg-brand/5 shadow-sm'
                      : 'border-transparent hover:border-border hover:bg-muted'
                  } ${!unlocked ? 'cursor-not-allowed' : ''}`}
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
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Lock className="h-3 w-3" />
                      {getAvatarMinLevelLabel(avatar.minLevel)}
                    </span>
                  )}
                  {(isActive || selected) && unlocked && (
                    <span className="absolute end-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-sm">
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
                className="flex min-h-12 w-full flex-col items-center gap-3 rounded-surface border border-dashed border-border bg-muted/40 px-4 py-8 transition-colors hover:border-brand"
              >
                <span className="flex size-14 items-center justify-center rounded-surface bg-brand/10 text-brand">
                  <Upload className="h-6 w-6" />
                </span>
                <span className="wibe-small font-semibold text-foreground">انتخاب تصویر</span>
                <span className="text-sm text-muted-foreground">JPG یا PNG · حداکثر ۵ مگابایت</span>
              </button>
            ) : (
              <>
                <div className="relative mx-auto aspect-square w-full max-w-56 overflow-hidden rounded-surface border border-border bg-muted shadow-sm">
                  <img src={uploadPreview} alt="پیش‌نمایش" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setUploadPreview(null);
                      setUploadFile(null);
                    }}
                    className="absolute start-2 top-2 flex size-11 items-center justify-center rounded-full bg-foreground/50 text-white backdrop-blur-sm"
                    aria-label="حذف پیش‌نمایش"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="rounded-surface border border-warning/30 bg-warning/10 px-3 py-2.5 text-center text-sm leading-relaxed text-foreground">
                  عکس شما پس از بررسی در پروفایل فعال می‌شود.
                </p>
                {uploadError && (
                  <p className="text-center text-sm text-destructive">{uploadError}</p>
                )}
                <div className="flex gap-2" dir="rtl">
                  <Button type="button" variant="brand" size="lg" className="flex-[1.4]" onClick={handleConfirmUpload} disabled={isUploading}>
                    {isUploading ? <Loader2 className="animate-spin" /> : null}
                    آپلود و ارسال
                  </Button>
                  <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => fileInputRef.current?.click()}>
                    تغییر تصویر
                  </Button>
                </div>
              </>
            )}

            {currentAvatarType === 'UPLOADED' && currentAvatarStatus && !uploadPreview && (
              <div className="text-center">
                {currentAvatarStatus === 'PENDING' && (
                  <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-warning/15 px-3 text-sm font-medium text-foreground">
                    در انتظار بررسی
                  </span>
                )}
                {currentAvatarStatus === 'REJECTED' && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    عکس قبلی تأیید نشد. می‌توانید عکس دیگری آپلود کنید.
                  </p>
                )}
                {currentAvatarStatus === 'APPROVED' && currentImageUrl && (
                  <div className="mx-auto mt-2 size-20 overflow-hidden rounded-full ring-2 ring-border">
                    <img src={currentImageUrl} alt="آواتار فعلی" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            )}

            {uploadError && !uploadPreview && (
              <p className="text-center text-sm text-destructive">{uploadError}</p>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
