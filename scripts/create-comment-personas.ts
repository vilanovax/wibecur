import { PrismaClient, AccountKind } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import {
  buildPersonaUsername,
  generatePersonaNameBatch,
  getPersonaAvatarUrl,
} from '@/lib/comment-seed/persona-names';

const prisma = new PrismaClient();

async function main() {
  const count = parseInt(process.argv[2] || '50', 10);
  const password = await bcrypt.hash(nanoid(32), 10);
  const names = generatePersonaNameBatch(count);

  console.log(`Creating up to ${count} comment personas with natural full names...`);

  let created = 0;
  for (let i = 0; i < names.length; i++) {
    const { displayName, firstName, surname } = names[i]!;
    const userId = nanoid();
    const email = `persona+${userId.slice(0, 12)}@internal.wibe.local`;
    const username = buildPersonaUsername(firstName, surname, userId.slice(0, 6));
    const avatarUrl = getPersonaAvatarUrl(displayName, i + 1);

    try {
      const existing = await prisma.users.findUnique({ where: { email } });
      if (existing) continue;

      await prisma.$transaction(async (tx) => {
        await tx.users.create({
          data: {
            id: userId,
            name: displayName,
            email,
            username,
            password,
            image: avatarUrl,
            role: 'USER',
            accountKind: AccountKind.PERSONA,
            emailVerified: new Date(),
            updatedAt: new Date(),
          },
        });

        await tx.comment_personas.create({
          data: {
            displayName,
            username,
            avatarUrl,
            userId,
            updatedAt: new Date(),
          },
        });
      });

      created += 1;
      console.log(`✅ ${displayName} (${username})`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ ${displayName}: ${message}`);
    }
  }

  console.log(`Done. Created ${created} personas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
