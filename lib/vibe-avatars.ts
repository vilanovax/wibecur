/**
 * مجموعه یکپارچه آواتار وایب — تصویرهای illustration + آپلود شخصی.
 * آواتارهای سطح‌دار با قفل سطح نمایش داده می‌شوند.
 */

export type CuratorLevelKey =
  | 'EXPLORER'
  | 'NEW_CURATOR'
  | 'ACTIVE_CURATOR'
  | 'TRUSTED_CURATOR'
  | 'INFLUENTIAL_CURATOR'
  | 'ELITE_CURATOR'
  | 'VIBE_LEGEND';

/** @deprecated */
export type AvatarPackType = 'default' | 'curator' | 'elite';

/** @deprecated — آواتارها دیگر Lucide icon نیستند */
export type VibeAvatarIcon = string;

const AVATAR_BASE = '/avatars/vibe';

const LEVEL_ORDER: CuratorLevelKey[] = [
  'EXPLORER',
  'NEW_CURATOR',
  'ACTIVE_CURATOR',
  'TRUSTED_CURATOR',
  'INFLUENTIAL_CURATOR',
  'ELITE_CURATOR',
  'VIBE_LEGEND',
];

export function getLevelIndex(level: CuratorLevelKey): number {
  const i = LEVEL_ORDER.indexOf(level);
  return i >= 0 ? i : 0;
}

const TRUSTED_IDX = getLevelIndex('TRUSTED_CURATOR');
const ELITE_IDX = getLevelIndex('ELITE_CURATOR');

export interface VibeAvatarOption {
  id: string;
  label: string;
  imageSrc: string;
  minLevel?: CuratorLevelKey;
  /** حلقه طلایی برای آواتارهای ویژه */
  premium?: boolean;
  /** @deprecated */
  icon?: VibeAvatarIcon;
  /** @deprecated */
  bgClass?: string;
  /** @deprecated */
  iconClass?: string;
  /** @deprecated */
  pack?: AvatarPackType;
  /** @deprecated */
  emoji?: string;
  /** @deprecated */
  eliteFrame?: boolean;
}

function avatar(id: string, label: string, file: string, opts?: Partial<VibeAvatarOption>): VibeAvatarOption {
  return {
    id,
    label,
    imageSrc: `${AVATAR_BASE}/${file}`,
    ...opts,
  };
}

const VIBE_COLLECTION: VibeAvatarOption[] = [
  avatar('vibe', 'وایب', 'vibe.webp'),
  avatar('char-02', 'پاندایی', 'char-02.webp'),
  avatar('char-03', 'جوانه', 'char-03.webp'),
  avatar('char-04', 'فضایی', 'char-04.webp'),
  avatar('char-05', 'گلدار', 'char-05.webp'),
  avatar('char-06', 'کوهستان', 'char-06.webp'),
  avatar('char-07', 'کلاه‌کش', 'char-07.webp'),
  avatar('char-08', 'هیولا', 'char-08.webp'),
  avatar('char-09', 'فضانورد', 'char-09.webp'),
  avatar('char-10', 'ربات', 'char-10.webp'),
  avatar('char-11', 'جادوگر', 'char-11.webp'),
  avatar('char-12', 'روباه', 'char-12.webp'),
  avatar('char-13', 'گربه', 'char-13.webp', { minLevel: 'TRUSTED_CURATOR', premium: true }),
  avatar('char-14', 'کلاسیک', 'char-14.webp', { minLevel: 'TRUSTED_CURATOR', premium: true }),
  avatar('char-15', 'شعله', 'char-15.webp', { minLevel: 'TRUSTED_CURATOR', premium: true }),
  avatar('char-16', 'زامبی', 'char-16.webp', { minLevel: 'TRUSTED_CURATOR', premium: true }),
  avatar('char-17', 'درخشان', 'char-17.webp', { minLevel: 'TRUSTED_CURATOR', premium: true }),
  avatar('char-18', 'آبی', 'char-18.webp', { minLevel: 'TRUSTED_CURATOR', premium: true }),
  avatar('char-19', 'نارنجی', 'char-19.webp', { minLevel: 'TRUSTED_CURATOR', premium: true }),
  avatar('char-20', 'بنفش', 'char-20.webp', { minLevel: 'TRUSTED_CURATOR', premium: true }),
  avatar('char-21', 'افسانه', 'char-21.webp', { minLevel: 'ELITE_CURATOR', premium: true }),
  avatar('char-22', 'طلایی', 'char-22.webp', { minLevel: 'ELITE_CURATOR', premium: true }),
  avatar('char-23', 'کهکشان', 'char-23.webp', { minLevel: 'ELITE_CURATOR', premium: true }),
  avatar('char-24', 'هنرمند', 'char-24.webp', { minLevel: 'ELITE_CURATOR', premium: true }),
  avatar('char-25', 'شجاع', 'char-25.webp', { minLevel: 'ELITE_CURATOR', premium: true }),
  avatar('char-26', 'پرنده', 'char-26.webp', { minLevel: 'ELITE_CURATOR', premium: true }),
  avatar('char-27', 'تاج', 'char-27.webp', { minLevel: 'VIBE_LEGEND', premium: true }),
  avatar('char-28', 'اسطوره', 'char-28.webp', { minLevel: 'VIBE_LEGEND', premium: true }),
];

