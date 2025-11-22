import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDecryptedSettings } from '@/lib/settings';
import axios from 'axios';

export interface GoogleImageResult {
  title: string;
  link: string;
  thumbnail: string;
  width: number;
  height: number;
  contextLink?: string;
}

// POST /api/admin/items/search-google-images
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { query } = body;

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: 'عبارت جستجو الزامی است' },
        { status: 400 }
      );
    }

    const settings = await getDecryptedSettings();

    if (!settings.googleApiKey || !settings.googleSearchEngineId) {
      return NextResponse.json(
        {
          error:
            'لطفاً کلیدهای Google API و Search Engine ID را در تنظیمات وارد کنید',
        },
        { status: 500 }
      );
    }

    // Search Google Custom Search API for images
    const results = await searchGoogleImages(
      query,
      settings.googleApiKey,
      settings.googleSearchEngineId
    );

    if (results.length === 0) {
      return NextResponse.json(
        { error: 'هیچ تصویری با این عبارت جستجو یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Error searching Google images:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در جستجوی تصاویر' },
      { status: 500 }
    );
  }
}

/**
 * Search Google Custom Search API for images
 */
async function searchGoogleImages(
  query: string,
  apiKey: string,
  searchEngineId: string
): Promise<GoogleImageResult[]> {
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(
      query
    )}&searchType=image&num=10&imgSize=large`;

    console.log('Searching Google Images for:', query);

    const response = await axios.get(url, { timeout: 10000 });

    if (!response.data.items || response.data.items.length === 0) {
      return [];
    }

    // Transform results to our format
    const results: GoogleImageResult[] = response.data.items.map(
      (item: any) => ({
        title: item.title,
        link: item.link,
        thumbnail: item.image?.thumbnailLink || item.link,
        width: item.image?.width || 0,
        height: item.image?.height || 0,
        contextLink: item.image?.contextLink,
      })
    );

    return results;
  } catch (error: any) {
    console.error('Google Custom Search API error:', error.response?.data || error.message);

    // Handle specific Google API errors
    if (error.response?.status === 403) {
      throw new Error('کلید Google API نامعتبر است یا محدودیت استفاده به پایان رسیده');
    } else if (error.response?.status === 400) {
      throw new Error('پارامترهای جستجو نامعتبر است');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('زمان اتصال به Google API به پایان رسید');
    }

    throw new Error('خطا در جستجوی Google Images');
  }
}
