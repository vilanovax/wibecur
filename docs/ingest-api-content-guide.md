# راهنمای API ورود داده برای تیم محتوا / بات‌ها

پایه: `https://app.wibe.ir`  
احراز هویت همهٔ درخواست‌ها:

```http
Authorization: Bearer $WIBE_INGEST_KEY
Content-Type: application/json
```

کلید را در URL نگذارید. مدل زنده همیشه از سرور خوانده شود:

```bash
curl -sS -H "Authorization: Bearer $WIBE_INGEST_KEY" \
  "$BASE/api/ingest/models" | jq .
curl -sS -H "Authorization: Bearer $WIBE_INGEST_KEY" \
  "$BASE/api/ingest/categories" | jq .
```

`BASE=https://app.wibe.ir`

---

## ۱) ساخت یا به‌روزرسانی یک لیست کامل (مسیر اصلی)

### حالت ورود: فقط افزودن (`add_only`)

| موضوع | رفتار |
|--------|--------|
| `mode` | فقط `"add_only"` مجاز است (اگر نفرستید هم همین است) |
| لیست تازه | ساخته می‌شود و آیتم‌ها اضافه می‌شوند |
| لیست موجود (همان `slug` و همان دسته) | متادیتای لیست به‌روز می‌شود؛ آیتم‌های ارسالی به **انتهای** لیست اضافه می‌شوند |
| آیتم تکراری | دوبله نمی‌شود |
| آیتم‌هایی که در JSON نیستند | از لیست **حذف نمی‌شوند** |
| جایگزینی کامل اعضا | **پشتیبانی نمی‌شود** — اگر `mode` دیگری بفرستید خطا می‌گیرید |
| پیش‌نمایش | `preview.mode`، `preview.itemCountBefore`، `preview.itemCountAfter`؛ در هر ردیف `catalogItemId` و `catalogTitle` اگر جفت شد |
| فیلد جاافتادهٔ لیست | `description` / `coverImage` / `horizontalImage` اگر نفرستید **پاک نمی‌شوند** |

### گام الف — پیش‌نمایش (هیچ‌چیز نوشته نمی‌شود)

همان JSON لیست + آیتم‌ها را بفرستید، با `dryRun: true`:

```bash
curl -sS -X POST "$BASE/api/ingest/lists" \
  -H "Authorization: Bearer $WIBE_INGEST_KEY" \
  -H "Content-Type: application/json" \
  -d @upload.json
```

نمونهٔ `upload.json`:

```json
{
  "dryRun": true,
  "mode": "add_only",
  "categorySlug": "movies",
  "list": {
    "title": "بهترین فیلم‌های اکشن",
    "slug": "best-action-movies",
    "description": "دو تا سه جمله دربارهٔ لیست.",
    "coverImage": "https://…/cover.webp",
    "horizontalImage": "https://…/banner.webp"
  },
  "items": [
    {
      "title": "Dune: Part Two - تلماسه: قسمت دو",
      "externalUrl": "https://www.imdb.com/title/tt15239678",
      "tip": "اگر یک فیلم می‌بینید، همین.",
      "metadata": { "year": 2024, "imdbRating": "8.5" }
    }
  ]
}
```

در پاسخ این‌ها را چک کنید:

| فیلد | معنی |
|------|------|
| `ok` | باید `true` باشد |
| `mode` | همیشه `add_only` |
| `committable` | باید `true` باشد |
| `previewId` | برای مرحلهٔ بعد لازم است (حدود ۳۰ دقیقه اعتبار) |
| `warnings` | هشدارند؛ لیست را رد نمی‌کنند — بخوانید |
| `issues` / `error` | خطا؛ commit نکنید |

### گام ب — اجرا (نوشتن واقعی)

```bash
curl -sS -X POST "$BASE/api/ingest/lists/commit" \
  -H "Authorization: Bearer $WIBE_INGEST_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: elenor-best-action-20261114-commit" \
  -d '{"previewId":"prev_XXXX"}'
```

