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
      <div className="flex items-center justify-between gap-3 rounded-xl bg-muted px-4! py-2!">
        <div className="flex min-w-0 items-center gap-3">
          {selectedAvatar ? (
            <VibeAvatarDisplay avatar={selectedAvatar} size={48} />
          ) : (
            <div className="size-12 rounded-full bg-secondary" />
          )}
          <div className="min-w-0 text-start">
            <p className="wibe-small font-medium text-foreground">آواتار تو</p>
            <p className="truncate wibe-caption text-muted-foreground">
              {selectedAvatar?.label ?? 'پیش‌فرض'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex min-h-11 shrink-0 items-center px-2! wibe-caption font-medium text-brand"
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
      className={`relative flex min-h-11 items-center justify-center rounded-surface border p-2 transition-colors ${
        selected
          ? 'border-brand bg-brand/5'
          : 'border-border bg-popover hover:border-brand/30 hover:bg-muted'
      }`}
    >
      <VibeAvatarDisplay avatar={avatar} size={48} selected={selected} />
      {selected && (
        <span className="absolute end-1 top-1 flex size-5 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-sm">
          <Check className="size-3" strokeWidth={3} />
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
