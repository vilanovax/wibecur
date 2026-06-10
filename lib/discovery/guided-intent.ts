/**
 * مدل intent دستیار کشف — سناریوها، سوالات، و نقشه retrieval
 */

export const GUIDED_SCENARIOS = ['weekend', 'bored', 'going_out', 'staying_in'] as const;
export type GuidedScenario = (typeof GUIDED_SCENARIOS)[number];

export type GuidedLocation = 'out' | 'home';
export type GuidedTimeBudget = '5' | '30' | 'free';

export type GuidedContext = {
  scenario: GuidedScenario;
  location?: GuidedLocation;
  timeBudget?: GuidedTimeBudget;
};

export type GuidedScenarioConfig = {
  id: GuidedScenario;
  label: string;
  icon: string;
  /** سوال قبل از نتیجه — null یعنی مستقیم نتیجه */
  question?: {
    id: 'location' | 'timeBudget';
    prompt: string;
    options: Array<{ value: string; label: string }>;
  };
  /** مقدار پیش‌فرض وقتی سوال ندارد */
  preset?: Partial<Pick<GuidedContext, 'location' | 'timeBudget'>>;
};

export const GUIDED_SCENARIO_CONFIGS: GuidedScenarioConfig[] = [
  {
    id: 'weekend',
    label: 'پیشنهاد آخر هفته',
    icon: '🎉',
    question: {
      id: 'location',
      prompt: 'بیشتر دوست داری بیرون بری یا خونه بمونی؟',
      options: [
        { value: 'out', label: 'بیرون می‌رم' },
        { value: 'home', label: 'خونه‌ام' },
      ],
    },
  },
  {
    id: 'bored',
    label: 'حوصله‌ام سر رفته',
    icon: '😴',
    question: {
      id: 'timeBudget',
      prompt: 'چند دقیقه وقت داری؟',
      options: [
        { value: '5', label: '۵ دقیقه' },
        { value: '30', label: '۳۰ دقیقه' },
        { value: 'free', label: 'وقت آزاد' },
      ],
    },
  },
  {
    id: 'going_out',
    label: 'می‌خوام بیرون برم',
    icon: '🚶',
    preset: { location: 'out' },
  },
  {
    id: 'staying_in',
    label: 'خونه‌ام، چیکار کنم؟',
    icon: '🏠',
    preset: { location: 'home' },
  },
];

export type GuidedSearchPlan = {
  listQueries: string[];
  includeTrending: boolean;
  includeForYou: boolean;
  includeLifestyleTips: boolean;
  lifestyleTipLimit: number;
  preferShortLists: boolean;
  shortListMaxItems?: number;
};

export function parseGuidedScenario(value: string | null | undefined): GuidedScenario | null {
  if (!value || typeof value !== 'string') return null;
  const v = value.trim() as GuidedScenario;
  return GUIDED_SCENARIOS.includes(v) ? v : null;
}

export function parseGuidedLocation(value: string | null | undefined): GuidedLocation | null {
  if (value === 'out' || value === 'home') return value;
  return null;
}

export function parseGuidedTimeBudget(value: string | null | undefined): GuidedTimeBudget | null {
  if (value === '5' || value === '30' || value === 'free') return value;
  return null;
}

export function resolveGuidedContext(
  scenario: GuidedScenario,
  params: { location?: string | null; timeBudget?: string | null }
): GuidedContext {
  const config = GUIDED_SCENARIO_CONFIGS.find((c) => c.id === scenario);
  const location =
    parseGuidedLocation(params.location) ?? config?.preset?.location ?? undefined;
  const timeBudget =
    parseGuidedTimeBudget(params.timeBudget) ?? config?.preset?.timeBudget ?? undefined;

  return { scenario, location, timeBudget };
}

export function buildGuidedHeadline(ctx: GuidedContext): string {
  switch (ctx.scenario) {
    case 'weekend':
      return ctx.location === 'out'
        ? 'برای آخر هفته بیرون، اینا رو ببین'
        : 'برای آخر هفته خونه، اینا رو ببین';
    case 'bored':
      if (ctx.timeBudget === '5') return 'چند کار سریع برای الان';
      if (ctx.timeBudget === '30') return 'برای نیم‌ساعت آزاد، اینا خوبن';
      return 'وقت آزاد داری؟ این پیشنهادها رو ببین';
    case 'going_out':
      return 'برای بیرون رفتن، این لیست‌ها رو ببین';
    case 'staying_in':
      return 'برای خونه موندن، اینا رو امتحان کن';
    default:
      return 'پیشنهادهای وایب برای تو';
  }
}

/** نقشه scenario → کوئری‌ها و منابع retrieval */
export function buildGuidedSearchPlan(ctx: GuidedContext): GuidedSearchPlan {
  const base: GuidedSearchPlan = {
    listQueries: [],
    includeTrending: false,
    includeForYou: false,
    includeLifestyleTips: false,
    lifestyleTipLimit: 0,
    preferShortLists: false,
  };

  switch (ctx.scenario) {
    case 'weekend':
      if (ctx.location === 'out') {
        return {
          ...base,
          listQueries: ['کافه', 'رستوران', 'فیلم'],
          includeTrending: true,
          includeForYou: true,
          includeLifestyleTips: true,
          lifestyleTipLimit: 4,
        };
      }
      return {
        ...base,
        listQueries: ['فیلم', 'سریال', 'کتاب'],
        includeTrending: true,
        includeForYou: true,
        includeLifestyleTips: true,
        lifestyleTipLimit: 5,
      };

    case 'bored':
      if (ctx.timeBudget === '5') {
        return {
          ...base,
          includeLifestyleTips: true,
          lifestyleTipLimit: 6,
          includeTrending: true,
        };
      }
      if (ctx.timeBudget === '30') {
        return {
          ...base,
          listQueries: ['فیلم', 'کتاب'],
          preferShortLists: true,
          shortListMaxItems: 12,
          includeLifestyleTips: true,
          lifestyleTipLimit: 4,
        };
      }
      return {
        ...base,
        listQueries: ['فیلم', 'کافه', 'لایف'],
        includeTrending: true,
        includeForYou: true,
        includeLifestyleTips: true,
        lifestyleTipLimit: 5,
      };

    case 'going_out':
      return {
        ...base,
        listQueries: ['کافه', 'رستوران', 'سفر'],
        includeTrending: true,
        includeForYou: true,
        lifestyleTipLimit: 0,
        includeLifestyleTips: false,
      };

    case 'staying_in':
      return {
        ...base,
        listQueries: ['فیلم', 'سریال', 'کتاب'],
        includeTrending: true,
        includeForYou: true,
        includeLifestyleTips: true,
        lifestyleTipLimit: 5,
      };

    default:
      return {
        ...base,
        includeTrending: true,
        includeForYou: true,
      };
  }
}

export function rowTitleForQuery(query: string): string {
  const map: Record<string, string> = {
    کافه: 'کافه',
    رستوران: 'رستوران و غذا',
    فیلم: 'فیلم',
    سریال: 'سریال',
    کتاب: 'کتاب',
    سفر: 'سفر و گردش',
    لایف: 'لایف‌استایل',
  };
  return map[query] ?? query;
}
