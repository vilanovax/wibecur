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
    subtitle: 'فیلم، کافه و چیزهای سبک برای خاموش کردن ذهن',
    icon: '😮‍💨',
    gradient: 'from-slate-50 to-blue-50/80 border-slate-200/80',
    guidedScenario: 'staying_in',
    guidedPreset: { location: 'home' },
  },
  {
    id: 'bored',
    title: 'بی‌حوصله‌ای؟',
    subtitle: 'یک وایب سریع برای تغییر حال',
    icon: '😴',
    gradient: 'from-amber-50 to-orange-50/80 border-amber-200/70',
    guidedScenario: 'bored',
  },
  {
    id: 'with_kids',
    title: 'بچه همراهته؟',
    subtitle: 'جاها، فیلم‌ها و سرگرمی‌های مناسب خانواده',
    icon: '👨‍👩‍👧',
    gradient: 'from-emerald-50 to-teal-50/80 border-emerald-200/70',
    guidedScenario: 'going_out',
    guidedPreset: { location: 'out' },
  },
  {
    id: 'free_night',
    title: 'امشب کاری نداری؟',
    subtitle: 'یک پلن آماده برای امشب یا آخر هفته',
    icon: '🌙',
    gradient: 'from-indigo-50 to-violet-50/80 border-indigo-200/70',
    guidedScenario: 'weekend',
  },
  {
    id: 'busy_mind',
    title: 'ذهنت شلوغه؟',
    subtitle: 'چیزهایی برای خاموش کردن دنیا',
    icon: '🧘',
    gradient: 'from-sky-50 to-cyan-50/80 border-sky-200/70',
    guidedScenario: 'staying_in',
    guidedPreset: { location: 'home' },
  },
  {
    id: 'alone',
    title: 'تنهایی؟',
    subtitle: 'کافه، فیلم و کتاب برای خلوت خودت',
    icon: '☕',
    gradient: 'from-stone-50 to-zinc-100/80 border-stone-200/80',
    guidedScenario: 'staying_in',
    guidedPreset: { location: 'home' },
  },
  {
    id: 'with_friend',
    title: 'با دوستی؟',
    subtitle: 'کافه، فیلم و تجربه‌های دونفره',
    icon: '👯',
    gradient: 'from-rose-50 to-pink-50/80 border-rose-200/70',
    guidedScenario: 'going_out',
    guidedPreset: { location: 'out' },
  },
  {
    id: 'short_time',
    title: 'فقط ۳۰ دقیقه وقت داری؟',
    subtitle: 'پیشنهادهای سریع و کوتاه',
    icon: '⏱️',
    gradient: 'from-lime-50 to-green-50/80 border-lime-200/70',
    guidedScenario: 'bored',
    guidedPreset: { timeBudget: '30' },
  },
  {
    id: 'change_mood',
    title: 'می‌خوای حالت عوض شه؟',
    subtitle: 'چیزهایی که حس و حال را جابه‌جا می‌کنند',
    icon: '✨',
    gradient: 'from-fuchsia-50 to-purple-50/80 border-fuchsia-200/70',
    guidedScenario: 'bored',
    guidedPreset: { timeBudget: 'free' },
  },
];

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
  {
    id: 'quick_kids',
    label: 'با بچه‌ام',
    icon: '👨‍👩‍👧',
    guidedScenario: 'going_out',
    guidedPreset: { location: 'out' },
    moodMeta: {
      title: 'با بچه‌ام',
      subtitle: 'جاهای مناسب خانواده',
    },
  },
  {
    id: 'quick_friend',
    label: 'با دوستم',
    icon: '👯',
    guidedScenario: 'going_out',
    guidedPreset: { location: 'out' },
    moodMeta: {
      title: 'با دوستم',
      subtitle: 'تجربه‌های دونفره',
    },
  },
  {
    id: 'quick_solo',
    label: 'تنها هستم',
    icon: '☕',
    guidedScenario: 'staying_in',
    guidedPreset: { location: 'home' },
    moodMeta: {
      title: 'تنها هستم',
      subtitle: 'چیزهایی برای خلوت و آرامش',
    },
  },
];

export type MoodExplorerSelection = {
  moodId: string;
  scenario: GuidedScenario;
  moodMeta: { title: string; subtitle: string };
  preset?: MoodExplorerPreset;
};

export function moodCardToSelection(card: MoodExplorerCard): MoodExplorerSelection {
  return {
    moodId: card.id,
    scenario: card.guidedScenario,
    moodMeta: { title: card.title, subtitle: card.subtitle },
    preset: card.guidedPreset,
  };
}

export function quickPillToSelection(pill: QuickNowPill): MoodExplorerSelection {
  return {
    moodId: pill.id,
    scenario: pill.guidedScenario,
    moodMeta: pill.moodMeta,
    preset: pill.guidedPreset,
  };
}
