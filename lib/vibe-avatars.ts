/**
 * سیستم آواتار لایه‌ای وایب: Default → Curator → Elite
 * - default: همه کاربران
 * - curator: سطح ۳+ (Trusted Curator)
 * - elite: سطح ۵+ (Elite Curator)
 */

export type CuratorLevelKey =
  | 'EXPLORER'
  | 'NEW_CURATOR'
  | 'ACTIVE_CURATOR'
  | 'TRUSTED_CURATOR'
  | 'INFLUENTIAL_CURATOR'
  | 'ELITE_CURATOR'
  | 'VIBE_LEGEND';

export type AvatarPackType = 'default' | 'curator' | 'elite';

const LEVEL_ORDER: CuratorLevelKey[] = [
  'EXPLORER',
  'NEW_CURATOR',
  'ACTIVE_CURATOR',
  'TRUSTED_CURATOR',
  'INFLUENTIAL_CURATOR',
  'ELITE_CURATOR',
  'VIBE_LEGEND',
];

/** سطح لازم برای باز شدن پک Curator = index 3 (Trusted) */
const CURATOR_PACK_MIN_LEVEL: CuratorLevelKey = 'TRUSTED_CURATOR';
/** سطح لازم برای باز شدن پک Elite = index 5 (Elite) */
const ELITE_PACK_MIN_LEVEL: CuratorLevelKey = 'ELITE_CURATOR';

export interface VibeAvatarOption {
  id: string;
  label: string;
  emoji: string;
  bgClass: string;
  minLevel?: CuratorLevelKey;
  pack: AvatarPackType;
  /** فقط برای Elite: حلقه گرادیان و glow */
  eliteFrame?: boolean;
}

// ─── Default Pack (همه) ─────────────────────────────────────────────────
const DEFAULT_AVATARS: VibeAvatarOption[] = [
  { id: 'minimal', label: 'مینیمال', emoji: '○', bgClass: 'bg-gray-100', pack: 'default', minLevel: 'EXPLORER' },
  { id: 'colorful', label: 'رنگی', emoji: '🌈', bgClass: 'bg-gradient-to-br from-pink-200 to-purple-200', pack: 'default', minLevel: 'EXPLORER' },
  { id: 'cinema', label: 'سینمایی', emoji: '🎬', bgClass: 'bg-gradient-to-br from-slate-200 to-slate-300', pack: 'default', minLevel: 'EXPLORER' },
  { id: 'book', label: 'کتاب‌دوست', emoji: '📚', bgClass: 'bg-gradient-to-br from-amber-100 to-orange-100', pack: 'default', minLevel: 'EXPLORER' },
  { id: 'vibe', label: 'Vibe', emoji: '💜', bgClass: 'bg-gradient-to-br from-[#7C3AED]/20 to-[#9333EA]/20', pack: 'default', minLevel: 'EXPLORER' },
  { id: 'star', label: 'ستاره', emoji: '⭐', bgClass: 'bg-gradient-to-br from-yellow-100 to-amber-100', pack: 'default', minLevel: 'EXPLORER' },
  { id: 'heart', label: 'قلب', emoji: '❤️', bgClass: 'bg-gradient-to-br from-red-100 to-pink-100', pack: 'default', minLevel: 'EXPLORER' },
];

// ─── Curator Pack (Level 3+) ────────────────────────────────────────────
const CURATOR_AVATARS: VibeAvatarOption[] = [
  { id: 'creator', label: 'Creator', emoji: '✨', bgClass: 'bg-gradient-to-br from-violet-200 to-purple-200', pack: 'curator', minLevel: 'NEW_CURATOR' },
  { id: 'traveler', label: 'Traveler', emoji: '✈️', bgClass: 'bg-gradient-to-br from-sky-200 to-cyan-200', pack: 'curator', minLevel: 'ACTIVE_CURATOR' },
  { id: 'fire', label: 'آتش', emoji: '🔥', bgClass: 'bg-gradient-to-br from-orange-200 to-red-200', pack: 'curator', minLevel: 'TRUSTED_CURATOR' },
  { id: 'film-frame', label: 'فیلم', emoji: '🎬', bgClass: 'bg-gradient-to-br from-slate-300 to-indigo-200', pack: 'curator', minLevel: 'TRUSTED_CURATOR' },
  { id: 'open-book', label: 'کتاب', emoji: '📖', bgClass: 'bg-gradient-to-br from-amber-100 to-rose-100', pack: 'curator', minLevel: 'TRUSTED_CURATOR' },
  { id: 'compass', label: 'سفر', emoji: '🧭', bgClass: 'bg-gradient-to-br from-sky-100 to-teal-100', pack: 'curator', minLevel: 'TRUSTED_CURATOR' },
];

