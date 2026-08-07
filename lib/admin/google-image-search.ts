import 'server-only';

import axios from 'axios';
import { getDecryptedSettings } from '@/lib/settings';

export type GoogleImageSearchResult = {
  title: string;
  link: string;
  thumbnail: string;
  width: number;
  height: number;
  contextLink?: string;
};

export async function searchGoogleImages(
  query: string,
  options?: { num?: number }
): Promise<{ results: GoogleImageSearchResult[]; error?: string }> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { results: [], error: 'عبارت جستجو الزامی است' };
  }

  const settings = await getDecryptedSettings();
  if (!settings.googleApiKey || !settings.googleSearchEngineId) {
    return {
      results: [],
      error: 'کلید Google API یا Search Engine ID در تنظیمات وارد نشده است',
    };
  }

  const num = Math.min(Math.max(options?.num ?? 10, 1), 10);

  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${settings.googleApiKey}&cx=${settings.googleSearchEngineId}&q=${encodeURIComponent(
      trimmed
    )}&searchType=image&num=${num}&imgSize=large`;

    const response = await axios.get(url, { timeout: 10000 });

    if (!response.data.items || response.data.items.length === 0) {
      return { results: [] };
    }

    const results: GoogleImageSearchResult[] = response.data.items.map((item: {
      title?: string;
      link?: string;
      image?: { thumbnailLink?: string; width?: number; height?: number; contextLink?: string };
    }) => ({
      title: item.title || '',
      link: item.link || '',
      thumbnail: item.image?.thumbnailLink || item.link || '',
      width: item.image?.width || 0,
      height: item.image?.height || 0,
      contextLink: item.image?.contextLink,
    }));

    return { results: results.filter((row) => row.link.startsWith('http')) };
  } catch (error: unknown) {
    const axiosError = error as {
      response?: { status?: number; data?: unknown };
      code?: string;
      message?: string;
    };

    if (axiosError.response?.status === 403) {
      return { results: [], error: 'کلید Google API نامعتبر است یا محدودیت استفاده به پایان رسیده' };
    }
    if (axiosError.response?.status === 400) {
      return { results: [], error: 'پارامترهای جستجو نامعتبر است' };
    }
    if (axiosError.code === 'ECONNABORTED') {
      return { results: [], error: 'زمان اتصال به Google API به پایان رسید' };
    }

    console.error('Google Custom Search API error:', axiosError.response?.data || axiosError.message);
    return { results: [], error: 'خطا در جستجوی Google Images' };
  }
}
