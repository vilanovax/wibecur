import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { createAdminOpenAIChatCompletion, formatOpenAIError } from '@/lib/openai-chat';
import { checkActionRateLimit } from '@/lib/rate-limit';
import {
  buildItemDescriptionPrompt,
  extractGeneratedItemMetadata,
  inferContentType,
  ITEM_DESCRIPTION_SYSTEM_PROMPT,
  type ItemDescriptionAIContext,
} from '@/lib/admin/item-description-ai';

const MAX_TITLE_LEN = 200;
const MAX_PLOT_LEN = 4000;

// POST /api/items/generate-description - تولید توضیحات با AI (برای کاربران لاگین شده)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'برای استفاده از این قابلیت باید وارد حساب کاربری خود شوید' },
        { status: 401 }
      );
    }

    const { success } = await checkActionRateLimit(
      `gen-desc:${session.user.id ?? session.user.email}`,
      15,
      '1 m'
    );
    if (!success) {
      return NextResponse.json(
        { error: 'درخواست‌های زیاد — کمی صبر کنید.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const ctx: ItemDescriptionAIContext = {
      title: typeof body.title === 'string' ? body.title.trim() : '',
      categorySlug: typeof body.categorySlug === 'string' ? body.categorySlug.trim() : '',
      categoryName: body.categoryName ?? null,
      listTitle: body.listTitle ?? null,
      listDescription: body.listDescription ?? null,
      entryKind: body.entryKind ?? null,
      listNote: body.listNote ?? null,
      externalUrl: body.externalUrl ?? null,
      metadata:
        body.metadata != null && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
          ? body.metadata
          : null,
      plot: typeof body.plot === 'string' ? body.plot : null,
    };

    if (!ctx.title || !ctx.categorySlug) {
      return NextResponse.json(
        { error: 'عنوان و دسته‌بندی الزامی هستند' },
        { status: 400 }
      );
    }

    if (ctx.title.length > MAX_TITLE_LEN || (ctx.plot && ctx.plot.length > MAX_PLOT_LEN)) {
      return NextResponse.json({ error: 'ورودی بیش از حد طولانی است' }, { status: 400 });
    }

    const contentType = inferContentType(ctx);
    const prompt = buildItemDescriptionPrompt(ctx);

    const completion = await createAdminOpenAIChatCompletion(
      [
        {
          role: 'system',
          content: ITEM_DESCRIPTION_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      {
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }
    );

    const content = completion.choices[0]?.message?.content || '';

    if (!content) {
      return NextResponse.json({ error: 'خطا در تولید توضیحات' }, { status: 500 });
    }

    let result: Record<string, unknown>;
    try {
      result = JSON.parse(content) as Record<string, unknown>;
    } catch {
      console.error('Failed to parse AI response as JSON:', content);
      return NextResponse.json(
        { error: 'خطا در پردازش پاسخ هوش مصنوعی' },
        { status: 500 }
      );
    }

    const description = typeof result.description === 'string' ? result.description : '';
    const generatedMetadata = extractGeneratedItemMetadata(
      contentType,
      ctx.categorySlug,
      result
    );

    return NextResponse.json({
      success: true,
      description,
      metadata: Object.keys(generatedMetadata).length > 0 ? generatedMetadata : undefined,
    });
  } catch (error: unknown) {
    console.error('Error generating description:', error);
    return NextResponse.json({ error: formatOpenAIError(error) }, { status: 500 });
  }
}