// ─── Elite Pack (Level 5+) – Aura + Symbolic + Frame ─────────────────────
const ELITE_AVATARS: VibeAvatarOption[] = [
  { id: 'elite-aura-purple-gold', label: 'Aura طلایی', emoji: '◇', bgClass: 'bg-gradient-to-br from-[#7C3AED] via-[#9333EA] to-[#EAB308]', pack: 'elite', eliteFrame: true },
  { id: 'elite-aura-blue-magenta', label: 'Aura آبی', emoji: '◇', bgClass: 'bg-gradient-to-br from-[#1E3A8A] via-[#6366F1] to-[#C026D3]', pack: 'elite', eliteFrame: true },
  { id: 'elite-aura-sunset', label: 'Aura غروب', emoji: '◇', bgClass: 'bg-gradient-to-br from-[#EA580C] via-[#DB2777] to-[#7C3AED]', pack: 'elite', eliteFrame: true },
  { id: 'elite-crown', label: 'Elite', emoji: '👑', bgClass: 'bg-gradient-to-br from-amber-200 to-yellow-300', pack: 'elite', minLevel: 'ELITE_CURATOR', eliteFrame: true },
  { id: 'elite-film', label: 'فیلم ویژه', emoji: '🎬', bgClass: 'bg-gradient-to-br from-slate-400 to-violet-400', pack: 'elite', eliteFrame: true },
  { id: 'elite-book', label: 'کتاب ویژه', emoji: '📚', bgClass: 'bg-gradient-to-br from-amber-200 to-rose-300', pack: 'elite', eliteFrame: true },
  { id: 'elite-compass', label: 'سفر ویژه', emoji: '✈️', bgClass: 'bg-gradient-to-br from-sky-400 to-cyan-400', pack: 'elite', eliteFrame: true },
  { id: 'elite-lifestyle', label: 'Lifestyle', emoji: '🍷', bgClass: 'bg-gradient-to-br from-rose-200 to-amber-200', pack: 'elite', eliteFrame: true },
  { id: 'legend', label: 'افسانه', emoji: '💫', bgClass: 'bg-gradient-to-br from-amber-200 to-yellow-400', pack: 'elite', minLevel: 'VIBE_LEGEND', eliteFrame: true },
];

/** همه آواتارها (برای سازگاری با کد قبلی و جستجو با id) */
export const VIBE_AVATARS: VibeAvatarOption[] = [
  ...DEFAULT_AVATARS,
  ...CURATOR_AVATARS,
  ...ELITE_AVATARS,
];

export const DEFAULT_PACK_AVATARS = DEFAULT_AVATARS;
export const CURATOR_PACK_AVATARS = CURATOR_AVATARS;
export const ELITE_PACK_AVATARS = ELITE_AVATARS;

export function getLevelIndex(level: CuratorLevelKey): number {
  const i = LEVEL_ORDER.indexOf(level);
  return i >= 0 ? i : 0;
}

/** آیا پک Curator برای این سطح باز است؟ (سطح ۳+) */
export function isCuratorPackUnlocked(userLevel: CuratorLevelKey): boolean {
  return getLevelIndex(userLevel) >= getLevelIndex(CURATOR_PACK_MIN_LEVEL);
}

/** آیا پک Elite برای این سطح باز است؟ (سطح ۵+) */
export function isElitePackUnlocked(userLevel: CuratorLevelKey): boolean {
  return getLevelIndex(userLevel) >= getLevelIndex(ELITE_PACK_MIN_LEVEL);
}

export function isPackUnlocked(pack: AvatarPackType, userLevel: CuratorLevelKey): boolean {
  if (pack === 'default') return true;
  if (pack === 'curator') return isCuratorPackUnlocked(userLevel);
  return isElitePackUnlocked(userLevel);
}

/** متن قفل برای پک (مثلاً "Level 5 required") */
export function getPackLockLabel(pack: AvatarPackType): string {
  if (pack === 'curator') return 'سطح ۳ (معتمد)';
  if (pack === 'elite') return 'سطح ۵ (برتر)';
  return '';
}

export function isAvatarUnlocked(avatar: VibeAvatarOption, userLevel: CuratorLevelKey): boolean {
  if (!isPackUnlocked(avatar.pack, userLevel)) return false;
  if (!avatar.minLevel) return true;
  const userIdx = getLevelIndex(userLevel);
  const requiredIdx = getLevelIndex(avatar.minLevel);
  return userIdx >= requiredIdx;
}

export function getAvatarImageUrl(avatarId: string): string | null {
  const a = VIBE_AVATARS.find((x) => x.id === avatarId);
  return a ? null : null;
}

/** آیا این آواتار از پک Elite است و فریم مخصوص دارد؟ */
export function hasEliteFrame(avatarId: string): boolean {
  const a = VIBE_AVATARS.find((x) => x.id === avatarId);
  return Boolean(a?.eliteFrame);
}

/** آیا کاربر سطح Elite دارد (۵+) برای نمایش فریم/بج؟ */
export function isUserEliteLevel(userLevel: CuratorLevelKey): boolean {
  return isElitePackUnlocked(userLevel);
}
