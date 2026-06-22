import { PrismaClient, AccountKind } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

const PERSONA_FIRST_NAMES = [
  'رامین', 'سارا', 'علی', 'مینا', 'حسین', 'نیلوفر', 'امیر', 'پریسا',
  'محمد', 'شادی', 'رضا', 'مریم', 'دانیال', 'یاسمین', 'کامران', 'الهام',
  'پویا', 'نازنین', 'مهدی', 'زهرا', 'آرش', 'سمیرا', 'بهرام', 'لیلا',
  'کیان', 'مهسا', 'فرهاد', 'نرگس', 'سینا', 'آیدا', 'امیرحسین', 'ترانه',
  'بابک', 'گلناز', 'پیمان', 'شیما', 'آرمان', 'هانیه', 'سهیل', 'مبینا',
  'کاوه', 'رؤیا', 'نیما', 'پگاه', 'سروش', 'نیلو', 'آرین', 'مونا',
  'پارسا', 'الناز',
];

const PERSONA_LAST_INITIALS = ['م', 'ر', 'ک', 'ح', 'ا', 'س', 'ن', 'پ', 'ز', 'ف'];

function getAvatarUrl(name: string, seed: number): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128&bold=true&format=png&seed=${seed}`;
}

function slugifyUsername(base: string, suffix: string): string {
  const latin = base
    .replace(/\s+/g, '')
    .replace(/[^\w.-]/g, '')
    .toLowerCase();
  return `${latin || 'user'}_${suffix}`.slice(0, 30);
}

async function main() {
  const count = parseInt(process.argv[2] || '50', 10);
  const password = await bcrypt.hash(nanoid(32), 10);

  console.log(`Creating up to ${count} comment personas...`);

  let created = 0;
  for (let i = 0; i < count; i++) {
    const firstName = PERSONA_FIRST_NAMES[i % PERSONA_FIRST_NAMES.length]!;
    const lastInitial = PERSONA_LAST_INITIALS[i % PERSONA_LAST_INITIALS.length]!;
    const displayName = `${firstName} ${lastInitial}.`;
    const userId = nanoid();
    const email = `persona+${userId.slice(0, 12)}@internal.wibe.local`;
    const username = slugifyUsername(firstName, userId.slice(0, 6));
    const avatarUrl = getAvatarUrl(displayName, i + 1);

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
