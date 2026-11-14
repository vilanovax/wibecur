# تصمیم‌های قفل‌شدهٔ Ingest API

منبع: مشخصات `Wibe-Ingest-API-Spec.docx` + جواب‌های تیم محتوا + تصمیم‌های Rum (نوامبر ۲۰۲۶).
وضعیت: قفل کامل برای پیاده‌سازی روی `/api/ingest` و مسیر v1 بعدی.

## قطعی امنیتی / دامنهٔ بات

| # | تصمیم | رفتار سرور |
|---|--------|------------|
| A | بات `isFeatured` و `badge` تنظیم نمی‌کند | `isFeatured:true` یا `badge` غیرnull → خطا؛ در نوشتن همیشه `isFeatured=false` و `badge=null` |
| B | `scope: catalog_and_all` برای بات ممنوع | در ingest اعمال نمی‌شود؛ فقط override سطح placement |
| C | حذف کاتالوگ / merge فقط دستی؛ برداشتن از یک لیست برای بات مجاز | `DELETE /api/ingest/placements/:id` فقط همان ردیف را از لیست جدا می‌کند؛ کاتالوگ و لیست‌های دیگر دست نمی‌خورند |
| C۲ | ورود به لیست موجود فقط افزودن است | `mode: "add_only"` (پیش‌فرض و تنها مقدار)؛ جایگزینی کامل اعضا نیست |
| D | قالب عنوان فیلم `English - فارسی` | فقط هشدار |
| E | توضیح آیتم > ۳۲۰ کاراکتر | فقط هشدار (ذخیره کامل می‌ماند) |

## انتشار و نمایش (تصمیم Rum)

| # | تصمیم | رفتار سرور |
|---|--------|------------|
| ۱ | بعد از تأیید Rum، بات می‌تواند لیست را منتشر کند | `isPublic` / `isActive` پیش‌فرض `true` روی create؛ بات می‌تواند هر دو را صریحاً بفرستد |
| ۱ب | ایمنی: بات حتماً بتواند لیست را غیرفعال کند | `isActive: false` (و در صورت نیاز `isPublic: false`) بدون حذف — فوری از دید کاربر خارج می‌شود |
| ۸ | کاربر `metadata.imdbRating` را می‌بیند | در slim عمومی می‌ماند؛ امتیاز داخل متن توضیح ممنوع (هشدار) |
| ۸ب | منبع امتیاز | از دیتاست/API رسمی IMDb (مثلاً OMDb یا `title.ratings`)؛ به‌روزرسانی دوره‌ای — backlog جدا |

## قواعد محتوا (تأیید تیم محتوا + مهندسی)

| # | تصمیم | رفتار سرور |
|---|--------|------------|
| ۵ | آدرس کافه اجباری؛ نبودن `priceRange` | هشدار |
| ۶ | `cuisine` متن آزاد (حتی با `\|`) | پذیرفته |
| ۷ | شناسه‌های خارجی / منطقه / ساعت | ذخیرهٔ داخلی برای dedupe؛ در API عمومی slim نیستند |
| ۱۱ | اندازهٔ لیست (۸–۵۰، ایده‌آل ۲۰–۳۰) | فقط هشدار |
| ۱۲ | `region` / `area` / `hours` / `lat` / `lng` | اختیاری در v1 |
| ۱۳ | `author` برای کتاب اجباری؛ برای پادکست/اپ نه؛ `translator` رسمی | با `metadata.mediaType` |
| ۱۴ | فقط `tip` و `catalog_ref` در mixed | `fact` / `link` رد؛ بدون entryKind یا `new` = کاتالوگ تازه |
| ۱۵ | لینک بین‌دسته‌ای (مثلاً کافه در lifestyle) | مجاز با `catalog_ref` + `catalogItemId` |
| ۱۶ | بات تگ لیست نگذارد | `tags` غیرخالی → خطا؛ نوشتن تگ از ingest خاموش |
| ۱۷ | کاور/بنر ابعاد معیار؛ پوستر غیراستاندارد | کاور/بنر سخت‌گیرانه در مسیر تصویر؛ پوستر فقط هشدار؛ ۶۰۰×۹۰۰ OK |
| ۱۸ | وضعیت «در انتظار بررسی» | لازم نیست |

## پیاده‌سازی فعلی (MVP روی `/api/ingest`)

| قابلیت | وضعیت |
|--------|--------|
| preview با `previewId` (`dryRun:true`) | ✅ |
| commit با `POST /api/ingest/lists/commit` | ✅ |
| `Idempotency-Key` روی commit و نوشتن مستقیم | ✅ |
| stale check با `list.updatedAt` | ✅ |
| عمر preview ۳۰ دقیقه | ✅ |
| Idempotency ۲۴ ساعت | ✅ |
| PATCH placement (`scope:placement` فقط) | ✅ |
| DELETE placement (فقط از همین لیست) | ✅ |
| DELETE تو در تو `/lists/{id}/placements/{id}` + dryRun + before/after | ✅ |
| GET list برای بات (بدون کش؛ غیرفعال/خصوصی OK) | ✅ |
| `mode: add_only` صریح روی POST lists | ✅ |
| پیش‌نمایش: `itemCountBefore` / `itemCountAfter` + `catalogItemId`/`catalogTitle` | ✅ |
| فیلد سریال: `metadata.tmdbId` / `creator` / `episodes` | ✅ |
| PUT list order (`orderedIds` → ۰..n−۱) | ✅ |
| catalog lookup / images / audit | هنوز نه |

## Backlog مرتبط

- Job دوره‌ای برای هم‌خوان‌سازی `imdbRating` از دیتاست رسمی IMDb برای آیتم‌هایی که `imdbId` دارند.
- بقیهٔ endpointهای مشخصات (placement، order، catalog lookup، images، audit، `/api/v1`).
