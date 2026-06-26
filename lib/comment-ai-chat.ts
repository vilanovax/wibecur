import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { getDecryptedSettings } from '@/lib/settings';
import {
  formatOpenAIError,
  normalizeOpenAICompletionOptions,
} from '@/lib/openai-chat';
import { resolveOpenAIModel } from '@/lib/openai-models';
import { resolveDeepSeekModel } from '@/lib/deepseek-models';
import {
  commentAiProviderLabel,
  resolveCommentAiProvider,
  type CommentAiProvider,
} from '@/lib/comment-ai-provider';

type CompletionOptions = Omit<
  OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
  'model' | 'messages'
>;

async function getCommentAiProvider(): Promise<CommentAiProvider> {
  const row = await prisma.comment_settings.findFirst({
    select: { commentAiProvider: true },
  });
  return resolveCommentAiProvider(row?.commentAiProvider);
}

export async function createCommentSeedChatCompletion(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  options?: CompletionOptions
) {
  const provider = await getCommentAiProvider();
  const settings = await getDecryptedSettings();

  if (provider === 'deepseek') {
    if (!settings.deepseekApiKey) {
      throw new Error('کلید DeepSeek در تنظیمات یکپارچه‌سازی وارد نشده است');
    }
    const model = resolveDeepSeekModel(settings.deepseekModel);
    const client = new OpenAI({
      apiKey: settings.deepseekApiKey,
      baseURL: 'https://api.deepseek.com',
    });
    return client.chat.completions.create({
      model,
      messages,
      ...normalizeOpenAICompletionOptions(model, options),
    });
  }

  if (!settings.openaiApiKey) {
    throw new Error('کلید OpenAI در تنظیمات یکپارچه‌سازی وارد نشده است');
  }
  const model = resolveOpenAIModel(settings.openaiModel);
  const client = new OpenAI({ apiKey: settings.openaiApiKey });
  return client.chat.completions.create({
    model,
    messages,
    ...normalizeOpenAICompletionOptions(model, options),
  });
}

export function formatCommentAiError(error: unknown): string {
  const msg = formatOpenAIError(error);
  if (msg.includes('DeepSeek') || msg.includes('OpenAI')) return msg;
  return msg.replace('OpenAI', 'هوش مصنوعی');
}

export async function getActiveCommentAiLabel(): Promise<string> {
  const provider = await getCommentAiProvider();
  return commentAiProviderLabel(provider);
}
