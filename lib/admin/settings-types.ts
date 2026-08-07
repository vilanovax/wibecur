import type { CommentAiProvider } from '@/lib/comment-ai-provider';

export type SettingsTab =
  | 'integrations'
  | 'branding'
  | 'emergency'
  | 'comments'
  | 'lists'
  | 'account';

export const SETTINGS_TABS: {
  id: SettingsTab;
  label: string;
  hash?: string;
}[] = [
  { id: 'integrations', label: 'یکپارچه‌سازی' },
  { id: 'branding', label: 'ظاهر سایت' },
  { id: 'emergency', label: 'حالت اضطراری' },
  { id: 'comments', label: 'کامنت‌ها' },
  { id: 'lists', label: 'لیست‌ها' },
  { id: 'account', label: 'حساب ادمین', hash: 'password' },
];

export function parseSettingsTab(
  tab: string | null | undefined
): SettingsTab {
  if (
    tab === 'branding' ||
    tab === 'emergency' ||
    tab === 'comments' ||
    tab === 'lists' ||
    tab === 'account'
  ) {
    return tab;
  }
  if (tab === 'password') return 'account';
  return 'integrations';
}

export type SettingsData = {
  openaiApiKey: string | null;
  openaiModel: string | null;
  deepseekApiKey: string | null;
  deepseekModel: string | null;
  tmdbApiKey: string | null;
  omdbApiKey: string | null;
  googleApiKey: string | null;
  googleSearchEngineId: string | null;
  liaraBucketName: string | null;
  liaraEndpoint: string | null;
  liaraAccessKey: string | null;
  liaraSecretKey: string | null;
  minItemsForPublicList: number;
  maxPersonalLists: number;
  personalListPublicInstructions: string | null;
  siteLogoUrl: string | null;
};

export type CommentSettingsState = {
  defaultMaxComments: number | null;
  defaultCommentsEnabled: boolean;
  maxCommentLength: number | null;
  rateLimitMinutes: number;
  globalRateLimitMinutes: number | null;
  penaltyWarnThreshold: number;
  penaltyRestrictThreshold: number;
  penaltyBanThreshold: number;
  penaltyRestrictDays: number;
  commentAiProvider: CommentAiProvider;
};

export function countConfiguredIntegrations(settings: SettingsData): {
  configured: number;
  total: number;
  partialGoogle: boolean;
} {
  let configured = 0;
  const googleComplete =
    !!settings.googleApiKey && !!settings.googleSearchEngineId;
  const partialGoogle =
    (!!settings.googleSearchEngineId || !!settings.googleApiKey) && !googleComplete;

  const checks = [
    !!settings.openaiApiKey,
    !!settings.deepseekApiKey,
    !!settings.tmdbApiKey,
    !!settings.omdbApiKey,
    googleComplete,
    !!settings.liaraBucketName &&
      !!settings.liaraEndpoint &&
      !!settings.liaraAccessKey &&
      !!settings.liaraSecretKey,
  ];
  checks.forEach((ok) => {
    if (ok) configured += 1;
  });
  return { configured, total: checks.length, partialGoogle };
}
