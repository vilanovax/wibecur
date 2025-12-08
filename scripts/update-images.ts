import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Generate unique picsum.photos URLs
function generatePicsumUrl(id: number, width: number = 800, height: number = 600): string {
  return `https://picsum.photos/id/${id}/${width}/${height}`;
}

async function updateImages() {
  console.log('Starting image update...\n');

  // Get all items with placeholder images
  const items = await prisma.items.findMany({
    where: {
      OR: [
        { imageUrl: { contains: 'via.placeholder.com' } },
        { imageUrl: { contains: 'placeholder' } },
      ]
    }
  });

  console.log(`Found ${items.length} items with placeholder images`);

  // Update items with unique picsum IDs
  let imageId = 10; // Start from ID 10 for variety
  for (const item of items) {
    await prisma.items.update({
      where: { id: item.id },
      data: { imageUrl: generatePicsumUrl(imageId, 800, 600) }
    });
    console.log(`Updated item: ${item.title} -> picsum ID ${imageId}`);
    imageId += 3; // Skip some IDs for more variety
  }

  // Get all suggested items with placeholder images
  const suggestedItems = await prisma.suggested_items.findMany({
    where: {
      OR: [
        { imageUrl: { contains: 'via.placeholder.com' } },
        { imageUrl: { contains: 'placeholder' } },
      ]
    }
  });

  console.log(`\nFound ${suggestedItems.length} suggested items with placeholder images`);

  for (const item of suggestedItems) {
    await prisma.suggested_items.update({
      where: { id: item.id },
      data: { imageUrl: generatePicsumUrl(imageId, 800, 600) }
    });
    console.log(`Updated suggested item: ${item.title} -> picsum ID ${imageId}`);
    imageId += 3;
  }

  // Update any remaining items with null/empty images to have nice defaults
  const itemsWithoutImages = await prisma.items.findMany({
    where: {
      OR: [
        { imageUrl: null },
        { imageUrl: '' }
      ]
    }
  });

  console.log(`\nFound ${itemsWithoutImages.length} items without images`);

  for (const item of itemsWithoutImages) {
    await prisma.items.update({
      where: { id: item.id },
      data: { imageUrl: generatePicsumUrl(imageId, 800, 600) }
    });
    console.log(`Added image to item: ${item.title} -> picsum ID ${imageId}`);
    imageId += 3;
  }

  console.log('\n✅ Image update completed!');
  console.log(`Total images updated: ${items.length + suggestedItems.length + itemsWithoutImages.length}`);
}

updateImages()
  .catch((e) => {
    console.error('Error updating images:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
