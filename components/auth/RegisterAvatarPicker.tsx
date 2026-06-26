'use client';

import { Check } from 'lucide-react';
import { DEFAULT_PACK_AVATARS, type VibeAvatarOption } from '@/lib/vibe-avatars';

interface RegisterAvatarPickerProps {
  value: string;
  onChange: (avatarId: string) => void;
}

export default function RegisterAvatarPicker({ value, onChange }: RegisterAvatarPickerProps) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-800">آواتار تو</p>
        <span className="text-xs text-gray-400">یکی انتخاب کن</span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory -mx-1 px-1">
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
      className={`relative flex shrink-0 snap-start flex-col items-center gap-1.5 rounded-2xl border-2 p-2.5 transition-all active:scale-95 ${
        selected
          ? 'border-primary bg-primary/5 shadow-[0_0_0_2px_rgba(99,102,241,0.15)]'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl ${avatar.bgClass}`}
      >
        {avatar.emoji}
      </div>
      <span className="max-w-[72px] truncate text-[11px] font-medium text-gray-600">
        {avatar.label}
      </span>
      {selected && (
        <span className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-md">
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
  return DEFAULT_PACK_AVATARS.find((a) => a.id === id);
}
