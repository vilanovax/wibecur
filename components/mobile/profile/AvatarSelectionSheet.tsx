'use client';

import { useState, useRef } from 'react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import { Loader2, Upload, Check, Lock } from 'lucide-react';
import {
  DEFAULT_PACK_AVATARS,
  CURATOR_PACK_AVATARS,
  ELITE_PACK_AVATARS,
  isAvatarUnlocked,
  isPackUnlocked,
  getPackLockLabel,
  type VibeAvatarOption,
  type AvatarPackType,
} from '@/lib/vibe-avatars';
import type { CuratorLevelKey } from '@/lib/curator';

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

const PACK_TABS: { id: AvatarPackType; label: string; avatars: VibeAvatarOption[] }[] = [
  { id: 'default', label: 'پیش‌فرض', avatars: DEFAULT_PACK_AVATARS },
  { id: 'curator', label: 'کیوریتور', avatars: CURATOR_PACK_AVATARS },
  { id: 'elite', label: 'Elite', avatars: ELITE_PACK_AVATARS },
];

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
  const [tab, setTab] = useState<'default' | 'curator' | 'elite' | 'upload'>('default');
  const [selectedId, setSelectedId] = useState<string | null>(currentAvatarId);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const currentPackTab = PACK_TABS.find((t) => t.id === tab);
  const isVibeTab = tab !== 'upload';

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="انتخاب آواتار" maxHeight="90vh">
      <div className="px-6 pb-8 overflow-y-auto max-h-[70vh]">
        {/* Tabs: Default | Curator | Elite | Upload */}
        <div className="flex rounded-2xl bg-gray-100 p-1 mb-4 overflow-x-auto">
          {PACK_TABS.map((t) => {
            const packUnlocked = isPackUnlocked(t.id, userLevel);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex-shrink-0 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                  tab === t.id ? 'bg-white text-[#7C3AED] shadow-sm' : 'text-gray-600'
                } ${!packUnlocked ? 'opacity-70' : ''}`}
              >
                {t.label}
                {!packUnlocked && <Lock className="w-3.5 h-3.5" />}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`flex-shrink-0 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
              tab === 'upload' ? 'bg-white text-[#7C3AED] shadow-sm' : 'text-gray-600'
            }`}
          >
            <Upload className="w-4 h-4" />
            آپلود
          </button>
        </div>

        {/* Vibe packs grid */}
        {isVibeTab && currentPackTab && (() => {
          const packUnlocked = isPackUnlocked(currentPackTab.id, userLevel);
          return (
          <div className="relative">
            {!packUnlocked && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-gray-100/95 backdrop-blur-sm py-8 px-4">
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center mb-3">
                  <Lock className="w-6 h-6 text-gray-500" />
                </div>
                <p className="text-sm font-medium text-gray-700 text-center">
                  {currentPackTab.id === 'elite' ? 'Avatar Pack Elite' : 'پک کیوریتور'}
                </p>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  {getPackLockLabel(currentPackTab.id)} برای فعال شدن
                </p>
                {currentPackTab.id === 'elite' && (
                  <p className="text-xs text-amber-600 mt-2">رسیدن به ۸۰۰ امتیاز (سطح برتر)</p>
                )}
              </div>
            )}
            <div className={`grid grid-cols-3 gap-3 ${!packUnlocked ? 'blur-sm pointer-events-none select-none' : ''}`}>
              {currentPackTab.avatars.map((avatar) => {
                const unlocked = isAvatarUnlocked(avatar, userLevel);
                const selected = selectedId === avatar.id;
                const isElite = avatar.pack === 'elite' && avatar.eliteFrame;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => unlocked && handleSelectVibe(avatar)}
                    disabled={!unlocked}
                    className={`
                      relative flex flex-col items-center p-3 rounded-2xl border-2 transition-all
                      ${selected ? 'border-[#7C3AED] shadow-[0_0_0_2px_rgba(124,58,237,0.3)]' : 'border-transparent'}
                      ${unlocked ? 'hover:bg-gray-50 active:scale-95' : 'opacity-50 cursor-not-allowed'}
                      ${isElite && selected ? 'shadow-[0_0_12px_rgba(234,179,8,0.4)]' : ''}
                    `}
                  >
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${avatar.bgClass} ${isElite ? 'ring-2 ring-amber-400/50 shadow-lg' : ''}`}
                    >
                      {avatar.emoji}
                    </div>
                    <span className="text-xs text-gray-600 mt-1.5 line-clamp-1">{avatar.label}</span>
                    {selected && (
                      <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-[#7C3AED] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          );
        })()}

        {tab === 'upload' && (
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
                className="w-full py-12 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors flex flex-col items-center gap-2"
              >
                <Upload className="w-10 h-10" />
                <span>انتخاب تصویر</span>
              </button>
            ) : (
              <>
                <div className="relative aspect-square max-w-[200px] mx-auto rounded-2xl overflow-hidden bg-gray-100">
                  <img src={uploadPreview} alt="پیش‌نمایش" className="w-full h-full object-cover" />
                </div>
                <p className="text-center text-sm text-amber-700 bg-amber-50 rounded-xl py-2 px-3">
                  عکس شما پس از بررسی فعال می‌شود ✨
                </p>
                {uploadError && (
                  <p className="text-center text-sm text-red-600">{uploadError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium"
                  >
                    تغییر تصویر
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmUpload}
                    disabled={isUploading}
                    className="flex-1 py-2.5 rounded-xl bg-[#7C3AED] text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    آپلود و ارسال
                  </button>
                </div>
              </>
            )}
            {currentAvatarType === 'UPLOADED' && currentAvatarStatus && (
              <div className="pt-2">
                {currentAvatarStatus === 'PENDING' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                    در انتظار بررسی
                  </span>
                )}
                {currentAvatarStatus === 'REJECTED' && (
                  <p className="text-sm text-gray-600">
                    عکس قبلی تایید نشد. می‌توانید عکس دیگری آپلود کنید.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
