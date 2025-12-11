import { updateSettings } from '../lib/settings.js';

async function setLiaraConfig() {
  try {
    console.log('Setting Liara Object Storage configuration...\n');

    await updateSettings({
      liaraBucketName: 'wibe',
      liaraEndpoint: 'https://storage.c2.liara.space',
      liaraAccessKey: 'bcosaoidg7d51asb',
      liaraSecretKey: 'f97b46ee-af94-4bc8-82ef-dfb476ae5fa1',
    });

    console.log('✅ Liara Object Storage configured successfully!');
    console.log('   Endpoint: https://storage.c2.liara.space');
    console.log('   Bucket: wibe');
    console.log('\nYou can now upload images to Liara Object Storage.');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

setLiaraConfig();
