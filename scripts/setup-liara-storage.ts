import { prisma } from '../lib/prisma';
import { getSettings, updateSettings } from '../lib/settings';

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

    await getSettings();
    await updateSettings({
      liaraEndpoint: endpoint.trim(),
      liaraBucketName: bucketName.trim(),
      liaraAccessKey: accessKeyId.trim(),
      liaraSecretKey: secretAccessKey.trim(),
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
