export type CommentAiProvider = 'openai' | 'deepseek';

export const COMMENT_AI_PROVIDER_OPTIONS: {
  value: CommentAiProvider;
  label: string;
  description: string;
}[] = [
  {
    value: 'openai',
    label: 'OpenAI',
    description: 'از کلید و مدل OpenAI در تنظیمات یکپارچه‌سازی استفاده می‌شود',
  },
  {
    value: 'deepseek',
    label: 'DeepSeek',
    description: 'از کلید و مدل DeepSeek در تنظیمات یکپارچه‌سازی استفاده می‌شود',
  },
];

export function resolveCommentAiProvider(
  value: string | null | undefined
): CommentAiProvider {
  return value === 'deepseek' ? 'deepseek' : 'openai';
}

export function commentAiProviderLabel(provider: CommentAiProvider): string {
  return (
    COMMENT_AI_PROVIDER_OPTIONS.find((o) => o.value === provider)?.label ??
    'OpenAI'
  );
}

export type PersonBioAiSettings = {
  personBioAiProvider: CommentAiProvider;
  providerLabel: string;
  openaiConfigured: boolean;
  deepseekConfigured: boolean;
  providerReady: boolean;
  effectiveProvider: CommentAiProvider | null;
  fallbackActive: boolean;
};
