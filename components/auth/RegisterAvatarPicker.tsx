'use client';

import { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import VibeAvatarDisplay from '@/components/shared/VibeAvatarDisplay';
import { DEFAULT_PACK_AVATARS, resolveVibeAvatar, type VibeAvatarOption } from '@/lib/vibe-avatars';

interface RegisterAvatarPickerProps {
  value: string;
  onChange: (avatarId: string) => void;
}

export default function RegisterAvatarPicker({ value, onChange }: RegisterAvatarPickerProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const selectedAvatar = useMemo(() => resolveVibeAvatar(value), [value]);

  const handleSelect = (avatarId: string) => {
    onChange(avatarId);
    setSheetOpen(false);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3.5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {selectedAvatar ? (
            <VibeAvatarDisplay avatar={selectedAvatar} size={52} />
          ) : (
            <div className="h-[52px] w-[52px] rounded-full bg-gray-200" />
          )}
          <div className="min-w-0 text-right">
            <p className="text-sm font-medium text-foreground">آواتار تو</p>
            <p className="mt-0.5 truncate text-xs text-wibe-secondary">
              {selectedAvatar?.label ?? 'پیش‌فرض'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="shrink-0 text-xs font-medium text-primary transition-colors hover:text-primary-dark"
        >
          تغییر آواتار
        </button>
      </div>

      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="انتخاب آواتار"
        subtitle="یکی انتخاب کن"
        desktopMaxWidth="sm"
        constrainToMobileShell={false}
      >
        <div className="grid grid-cols-4 gap-2 px-1 pb-2">
          {DEFAULT_PACK_AVATARS.map((avatar) => (
            <AvatarChip
              key={avatar.id}
              avatar={avatar}
              selected={value === avatar.id}
              onSelect={() => handleSelect(avatar.id)}
            />
          ))}
        </div>
      </BottomSheet>
    </>
  );
}

function AvatarChip({
  avatar,
  selected,
  onSelect,
}: {
  avatar: VibeAvatarOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={avatar.label}
      className={`relative flex items-center justify-center rounded-2xl border-2 p-2 transition-all active:scale-95 ${
        selected
          ? 'border-primary bg-primary/5 shadow-[0_0_0_2px_rgba(99,102,241,0.15)]'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <VibeAvatarDisplay avatar={avatar} size={48} selected={selected} />
      {selected && (
        <span className="absolute end-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-md">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

export function getDefaultRegisterAvatarId(): string {
  return DEFAULT_PACK_AVATARS.find((a) => a.id === 'vibe')?.id ?? DEFAULT_PACK_AVATARS[0]!.id;
}

export function getRegisterAvatarById(id: string): VibeAvatarOption | undefined {
  return resolveVibeAvatar(id);
}