- `Idempotency-Key` اجباری است (۸ تا ۲۰۰ کاراکتر، یکتا برای هر کار).
- اگر همان کلید را با همان بدنه دوباره بفرستید، دوباره‌نویسی نمی‌شود.
- اگر لیست بین preview و commit عوض شده باشد: `409 preview_stale` → دوباره preview بگیرید.

### کاور و بنر و توضیح لیست

| موضوع | قانون |
|--------|--------|
| فیلدها | `list.coverImage` و `list.horizontalImage` و `list.description` |
| مقدار تصویر | فقط **نشانی مستقیم HTTP(S)** |
| شناسهٔ تصویر | لازم نیست و در مدل ingest پذیرفته نمی‌شود |
| رفتار | سرور تصویر را از همان آدرس می‌گیرد و ذخیره می‌کند |
| جاافتاده | اگر فقط `slug` و `title` بفرستید، توضیح و کاور و بنر فعلی **پاک نمی‌شوند** |
| خالی عمدی | برای پاک کردن توضیح، `description: ""` بفرستید |

### تصویر آیتم (TMDB در برابر ParsPack)

| آدرس | رفتار |
|--------|--------|
| `image.tmdb.org` + داشتن `imdbId` | هشدار می‌آید؛ در import معمولاً با پوستر OMDb جایگزین می‌شود — تصویر TMDB ارسالی شما نگه داشته نمی‌شود |
| آدرس ParsPack / فضای ذخیره‌سازی خود وایب | دست نخورده می‌ماند؛ هشدار TMDB نمی‌گیرید |
| لینک مستقیم غیر-TMDB | دانلود و ذخیره می‌شود |

### غیرفعال کردن لیست بدون فرستادن دوبارهٔ آیتم‌ها

بله. همان `slug` را با `isActive: false` بفرستید و `items` را خالی بگذارید یا اصلاً نفرستید:

```json
{
  "dryRun": true,
  "mode": "add_only",
  "categorySlug": "movies",
  "list": {
    "title": "بهترین فیلم‌های اکشن",
    "slug": "best-action-movies",
    "isActive": false
  },
  "items": []
}
```

بعد از preview موفق، commit کنید. اعضا دست نمی‌خورند؛ لیست از دید کاربر خارج می‌شود.

---

## ۲) قوانین مهم محتوا (بات نباید نقض کند)

| موضوع | قانون |
|--------|--------|
| ویژه / badge / tags | نفرستید |
| انتشار | لیست تازه پیش‌فرض منتشر است |
| برداشتن فوری از سایت | همان لیست را با `isActive: false` بفرستید (بدون حذف؛ آیتم‌ها لازم نیست) |
| فیلم | عنوان `English - فارسی`؛ امتیاز فقط در `metadata.imdbRating` نه داخل متن |
| کتاب | `metadata.author` اجباری؛ پادکست/اپ: `metadata.mediaType: "podcast"` یا `"app"` |
| کافه | `metadata.address` اجباری؛ `priceRange` اختیاری |
| lifestyle | فقط `tip` یا `catalog_ref` (+ `catalogItemId`)؛ یا بدون entryKind برای آیتم تازه |
| حذف کاتالوگ / merge | از این API ممکن نیست |
| برداشتن از یک لیست | با `DELETE` روی placement — بخش ۳ |

---

## ۳) اصلاح یا برداشتن یک ردیف (جای مداد پنل)

فقط همان ردیف لیست عوض می‌شود؛ کاتالوگ و لیست‌های دیگر نه.

```bash
curl -sS -X PATCH "$BASE/api/ingest/placements/PLACEMENT_ID" \
  -H "Authorization: Bearer $WIBE_INGEST_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: elenor-fix-tip-PLACEMENT_ID" \
  -d '{
    "scope": "placement",
    "tip": "نکتهٔ تازه",
    "imageUrl": "https://…/poster.webp"
  }'
```

