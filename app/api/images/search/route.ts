import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';

import { getDecryptedSettings } from '@/lib/settings';
import { checkActionRateLimit } from '@/lib/rate-limit';
import { logServerError } from '@/lib/api-error';
import axios from 'axios';

const MAX_QUERY_LEN = 120;

// POST /api/images/search - جستجوی تصاویر از Google (برای کاربران لاگین شده)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // محدودیت به‌ازای کاربر — endpoint به Google CSE پولی متصل است.
    const { success } = await checkActionRateLimit(
      `images-search:${session.user.id ?? session.user.email}`,
      20,
      '1 m'
    );
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'درخواست‌های زیاد — کمی صبر کنید.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json(
        { success: false, error: 'عبارت جستجو الزامی است' },
        { status: 400 }
      );
    }

    if (query.length > MAX_QUERY_LEN) {
      return NextResponse.json(
        { success: false, error: 'عبارت جستجو بیش از حد طولانی است' },
        { status: 400 }
      );
    }

    // Get Google API settings
    const settings = await getDecryptedSettings();

    if (!settings.googleApiKey || !settings.googleSearchEngineId) {
      return NextResponse.json(
        { success: false, error: 'جستجوی تصاویر در حال حاضر در دسترس نیست' },
        { status: 503 }
      );
    }

    // Search Google Images
    const url = `https://www.googleapis.com/customsearch/v1?key=${settings.googleApiKey}&cx=${settings.googleSearchEngineId}&q=${encodeURIComponent(query)}&searchType=image&num=10&imgSize=large`;

    try {
      const response = await axios.get(url, { timeout: 10000 });

      if (!response.data.items || response.data.items.length === 0) {
        return NextResponse.json({
          success: true,
          results: [],
        });
      }

      const results = response.data.items.map((item: any) => ({
        title: item.title,
        link: item.link,
        thumbnail: item.image?.thumbnailLink || item.link,
        width: item.image?.width || 0,
        height: item.image?.height || 0,
        contextLink: item.image?.contextLink,
      }));

      return NextResponse.json({
        success: true,
        results,
      });
    } catch (axiosError: any) {
      console.error('Google Custom Search API error:', axiosError.response?.data || axiosError.message);

      if (axiosError.response?.status === 403) {
        throw new Error('کلید Google API نامعتبر است یا محدودیت استفاده به پایان رسیده');
      } else if (axiosError.response?.status === 400) {
        throw new Error('پارامترهای جستجو نامعتبر است');
      } else if (axiosError.code === 'ECONNABORTED') {
        throw new Error('زمان اتصال به Google API به پایان رسید');
      }

      throw new Error('خطا در جستجوی Google Images');
    }

    } catch (error: unknown) {
      logServerError('images/search', error);
      return NextResponse.json(
        { success: false, error: 'خطا در جستجوی تصاویر' },
        { status: 500 }
      );
    }
}

