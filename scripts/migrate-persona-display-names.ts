/**
 * به‌روزرسانی نام پرسوناهای موجود از الگوی «سمیرا ر.» به نام کامل
 *
 * Usage: npx tsx scripts/migrate-persona-display-names.ts
 */
import { PrismaClient } from '@prisma/client';
import {
  buildPersonaDisplayName,
  getPersonaAvatarUrl,
} from '@/lib/comment-seed/persona-names';

const prisma = new PrismaClient();

async function main() {
  const personas = await prisma.comment_personas.findMany({
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Migrating ${personas.length} persona display names...`);
  let updated = 0;

  for (let i = 0; i < personas.length; i++) {
    const persona = personas[i]!;
    const displayName = buildPersonaDisplayName(i);
    const avatarUrl = getPersonaAvatarUrl(displayName, i + 100);

    if (persona.displayName === displayName) continue;

    await prisma.$transaction([
      prisma.comment_personas.update({
        where: { id: persona.id },
        data: { displayName, avatarUrl, updatedAt: new Date() },
      }),
      prisma.users.update({
        where: { id: persona.userId },
        data: { name: displayName, image: avatarUrl, updatedAt: new Date() },
      }),
    ]);

    updated += 1;
    console.log(`✅ ${persona.displayName} → ${displayName}`);
  }

  console.log(`Done. Updated ${updated} personas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