خواندن یک ردیف:

```bash
curl -sS -H "Authorization: Bearer $WIBE_INGEST_KEY" \
  "$BASE/api/ingest/placements/PLACEMENT_ID" | jq .
```

`scope: "catalog_and_all"` ممنوع است و `403` می‌گیرید.

پاک‌کردن یک فیلد: همان فیلد را `null` بفرستید (کلید جاافتاده = بدون تغییر).

### برداشتن فقط از همین لیست

کاتالوگ دست نمی‌خورد؛ فقط این ردیف از لیست جدا می‌شود:

```bash
curl -sS -X DELETE "$BASE/api/ingest/placements/PLACEMENT_ID" \
  -H "Authorization: Bearer $WIBE_INGEST_KEY" \
  -H "Idempotency-Key: elenor-remove-PLACEMENT_ID"
```

در پاسخ موفق: `removed: true` و `catalogUntouched: true`.

---

## ۴) تعیین ترتیب کامل لیست

همهٔ `placementId`های زنده را به ترتیب بفرستید (نه فقط چند تا):

```bash
curl -sS -X PUT "$BASE/api/ingest/lists/LIST_ID/order" \
  -H "Authorization: Bearer $WIBE_INGEST_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: elenor-order-LIST_ID-1" \
  -d '{
    "orderedIds": ["id1", "id2", "id3"]
  }'
```

سرور order را `۰، ۱، ۲، …` می‌کند. اگر یکی جا بیفتد یا اضافه باشد → خطا.

---

## ۵) نمونهٔ روال کامل bash

```bash
#!/usr/bin/env bash
set -euo pipefail
BASE="https://app.wibe.ir"
AUTH=(-H "Authorization: Bearer $WIBE_INGEST_KEY" -H "Content-Type: application/json")
TAG="elenor-$(date +%Y%m%d)-my-list"

# 1) preview
PREVIEW=$(curl -sS -X POST "$BASE/api/ingest/lists" "${AUTH[@]}" --data @upload.json)
echo "$PREVIEW" | jq '{ok, mode, committable, previewId, warnings}'
test "$(echo "$PREVIEW" | jq -r .committable)" = "true"

# 2) commit
curl -sS -X POST "$BASE/api/ingest/lists/commit" "${AUTH[@]}" \
  -H "Idempotency-Key: $TAG-commit" \
  -d "$(jq -n --arg p "$(echo "$PREVIEW" | jq -r .previewId)" '{previewId:$p}')" \
  | jq '{ok, mode, list, summary}'
```

توجه: در فایل `upload.json` مقدار `"dryRun": true` و ترجیحاً `"mode": "add_only"` باشد.

---

## ۶) هنوز آماده نیست

این‌ها را هنوز از API بات نخواهید (فعلاً پنل / اسکریپت جدا):

- آپلود تصویر اختصاصی (`POST /images`)
- جست‌وجوی کاتالوگ با IMDb/عنوان (`catalog/lookup`)
- لاگ ممیزی بات

---

## ۷) خطاهای رایج

| کد / وضعیت | معنی | کار شما |
|------------|------|---------|
| `401` | کلید اشتباه | کلید را چک کنید |
| `idempotency_key_required` | هدر جا افتاده | برای commit / patch / delete / order بفرستید |
| `preview_expired` / `410` | preview کهنه | دوباره preview |
| `preview_stale` / `409` | لیست عوض شده | دوباره preview |
| `forbidden_scope` / `403` | مثلاً ویژه یا catalog_and_all | آن فیلد را برندارید |
| `order_set_mismatch` | orderedIds کامل نیست | همهٔ idهای زنده را بفرستید |
| پیام دربارهٔ `mode` | مقدار غیر از `add_only` | فقط `add_only` بفرستید یا حذف کنید |

مدل و سقف فیلدها را هر بار از `GET /api/ingest/models` بخوانید، نه از حافظه.
