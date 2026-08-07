/** تشخیص کاربران seed شده (اسکریپت create-bot-users) و پرسوناهای کامنت */

import { AccountKind } from '@prisma/client';

export function isBotUser(user: {
  email: string;
  name?: string | null;
  accountKind?: AccountKind | null;
}): boolean {
  if (user.accountKind === AccountKind.BOT) return true;
  if (user.accountKind === AccountKind.PERSONA) return false;
  if (user.name?.includes('(Bot)')) return true;
  return /^bot\d+@wibecur\.com$/i.test(user.email.trim());
}

export function isPersonaUser(user: {
  accountKind?: AccountKind | null;
  email?: string | null;
}): boolean {
  if (user.accountKind === AccountKind.PERSONA) return true;
  return Boolean(user.email?.includes('@internal.wibe.local'));
}

/** شرط Prisma برای حذف بات‌ها و پرسوناها از لیست ادمین */
export function botExclusionWhere() {
  return {
    NOT: {
      OR: [
        { accountKind: AccountKind.BOT },
        { accountKind: AccountKind.PERSONA },
        { name: { contains: '(Bot)', mode: 'insensitive' as const } },
        {
          AND: [
            { email: { startsWith: 'bot', mode: 'insensitive' as const } },
            { email: { contains: '@wibecur.com', mode: 'insensitive' as const } },
          ],
        },
        { email: { contains: '@internal.wibe.local', mode: 'insensitive' as const } },
      ],
    },
  };
}
