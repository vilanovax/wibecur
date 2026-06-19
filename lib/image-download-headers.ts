/** هدرهای مناسب برای دانلود تصویر از منابع مختلف */
export function buildImageDownloadHeaders(imageUrl: string): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  try {
    const host = new URL(imageUrl).hostname.toLowerCase();
    if (host.includes('amazon.com') || host.includes('imdb')) {
      headers.Referer = 'https://www.imdb.com/';
    } else if (host.includes('googleusercontent') || host.includes('gstatic.com')) {
      headers.Referer = 'https://www.google.com/';
    } else if (host.includes('tmdb.org') || host.includes('themoviedb.org')) {
      headers.Referer = 'https://www.themoviedb.org/';
    } else if (host.includes('castando.ir')) {
      headers.Referer = 'https://castando.ir/';
      headers.Origin = 'https://castando.ir';
    }
  } catch {
    /* نگه‌داشتن هدر پایه */
  }

  return headers;
}
