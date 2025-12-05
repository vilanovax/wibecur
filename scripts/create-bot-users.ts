import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

// رندوم آواتار از UI Avatars
function getRandomAvatar(name: string): string {
  const randomSeed = Math.floor(Math.random() * 1000);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128&bold=true&format=png`;
}

// نام‌های رندوم فارسی برای bot ها
const botNames = [
  'رامین', 'سارا', 'علی', 'مینا', 'حسین', 'نیلوفر', 'امیر', 'پریسا',
  'محمد', 'شادی', 'رضا', 'مریم', 'دانیال', 'یاسمین', 'کامران'
];

async function main() {
  console.log('🤖 Creating 15 bot users...');

  const password = '123456';
  const hashedPassword = await bcrypt.hash(password, 10);

  const botUsers = [];

  for (let i = 0; i < 15; i++) {
    const name = botNames[i] || `Bot${i + 1}`;
    const email = `bot${i + 1}@wibecur.com`;
    const avatar = getRandomAvatar(name);

    try {
      // Check if user already exists
      const existing = await prisma.users.findUnique({
        where: { email },
      });

      if (existing) {
        console.log(`⚠️  User ${email} already exists, skipping...`);
        continue;
      }

      const user = await prisma.users.create({
        data: {
          id: nanoid(),
          name: `${name} (Bot)`,
          email,
          password: hashedPassword,
          image: avatar,
          role: 'USER',
          emailVerified: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      botUsers.push(user);
      console.log(`✅ Created bot user: ${user.email} (${user.name})`);
    } catch (error: any) {
      console.error(`❌ Error creating user ${email}:`, error.message);
    }
  }

  console.log(`\n✨ Successfully created ${botUsers.length} bot users!`);
  console.log('📧 All bot users have password: 123456');
  console.log('📋 Bot users email format: bot1@wibecur.com to bot15@wibecur.com');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