/** نگاشت IDهای قدیمی به آواتار جدید */
const LEGACY_AVATAR_ID_MAP: Record<string, string> = {
  minimal: 'char-08',
  colorful: 'char-05',
  cinema: 'char-14',
  amethyst: 'char-14',
  book: 'char-03',
  forest: 'char-03',
  star: 'char-23',
  heart: 'char-05',
  rose: 'char-05',
  creator: 'char-11',
  lens: 'char-11',
  traveler: 'char-09',
  wanderer: 'char-09',
  fire: 'char-15',
  ember: 'char-15',
  ocean: 'char-04',
  citrus: 'char-19',
  midnight: 'char-08',
  horizon: 'char-06',
  aurora: 'char-17',
  crown: 'char-27',
  nebula: 'char-23',
  palette: 'char-24',
  legend: 'char-28',
  'film-frame': 'char-14',
  'open-book': 'char-03',
  compass: 'char-06',
  'elite-aura-purple-gold': 'char-17',
  'elite-aura-blue-magenta': 'char-23',
  'elite-aura-sunset': 'char-19',
  'elite-crown': 'char-27',
  'elite-film': 'char-14',
  'elite-book': 'char-03',
  'elite-compass': 'char-09',
  'elite-lifestyle': 'char-04',
};

export const VIBE_AVATARS: VibeAvatarOption[] = VIBE_COLLECTION;

/** آواتارهای رایگان برای ثبت‌نام */
export const DEFAULT_PACK_AVATARS = VIBE_COLLECTION.filter(
  (a) => !a.minLevel || a.minLevel === 'EXPLORER'
);

/** @deprecated */
export const CURATOR_PACK_AVATARS = VIBE_COLLECTION.filter(
  (a) => a.minLevel && getLevelIndex(a.minLevel) >= TRUSTED_IDX && getLevelIndex(a.minLevel) < ELITE_IDX
);

/** @deprecated */
export const ELITE_PACK_AVATARS = VIBE_COLLECTION.filter(
  (a) => a.minLevel && getLevelIndex(a.minLevel) >= ELITE_IDX
);

export const GUEST_HEADER_AVATAR =
  VIBE_COLLECTION.find((a) => a.id === 'vibe') ?? VIBE_COLLECTION[0]!;

export function resolveVibeAvatarId(id: string | null | undefined): string | null {
  if (!id || !String(id).trim()) return null;
  const raw = String(id).trim();
  return LEGACY_AVATAR_ID_MAP[raw] ?? raw;
}

export function resolveVibeAvatar(id: string | null | undefined): VibeAvatarOption | undefined {
  const resolved = resolveVibeAvatarId(id);
  if (!resolved) return undefined;
  return VIBE_AVATARS.find((a) => a.id === resolved);
}

export function getAvatarImageUrl(avatarId: string): string | null {
  const avatar = resolveVibeAvatar(avatarId);
  return avatar?.imageSrc ?? null;
}

export function isCuratorPackUnlocked(userLevel: CuratorLevelKey): boolean {
  return getLevelIndex(userLevel) >= TRUSTED_IDX;
}

export function isElitePackUnlocked(userLevel: CuratorLevelKey): boolean {
  return getLevelIndex(userLevel) >= ELITE_IDX;
}

/** @deprecated */
export function isPackUnlocked(_pack: AvatarPackType, _userLevel: CuratorLevelKey): boolean {
  return true;
}

/** @deprecated */
export function getPackLockLabel(_pack: AvatarPackType): string {
  return '';
}

export function isAvatarUnlocked(avatar: VibeAvatarOption, userLevel: CuratorLevelKey): boolean {
  if (!avatar.minLevel) return true;
  return getLevelIndex(userLevel) >= getLevelIndex(avatar.minLevel);
}

export function hasEliteFrame(avatarId: string): boolean {
  const a = resolveVibeAvatar(avatarId);
  return Boolean(a?.premium);
}

export function isUserEliteLevel(userLevel: CuratorLevelKey): boolean {
  return isElitePackUnlocked(userLevel);
}

export function getAvatarMinLevelLabel(minLevel: CuratorLevelKey): string {
  switch (minLevel) {
    case 'TRUSTED_CURATOR':
    case 'INFLUENTIAL_CURATOR':
      return 'سطح معتمد';
    case 'ELITE_CURATOR':
      return 'سطح برتر';
    case 'VIBE_LEGEND':
      return 'سطح افسانه';
    default:
      return 'سطح بالاتر';
  }
}
