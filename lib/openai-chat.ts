import OpenAI from 'openai';
import { getDecryptedSettings } from '@/lib/settings';
import {
  defaultReasoningEffortForModel,
  modelDisallowsSamplingParams,
  modelUsesMaxCompletionTokens,
  resolveOpenAIModel,
} from '@/lib/openai-models';

type CompletionOptions = Omit<
  OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
  'model' | 'messages'
>;

const SAMPLING_KEYS = [
  'temperature',
  'top_p',
  'presence_penalty',
  'frequency_penalty',
  'logprobs',
  'top_logprobs',
  'logit_bias',
] as const;

/**
 * GPT-5 / o-series: بدون temperature؛ GPT-5/4.1: max_completion_tokens
 */
export function normalizeOpenAICompletionOptions(
  model: string,
  options?: CompletionOptions
): CompletionOptions | undefined {
  const opts: Record<string, unknown> = { ...(options ?? {}) };

  if (modelDisallowsSamplingParams(model)) {
    for (const key of SAMPLING_KEYS) {
      delete opts[key];
    }
  }

  const reasoningDefault = defaultReasoningEffortForModel(model);
  if (reasoningDefault && opts.reasoning_effort == null) {
    opts.reasoning_effort = reasoningDefault;
  }

  const tokenLimit = (opts.max_completion_tokens ?? opts.max_tokens) as number | undefined;
  delete opts.max_tokens;
  delete opts.max_completion_tokens;

  if (tokenLimit != null) {
    if (modelUsesMaxCompletionTokens(model)) {
      opts.max_completion_tokens = tokenLimit;
    } else {
      opts.max_tokens = tokenLimit;
    }
  }

  return Object.keys(opts).length > 0 ? (opts as CompletionOptions) : undefined;
}

export async function createAdminOpenAIChatCompletion(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  options?: CompletionOptions
) {
  const settings = await getDecryptedSettings();
  if (!settings.openaiApiKey) {
    throw new Error('کلید OpenAI در تنظیمات وارد نشده است');
  }

  const openai = new OpenAI({ apiKey: settings.openaiApiKey });
  const model = resolveOpenAIModel(settings.openaiModel);

  return openai.chat.completions.create({
    model,
    messages,
    ...normalizeOpenAICompletionOptions(model, options),
  });
}

/** پیام خطای OpenAI را برای UI خواناتر می‌کند */
export function formatOpenAIError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = String((error as { message: unknown }).message);
    if (msg.includes('temperature')) {
      return 'این مدل temperature پشتیبانی نمی‌کند — تنظیمات API به‌روز شد؛ دوباره امتحان کنید';
    }
    if (msg.includes('max_tokens')) {
      return 'این مدل فقط max_completion_tokens می‌پذیرد — تنظیمات API به‌روز شد؛ دوباره امتحان کنید';
    }
    return msg;
  }
  return 'خطا در اتصال به OpenAI';
}
