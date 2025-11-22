import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@listhub.ir' },
    update: {},
    create: {
      email: 'admin@listhub.ir',
      name: 'Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create sample categories
  const categories = [
    { name: 'فیلم و سریال', slug: 'movie', icon: '🎬', color: '#8B5CF6', order: 1 },
    { name: 'کتاب', slug: 'book', icon: '📚', color: '#F97316', order: 2 },
    { name: 'کافه و رستوران', slug: 'cafe', icon: '☕', color: '#D97706', order: 3 },
    { name: 'پادکست', slug: 'podcast', icon: '🎧', color: '#EC4899', order: 4 },
    { name: 'لایف‌استایل', slug: 'lifestyle', icon: '🌱', color: '#10B981', order: 5 },
    { name: 'ماشین و تکنولوژی', slug: 'tech', icon: '🚗', color: '#EF4444', order: 6 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  console.log('✅ Categories created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

