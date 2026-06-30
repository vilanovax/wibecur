import { sleep } from '@/lib/books/normalize';

const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export type FetchHtmlOptions = {
  headers?: Record<string, string>;
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
};

export async function fetchHtml(
  url: string,
  options: FetchHtmlOptions = {}
): Promise<string> {
  const maxRetries = options.maxRetries ?? 3;
  const retryDelayMs = options.retryDelayMs ?? 500;
  const timeoutMs = options.timeoutMs ?? 30000;

  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, {
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': DEFAULT_UA,
          'Accept-Language': 'fa-IR,fa;q=0.9,en;q=0.8',
          Accept: 'text/html,application/xhtml+xml',
          ...options.headers,
        },
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (!text.trim()) throw new Error('پاسخ خالی');
      return text;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries - 1) await sleep(retryDelayMs * (attempt + 1));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('درخواست ناموفق');
}

export async function fetchJson<T>(
  url: string,
  options: FetchHtmlOptions & { method?: string; body?: string } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const retryDelayMs = options.retryDelayMs ?? 500;
  const timeoutMs = options.timeoutMs ?? 30000;

  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, {
        method: options.method ?? 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': DEFAULT_UA,
          Accept: 'application/json',
          ...options.headers,
        },
        body: options.body,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as T;
      return data;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries - 1) await sleep(retryDelayMs * (attempt + 1));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('درخواست JSON ناموفق');
}

export function extractNextData(html: string): Record<string, unknown> | null {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match?.[1]) return null;
  try {
    return JSON.parse(match[1]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** استخراج مقدار JSON از window.bookContext = {...} */
export function extractJsObjectAssignment(html: string, varName: string): Record<string, unknown> | null {
  const marker = `${varName} =`;
  const start = html.indexOf(marker);
  if (start < 0) return null;
  let i = start + marker.length;
  while (i < html.length && /\s/.test(html[i]!)) i++;
  if (html[i] !== '{') return null;

  let depth = 0;
  let inString: '"' | "'" | null = null;
  let escaped = false;
  const begin = i;

  for (; i < html.length; i++) {
    const ch = html[i]!;
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === inString) inString = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = ch;
      continue;
    }
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) {
        const jsonText = html.slice(begin, i + 1);
        try {
          return JSON.parse(jsonText) as Record<string, unknown>;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}
