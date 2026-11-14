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

---

## ۲) قوانین مهم محتوا (بات نباید نقض کند)

| موضوع | قانون |
|--------|--------|
| ویژه / badge / tags | نفرستید |
| انتشار | لیست تازه پیش‌فرض منتشر است |
| برداشتن فوری از سایت | همان لیست را با `isActive: false` بفرستید (بدون حذف) |
| فیلم | عنوان `English - فارسی`؛ امتیاز فقط در `metadata.imdbRating` نه داخل متن |
| کتاب | `metadata.author` اجباری؛ پادکست/اپ: `metadata.mediaType: "podcast"` یا `"app"` |
| کافه | `metadata.address` اجباری؛ `priceRange` اختیاری |
| lifestyle | فقط `tip` یا `catalog_ref` (+ `catalogItemId`)؛ یا بدون entryKind برای آیتم تازه |
| حذف / merge | از این API ممکن نیست |

---

## ۳) اصلاح یک ردیف (جای مداد پنل)

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
echo "$PREVIEW" | jq '{ok, committable, previewId, warnings}'
test "$(echo "$PREVIEW" | jq -r .committable)" = "true"

# 2) commit
curl -sS -X POST "$BASE/api/ingest/lists/commit" "${AUTH[@]}" \
  -H "Idempotency-Key: $TAG-commit" \
  -d "$(jq -n --arg p "$(echo "$PREVIEW" | jq -r .previewId)" '{previewId:$p}')" \
  | jq '{ok, list, summary}'
```

توجه: در فایل `upload.json` مقدار `"dryRun": true` باشد.

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
| `idempotency_key_required` | هدر جا افتاده | برای commit / patch / order بفرستید |
| `preview_expired` / `410` | preview کهنه | دوباره preview |
| `preview_stale` / `409` | لیست عوض شده | دوباره preview |
| `forbidden_scope` / `403` | مثلاً ویژه یا catalog_and_all | آن فیلد را برندارید |
| `order_set_mismatch` | orderedIds کامل نیست | همهٔ idهای زنده را بفرستید |

مدل و سقف فیلدها را هر بار از `GET /api/ingest/models` بخوانید، نه از حافظه.
