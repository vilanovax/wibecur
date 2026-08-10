#!/usr/bin/env node
/**
 * دانلود بنرهای دسته از Wikimedia Commons به public/images/banners/
 * اجرا: node scripts/download-category-banners.mjs
 * سپس: node scripts/optimize-banner-images.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '../public/images/banners');
const UA = 'WibeApp/1.0 (category-banners; +https://github.com/vilanovax/wibecur)';

/** منبع: Wikimedia Commons — مجوز آزاد، در ایران بدون VPN */
const BANNERS = [
  {
    name: 'books',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Bookshelf_Prunksaal_OeNB_Vienna_AT_matl00786ch.jpg',
  },
  {
    name: 'personal-development',
    url: 'https://upload.wikimedia.org/wikipedia/commons/d/da/A_journal_writing_book.jpg',
  },
  {
    name: 'movies',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Sundance_Film_Festival_2024_-_Mitzi_Akaha-104A3329.jpg',
  },
  {
    name: 'cafe',
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/45/A_small_cup_of_coffee.JPG',
  },
  {
    name: 'restaurant',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg',
  },
  {
    name: 'podcast',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/60/Microphone_in_SPNN_Podcast_studio.jpg',
  },
  {
    name: 'travel',
    url: 'https://upload.wikimedia.org/wikipedia/commons/a/aa/Suitcase_BW_2025-08-17_14-54-11.jpg',
  },
  {
    name: 'lifestyle',
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/17/Yoga_TTC_in_Rishikesh.jpg',
  },
  {
    name: 'car',
    url: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Abandoned_car_in_Marine_Park_%2810852p%29.jpg',
  },
  {
    name: 'philosophy',
    url: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Part_of_a_bookshelf_containing_books_by_Aristotle_%281%29.jpg',
  },
  {
    name: 'cozy',
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Journaling_over_coffee_%28Unsplash%29.jpg',
  },
  {
    name: 'history',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Old_books_%281%29.jpg',
  },
  {
    name: 'mystery',
    url: 'https://upload.wikimedia.org/wikipedia/commons/d/dc/Bookcase_in_Olten.jpg',
  },
  {
    name: 'fantasy',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Public_bookcase_Stadtgarten_Ettlingen.jpg',
  },
  {
    name: 'movies-2',
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/37/Cinema_seats_in_blue.jpg',
  },
  {
    name: 'movies-3',
    url: 'https://upload.wikimedia.org/wikipedia/commons/d/db/Cinema_Seats_I_%2851830912465%29.jpg',
  },
  {
    name: 'movies-4',
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Commodore_Cinema%2C_Stanley_Road.jpg',
  },
  {
    name: 'movies-5',
    url: 'https://upload.wikimedia.org/wikipedia/commons/d/d2/Popcorn_in_cinema_IMG_7715.jpg',
  },
  {
    name: 'movies-6',
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/33/Clapperboard%2C_O2_film%2C_September_2008.jpg',
  },
  {
    name: 'books-2',
    url: 'https://upload.wikimedia.org/wikipedia/commons/d/dc/Bookcase_in_Olten.jpg',
  },
  {
    name: 'books-3',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Public_bookcase_Stadtgarten_Ettlingen.jpg',
  },
  {
    name: 'books-4',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Old_books_%281%29.jpg',
  },
  {
    name: 'cafe-2',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/61/Latte_macchiato_with_coffee_beans.jpg',
  },
  {
    // منظره/تراس کافه — متمایز از cozy (میز مطالعه)؛ برای cafes-with-great-views
    name: 'cafe-3',
    url: 'https://upload.wikimedia.org/wikipedia/commons/0/09/Sm%C3%BAz_Caf%C3%A9_outdoor_terrace%2C_Hungarian_Parliament_view.jpg',
  },
  {
    name: 'restaurant-2',
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Typical_Greek_food_in_the_restaurant.jpg',
  },
  {
    name: 'restaurant-3',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg',
  },
  {
    name: 'default',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Bookshelf_Prunksaal_OeNB_Vienna_AT_matl00786ch.jpg',
  },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function downloadOne(name, url) {
  const out = path.join(OUT_DIR, `${name}.jpg`);
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'image/*' },
    redirect: 'follow',
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${name}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 10_000) {
    throw new Error(`File too small (${buf.length} bytes) for ${name} — likely rate-limited`);
  }
  fs.writeFileSync(out, buf);
  return buf.length;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const pending = BANNERS.filter(({ name }) => {
    const out = path.join(OUT_DIR, `${name}.jpg`);
    if (!fs.existsSync(out)) return true;
    const stat = fs.statSync(out);
    return stat.size < 10_000;
  });
  console.log(`Downloading ${pending.length}/${BANNERS.length} banners → ${OUT_DIR}\n`);

  let ok = 0;
  let fail = 0;

  for (const { name, url } of pending) {
    try {
      const size = await downloadOne(name, url);
      console.log(`✓ ${name}.jpg (${(size / 1024).toFixed(0)} KB)`);
      ok++;
    } catch (e) {
      console.error(`✗ ${name}: ${e.message}`);
      fail++;
    }
    await sleep(6000);
  }

  console.log(`\nDone: ${ok} ok, ${fail} failed`);
  if (fail > 0 && ok === 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
