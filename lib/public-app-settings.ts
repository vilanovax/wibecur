import { prisma } from './prisma';
import { dbQuery } from './db';

export type PublicAppSettings = {
  maxPersonalLists: number;
  minItemsForPublicList: number;
  personalListPublicInstructions: string | null;
};

export const DEFAULT_PUBLIC_APP_SETTINGS: PublicAppSettings = {
  maxPersonalLists: 3,
  minItemsForPublicList: 5,
  personalListPublicInstructions: null,
};

/** تنظیمات عمومی اپ — بدون API key (برای فرم‌های کاربر) */
export async function getPublicAppSettings(): Promise<PublicAppSettings> {
  try {
    const row = await dbQuery(() =>
      prisma.settings.findUnique({
        where: { id: 'settings' },
        select: {
          maxPersonalLists: true,
          minItemsForPublicList: true,
          personalListPublicInstructions: true,
        },
      })
    );

    if (!row) return DEFAULT_PUBLIC_APP_SETTINGS;

    return {
      maxPersonalLists: row.maxPersonalLists ?? DEFAULT_PUBLIC_APP_SETTINGS.maxPersonalLists,
      minItemsForPublicList:
        row.minItemsForPublicList ?? DEFAULT_PUBLIC_APP_SETTINGS.minItemsForPublicList,
      personalListPublicInstructions: row.personalListPublicInstructions ?? null,
    };
  } catch (error) {
    console.warn('getPublicAppSettings fallback:', (error as Error)?.message);
    return DEFAULT_PUBLIC_APP_SETTINGS;
  }
}
