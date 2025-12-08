import * as fs from 'fs';
import * as path from 'path';

const seedDataPath = path.join(__dirname, '../prisma/seed-data.json');

// Generate unique picsum.photos URLs
function generatePicsumUrl(id: number, width: number = 800, height: number = 600): string {
  return `https://picsum.photos/id/${id}/${width}/${height}`;
}

function updateSeedImages() {
  console.log('Reading seed-data.json...');

  const seedData = JSON.parse(fs.readFileSync(seedDataPath, 'utf-8'));

  let imageId = 10;
  let updatedCount = 0;

  // Update items
  if (seedData.items) {
    for (const item of seedData.items) {
      if (item.imageUrl && (item.imageUrl.includes('via.placeholder.com') || item.imageUrl.includes('placeholder'))) {
        item.imageUrl = generatePicsumUrl(imageId);
        imageId += 3;
        updatedCount++;
      }
    }
    console.log(`Updated ${updatedCount} items`);
  }

  // Update suggested_items
  let suggestedCount = 0;
  if (seedData.suggested_items) {
    for (const item of seedData.suggested_items) {
      if (item.imageUrl && (item.imageUrl.includes('via.placeholder.com') || item.imageUrl.includes('placeholder'))) {
        item.imageUrl = generatePicsumUrl(imageId);
        imageId += 3;
        suggestedCount++;
      }
    }
    console.log(`Updated ${suggestedCount} suggested items`);
  }

  // Write back
  fs.writeFileSync(seedDataPath, JSON.stringify(seedData, null, 2));

  console.log(`\n✅ Seed data updated!`);
  console.log(`Total images updated: ${updatedCount + suggestedCount}`);
}

updateSeedImages();
