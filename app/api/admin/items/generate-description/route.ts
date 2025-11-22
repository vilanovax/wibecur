import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDecryptedSettings } from '@/lib/settings';
import OpenAI from 'openai';

// POST /api/admin/items/generate-description
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { title, categorySlug, metadata, plot } = body;

    if (!title || !categorySlug) {
      return NextResponse.json(
        { error: 'عنوان و دسته‌بندی الزامی هستند' },
        { status: 400 }
      );
    }

    // Get OpenAI API key from database
    console.log('=== Fetching OpenAI key from database ===');
    const settings = await getDecryptedSettings();
    const openaiApiKey = settings.openaiApiKey;

    console.log('OpenAI key exists:', !!openaiApiKey);
    if (openaiApiKey) {
      console.log('Key starts with:', openaiApiKey.substring(0, 3));
      console.log('Key length:', openaiApiKey.length);
    }

    if (!openaiApiKey) {
      console.error('No OpenAI key found in settings');
      return NextResponse.json(
        { error: 'کلید OpenAI در تنظیمات وارد نشده است' },
        { status: 500 }
      );
    }

    // Initialize OpenAI with key from database
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Generate context-aware prompt based on category
    const prompt = generatePrompt(title, categorySlug, metadata, plot);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'شما یک نویسنده خلاق هستید که توضیحات جذاب و مختصر به زبان فارسی می‌نویسد. توضیحات باید بین 2 تا 4 جمله باشد و اطلاعات کلیدی را در بر بگیرد. پاسخ خود را به صورت JSON ارائه دهید.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content || '';

    if (!content) {
      return NextResponse.json(
        { error: 'خطا در تولید توضیحات' },
        { status: 500 }
      );
    }

    // Parse JSON response
    let result;
    try {
      result = JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', content);
      return NextResponse.json(
        { error: 'خطا در پردازش پاسخ هوش مصنوعی' },
        { status: 500 }
      );
    }

    // Extract description and metadata
    const description = result.description || '';
    const generatedMetadata: any = {};

    // Extract metadata based on category
    if (categorySlug === 'movie' || categorySlug === 'film' || categorySlug === 'movies') {
      if (result.year) generatedMetadata.year = result.year;
      if (result.genre) generatedMetadata.genre = result.genre;
      if (result.director) generatedMetadata.director = result.director;
      if (result.imdbRating) generatedMetadata.imdbRating = result.imdbRating;
    } else if (categorySlug === 'book' || categorySlug === 'books') {
      if (result.author) {
        generatedMetadata.author = result.author;
        console.log('✅ Author found:', result.author);
      } else {
        console.log('⚠️ Author not found in AI response');
      }
      if (result.genre) generatedMetadata.genre = result.genre;
    }

    console.log('📦 Generated metadata:', generatedMetadata);

    return NextResponse.json({
      description,
      metadata: Object.keys(generatedMetadata).length > 0 ? generatedMetadata : undefined
    });
  } catch (error: any) {
    console.error('Error generating description:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در تولید توضیحات' },
      { status: 500 }
    );
  }
}

function generatePrompt(
  title: string,
  categorySlug: string,
  metadata: any,
  plot?: string
): string {
  if (categorySlug === 'movie' || categorySlug === 'film' || categorySlug === 'movies') {
    const year = metadata?.year ? ` (${metadata.year})` : '';
    const genre = metadata?.genre ? ` در ژانر ${metadata.genre}` : '';

    // If we have plot from TMDb/OMDb, use it for better context
    if (plot) {
      return `بر اساس این خلاصه داستان انگلیسی: "${plot}"

برای فیلم/سریال "${title}"${year}${genre}، یک پاسخ JSON با ساختار زیر تولید کن:
{
  "description": "توضیحات جذاب و مختصر به زبان فارسی (2 تا 4 جمله) که شامل خلاصه داستان بدون اسپویل، مضامین اصلی، و دلایل تماشا باشد",
  "year": "سال تولید فیلم (اگر در عنوان یا خلاصه ذکر شده)",
  "genre": "ژانر فیلم به فارسی (مثلاً: اکشن، درام، علمی-تخیلی)",
  "director": "نام کارگردان (اگر می‌دانی)",
  "imdbRating": "امتیاز IMDb (اگر می‌دانی، مثلاً 8.5)"
}

اگر سال، ژانر، کارگردان یا امتیاز را نمی‌دانی، فیلدهای مربوطه را خالی بگذار یا حذف کن.`;
    }

    return `برای فیلم/سریال "${title}"${year}${genre}، یک پاسخ JSON با ساختار زیر تولید کن:
{
  "description": "توضیحات جذاب و مختصر به زبان فارسی (2 تا 4 جمله) شامل خلاصه داستان، مضامین اصلی، و دلایل تماشا",
  "year": "سال تولید فیلم (اگر می‌دانی)",
  "genre": "ژانر فیلم به فارسی",
  "director": "نام کارگردان (اگر می‌دانی)",
  "imdbRating": "امتیاز IMDb (اگر می‌دانی، مثلاً 8.5)"
}

اگر اطلاعاتی را نمی‌دانی، فیلدهای مربوطه را خالی بگذار یا حذف کن.`;
  }

  if (categorySlug === 'book' || categorySlug === 'books') {
    const existingAuthor = metadata?.author ? ` نوشته ${metadata.author}` : '';
    return `برای کتاب "${title}"${existingAuthor}، یک پاسخ JSON با ساختار زیر تولید کن:
{
  "description": "توضیحات جذاب و مختصر به زبان فارسی (2 تا 4 جمله) که موضوع اصلی، سبک نوشتاری، و دلایل خواندن را شامل شود",
  "author": "نام کامل نویسنده (اگر می‌دانی، حتماً برگردان - حتی اگر در عنوان ذکر نشده باشد. از دانش خودت استفاده کن تا نویسنده را پیدا کنی. مثال: برای 'ارباب حلقه‌ها' باید 'جی. آر. آر. تالکین' یا 'J.R.R. Tolkien' را برگردانی)",
  "genre": "ژانر کتاب به فارسی (مثلاً: رمان، علمی-تخیلی، روانشناسی، خودیاری و توسعه فردی)"
}

**مهم:** 
1. حتماً سعی کن نام نویسنده را پیدا کنی و در فیلد "author" برگردانی. 
2. از دانش خودت درباره کتاب‌های معروف استفاده کن. 
3. اگر عنوان کتاب را می‌شناسی، حتماً نویسنده آن را هم می‌دانی - پس آن را برگردان.
4. اگر واقعاً نمی‌دانی یا کتابی ناشناخته است، فیلد author را خالی بگذار.`;
  }

  if (categorySlug === 'cafe' || categorySlug === 'restaurant') {
    const cuisine = metadata?.cuisine ? ` با تخصص ${metadata.cuisine}` : '';
    const priceRange = metadata?.priceRange
      ? ` در بازه قیمت ${metadata.priceRange}`
      : '';
    return `برای کافه/رستوران "${title}"${cuisine}${priceRange}، یک پاسخ JSON با ساختار زیر تولید کن:
{
  "description": "توضیحات جذاب و مختصر به زبان فارسی (2 تا 4 جمله) که فضا، نوع غذا، و تجربه کلی را شرح دهد"
}`;
  }

  // Default prompt for other categories
  return `درباره "${title}"، یک پاسخ JSON با ساختار زیر تولید کن:
{
  "description": "توضیحات جذاب و مختصر به زبان فارسی (2 تا 4 جمله) که ویژگی‌ها و نکات کلیدی را توضیح دهد"
}`;
}
