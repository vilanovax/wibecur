import type { GuidedLocation, GuidedScenario, GuidedTimeBudget } from '@/lib/discovery/guided-intent';

export type MoodExplorerPreset = {
  location?: GuidedLocation;
  timeBudget?: GuidedTimeBudget;
};

export type MoodExplorerCard = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  gradient: string;
  accent: string;
  guidedScenario: GuidedScenario;
  guidedPreset?: MoodExplorerPreset;
};

export type QuickNowPill = {
  id: string;
  label: string;
  icon: string;
  guidedScenario: GuidedScenario;
  guidedPreset?: MoodExplorerPreset;
  moodMeta: { title: string; subtitle: string };
};

export const MOOD_EXPLORER_CARDS: MoodExplorerCard[] = [
  {
    id: 'tired',
    title: 'خسته‌ای؟',
    subtitle: 'چیزهای سبک برای خاموش کردن ذهن',
    icon: '😮‍💨',
    gradient: 'from-slate-100/90 to-blue-100/70 border-slate-200/70',
    accent: 'bg-blue-100/80',
    guidedScenario: 'staying_in',
    guidedPreset: { location: 'home' },
  },
  {
    id: 'bored',
    title: 'بی‌حوصله‌ای؟',
    subtitle: 'یک وایب سریع برای تغییر حال',
    icon: '😴',
    gradient: 'from-amber-100/80 to-orange-100/60 border-amber-200/60',
    accent: 'bg-amber-100/80',
    guidedScenario: 'bored',
  },
  {
    id: 'with_kids',
    title: 'بچه همراهته؟',
    subtitle: 'جاها و سرگرمی‌های مناسب خانواده',
    icon: '👨‍👩‍👧',
    gradient: 'from-emerald-100/80 to-teal-100/60 border-emerald-200/60',
    accent: 'bg-emerald-100/80',
    guidedScenario: 'going_out',
    guidedPreset: { location: 'out' },
  },
  {
    id: 'free_night',
    title: 'امشب کاری نداری؟',
    subtitle: 'یک پلن آماده برای امشب',
    icon: '🌙',
    gradient: 'from-slate-100/90 to-blue-100/60 border-slate-200/70',
    accent: 'bg-slate-200/70',
    guidedScenario: 'weekend',
  },
  {
    id: 'busy_mind',
    title: 'ذهنت شلوغه؟',
    subtitle: 'چیزهایی برای خاموش کردن دنیا',
    icon: '🧘',
    gradient: 'from-sky-100/80 to-teal-100/60 border-sky-200/60',
    accent: 'bg-sky-100/80',
    guidedScenario: 'staying_in',
    guidedPreset: { location: 'home' },
  },
  {
    id: 'alone',
    title: 'تنهایی؟',
    subtitle: 'کافه، فیلم و کتاب برای خلوت خودت',
    icon: '☕',
    gradient: 'from-stone-100/90 to-zinc-200/50 border-stone-200/70',
    accent: 'bg-stone-200/60',
    guidedScenario: 'staying_in',
    guidedPreset: { location: 'home' },
  },
  {
    id: 'with_friend',
    title: 'با دوستی؟',
    subtitle: 'کافه، فیلم و تجربه‌های دونفره',
    icon: '👯',
    gradient: 'from-rose-100/80 to-pink-100/60 border-rose-200/60',
    accent: 'bg-rose-100/80',
    guidedScenario: 'going_out',
    guidedPreset: { location: 'out' },
  },
  {
    id: 'change_mood',
    title: 'می‌خوای حالت عوض شه؟',
    subtitle: 'چیزهایی که حس و حال را جابه‌جا می‌کنند',
    icon: '✨',
    gradient: 'from-rose-100/80 to-orange-100/60 border-rose-200/60',
    accent: 'bg-rose-100/80',
    guidedScenario: 'bored',
    guidedPreset: { timeBudget: 'free' },
  },
];

/** مودهای پیش‌فرض موبایل — ۲×۲ در نگاه اول */
export const MOBILE_FEATURED_MOOD_IDS = ['tired', 'bored', 'free_night', 'with_friend'] as const;

/**
 * فقط قید زمان/مکان — مودهای اجتماعی (با دوست، تنها، با بچه)
 * در کارت‌های Mood بالای صفحه می‌مانند تا هم‌پوشانی نباشد.
 */
export const QUICK_NOW_PILLS: QuickNowPill[] = [
  {
    id: 'quick_30min',
    label: '۳۰ دقیقه وقت دارم',
    icon: '⏱️',
    guidedScenario: 'bored',
    guidedPreset: { timeBudget: '30' },
    moodMeta: {
      title: '۳۰ دقیقه وقت دارم',
      subtitle: 'پیشنهادهای سریع برای همین الان',
    },
  },
  {
    id: 'quick_tonight',
    label: 'امشب می‌خوام ببینم',
    icon: '🎬',
    guidedScenario: 'staying_in',
    guidedPreset: { location: 'home' },
    moodMeta: {
      title: 'امشب می‌خوام ببینم',
      subtitle: 'فیلم، سریال و چیزهای خوب برای امشب',
    },
  },
  {
    id: 'quick_out',
    label: 'بیرون می‌خوام برم',
    icon: '🚶',
    guidedScenario: 'going_out',
    guidedPreset: { location: 'out' },
    moodMeta: {
      title: 'بیرون می‌خوام برم',
      subtitle: 'کافه، رستوران و جاهای بیرون',
    },
  },
];

export type MoodExplorerSelection = {
  moodId: string;
  scenario: GuidedScenario;
  moodMeta: { title: string; subtitle: string; icon?: string };
  preset?: MoodExplorerPreset;
};

export function moodCardToSelection(card: MoodExplorerCard): MoodExplorerSelection {
  return {
    moodId: card.id,
    scenario: card.guidedScenario,
    moodMeta: { title: card.title, subtitle: card.subtitle, icon: card.icon },
    preset: card.guidedPreset,
  };
}

export function quickPillToSelection(pill: QuickNowPill): MoodExplorerSelection {
  return {
    moodId: pill.id,
    scenario: pill.guidedScenario,
    moodMeta: { ...pill.moodMeta, icon: pill.icon },
    preset: pill.guidedPreset,
  };
}
