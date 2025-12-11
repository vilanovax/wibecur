import { prisma } from '../lib/prisma';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'wibecur-encryption-key-32chars';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
    iv
  );
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

async function setupLiaraStorage() {
  try {
    console.log('Setting up Liara Object Storage configuration...\n');

    // Get configuration from user
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const question = (query: string): Promise<string> => {
      return new Promise((resolve) => {
        readline.question(query, resolve);
      });
    };

    console.log('Please enter your Liara Object Storage credentials:');
    console.log('(You can find these in your Liara dashboard under Object Storage)\n');

    const endpoint = await question('Endpoint (e.g., https://storage.iran.liara.space): ');
    const bucketName = await question('Bucket Name: ');
    const accessKeyId = await question('Access Key ID: ');
    const secretAccessKey = await question('Secret Access Key: ');

    readline.close();

    if (!endpoint || !bucketName || !accessKeyId || !secretAccessKey) {
      console.error('\n❌ All fields are required!');
      process.exit(1);
    }

    console.log('\n📝 Saving configuration to database...');

    // Save encrypted credentials to database
    await prisma.settings.upsert({
      where: { key: 'liara_object_storage' },
      update: {
        value: JSON.stringify({
          endpoint: endpoint.trim(),
          bucketName: bucketName.trim(),
          accessKeyId: encrypt(accessKeyId.trim()),
          secretAccessKey: encrypt(secretAccessKey.trim()),
        }),
      },
      create: {
        key: 'liara_object_storage',
        value: JSON.stringify({
          endpoint: endpoint.trim(),
          bucketName: bucketName.trim(),
          accessKeyId: encrypt(accessKeyId.trim()),
          secretAccessKey: encrypt(secretAccessKey.trim()),
        }),
      },
    });

    console.log('\n✅ Liara Object Storage configured successfully!');
    console.log(`   Endpoint: ${endpoint}`);
    console.log(`   Bucket: ${bucketName}`);
    console.log('\nYou can now upload images to Liara Object Storage.');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupLiaraStorage();
