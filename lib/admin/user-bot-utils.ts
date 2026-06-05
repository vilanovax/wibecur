/** تشخیص کاربران seed شده (اسکریپت create-bot-users) */

export function isBotUser(user: { email: string; name?: string | null }): boolean {
  if (user.name?.includes('(Bot)')) return true;
  return /^bot\d+@wibecur\.com$/i.test(user.email.trim());
}

/** شرط Prisma برای حذف بات‌ها از لیست ادمین */
export function botExclusionWhere() {
  return {
    NOT: {
      OR: [
        { name: { contains: '(Bot)', mode: 'insensitive' as const } },
        {
          AND: [
            { email: { startsWith: 'bot', mode: 'insensitive' as const } },
            { email: { contains: '@wibecur.com', mode: 'insensitive' as const } },
          ],
        },
      ],
    },
  };
}
