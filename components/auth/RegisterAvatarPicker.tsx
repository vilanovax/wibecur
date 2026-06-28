'use client';

import { Check } from 'lucide-react';
import { DEFAULT_PACK_AVATARS, resolveVibeAvatar, type VibeAvatarOption } from '@/lib/vibe-avatars';
import VibeAvatarDisplay from '@/components/shared/VibeAvatarDisplay';

interface RegisterAvatarPickerProps {
  value: string;
  onChange: (avatarId: string) => void;
}

export default function RegisterAvatarPicker({ value, onChange }: RegisterAvatarPickerProps) {
  return (
    <div dir="rtl">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-800">آواتار تو</p>
        <span className="text-xs text-gray-400">یکی انتخاب کن</span>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
        {DEFAULT_PACK_AVATARS.map((avatar) => (
          <AvatarChip
            key={avatar.id}
            avatar={avatar}
            selected={value === avatar.id}
            onSelect={() => onChange(avatar.id)}
          />
        ))}
      </div>
    </div>
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
      className={`relative flex flex-col items-center gap-1.5 rounded-2xl border-2 p-2 transition-all active:scale-95 ${
        selected
          ? 'border-primary bg-primary/5 shadow-[0_0_0_2px_rgba(99,102,241,0.15)]'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <VibeAvatarDisplay avatar={avatar} size={48} selected={selected} />
      <span className="max-w-full truncate text-[11px] font-medium text-gray-600">{avatar.label}</span>
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
