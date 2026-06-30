const SOURCE_LABELS: Record<string, string> = {
  taaghche: 'طاقچه',
  fidibo: 'فیدیبو',
  ketabrah: 'کتابراه',
};

export function getBookSourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}

export function formatBookFetchError(err: unknown, context?: string): string {
  const shortContext =
    context && context.startsWith('http')
      ? (() => {
          try {
            return new URL(context).hostname;
          } catch {
            return context;
          }
        })()
      : context;
  const prefix = shortContext ? `${shortContext}: ` : '';

  if (err instanceof Error) {
    if (err.name === 'AbortError') {
      return `${prefix}زمان انتظار تمام شد — سرور پاسخ نداد (احتمال timeout یا فیلتر شبکه)`;
    }

    const msg = err.message.toLowerCase();
    if (
      msg.includes('fetch failed') ||
      msg.includes('econnrefused') ||
      msg.includes('enotfound') ||
      msg.includes('network') ||
      msg.includes('socket')
    ) {
      return `${prefix}اتصال برقرار نشد — سایت از این سرور در دسترس نیست یا فیلتر شده`;
    }

    if (err.message.startsWith('HTTP ')) {
      return `${prefix}خطای سرور (${err.message})`;
    }

    return `${prefix}${err.message}`;
  }

  return `${prefix}خطای ناشناخته`;
}
