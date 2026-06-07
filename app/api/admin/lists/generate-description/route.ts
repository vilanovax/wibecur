import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { createAdminOpenAIChatCompletion, formatOpenAIError } from '@/lib/openai-chat';

/** POST /api/admin/lists/generate-description — توضیحات لیست curated با AI */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await requirePermission('manage_lists');
    if (adminUser instanceof NextResponse) return adminUser;

    const body = await request.json();
    const { title, categorySlug, categoryName } = body as {
      title?: string;
      categorySlug?: string;
      categoryName?: string;
    };

    if (!title?.trim()) {
      return NextResponse.json({ error: 'عنوان لیست الزامی است' }, { status: 400 });
    }

    const catLabel = categoryName?.trim() || categorySlug || 'عمومی';

    const completion = await createAdminOpenAIChatCompletion(
      [
        {
          role: 'system',
          content:
            'شما کپی‌رایتر پلتفرم پیشنهاد محتوا (WibeCur) هستید. توضیحات لیست‌های curated را به فارسی، جذاب و بدون اغراق می‌نویسید. پاسخ فقط JSON.',
        },
        {
          role: 'user',
          content: `برای یک لیست curated در دسته «${catLabel}» با عنوان «${title.trim()}»، JSON زیر را بساز:
{
  "description": "۲ تا ۳ جمله فارسی: این لیست برای چه کسی است، چه نوع آیتم‌هایی دارد، و چرا ارزش دیدن دارد. لحن گرم و دعوت‌کننده، بدون emoji"
}`,
        },
      ],
      {
        temperature: 0.65,
        max_tokens: 350,
        response_format: { type: 'json_object' },
      }
    );

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'خطا در تولید توضیحات' }, { status: 500 });
    }

    let parsed: { description?: string };
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: 'خطا در پردازش پاسخ AI' }, { status: 500 });
    }

    const description = parsed.description?.trim();
    if (!description) {
      return NextResponse.json({ error: 'توضیحات خالی برگشت' }, { status: 500 });
    }

    return NextResponse.json({ description });
  } catch (error: unknown) {
    console.error('list generate-description:', error);
    return NextResponse.json({ error: formatOpenAIError(error) }, { status: 500 });
  }
}
