# UI Polish — مستندات ۴ فاز

این سند تغییرات **Consumer UI polish** (فازهای ۱ تا ۴) را جمع‌بندی می‌کند. منبع حقیقت توکن‌ها: `lib/design-tokens.ts` و `app/globals.css`. نمایش زنده: [`/design-system`](/design-system).

---

## خلاصه اهداف

| فاز | اولویت | هدف |
|-----|--------|-----|
| ۱ | P0 | یکدست‌سازی accent، UX صفحه آیتم، primitiveهای پایه |
| ۲ | P1 | `ListRowCompact`، محدودیت emoji، آیکن سکشن |
| ۳ | P2 | تایپوگرافی/chip، fade اسکرول افقی، صفحه design-system |
| ۴ | محتوا | منطق انتخاب لیست در کارت‌های «حال‌وهوا» |

---

## فاز ۱ — P0

### ۱.۱ رنگ accent و badge لیست

**قانون:** ترند / وایرال / داغ → **amber** (`warning` / `hot`). **Indigo** (`primary`) فقط برای CTA و «ویژه».

**توکن جدید:**
- `semantic.hot` در `lib/design-tokens.ts` (= `#F59E0B`)
- CSS: `--color-hot`
- Tailwind: `hot`, `text-warning`, `bg-warning`

**فایل مشترک badge:**
- `lib/list-badge-styles.ts`
  - `LIST_BADGE_LABELS`, `listBadgeSolidStyles`, `listBadgeSoftStyles`
  - `listBadgeLabel()`, `listBadgeSolidClass()`

**فایل‌های به‌روز شده:**
- `components/mobile/home/ListCard.tsx`
- `components/mobile/curated/CuratedGridCard.tsx`
- `app/lists/[slug]/ListDetailClient.tsx`
- `components/mobile/profile/tabs/RecentActivityTab.tsx` — dot/accent ایجاد لیست: `primary` (نه بنفش)
- `components/shared/list-entries/LightweightEntryRow.tsx` — برچسب fact type: خاکستری
- `components/mobile/items/ItemHeroServer.tsx` — fact label: خاکستری؛ گرادیان بدون violet
- `components/mobile/lists/ItemPreviewSheet.tsx` — fact label: خاکستری

### ۱.۲ صفحه آیتم (`/items/[id]`)

| تغییر | فایل | جزئیات |
|-------|------|--------|
| حذف pill تکراری پسند/ذخیره (موبایل) | `ItemMetadataServer.tsx` | شمارش فقط روی دکمه‌های اکشن |
| اشتراک از پوستر به ردیف اکشن | `ItemHeroServer.tsx`, `ItemDetailTopActions.tsx` | prop جدید `shareTitle` |
| حذف پنل «آمار» تکراری (دسکتاپ) | `ItemDetailClient.tsx` | سایدبار فقط لیست + نظرات |
| breadcrumb فقط دسکتاپ | `ItemPageBreadcrumb.tsx` | `hidden lg:block` |

### ۱.۳ Primitives

| کامپوننت | مسیر | کاربرد |
|----------|------|--------|
| `WibeButton` | `components/ui/WibeButton.tsx` | `primary` \| `secondary` \| `ghost` \| `outline` |
| `WibeSection` | `components/ui/WibeSection.tsx` | هدر سکشن + لینک «همه» |
| `WibeCard` | `components/ui/WibeCard.tsx` | سطح کارت با `border-wibe` |

**پایلوت:** `HomeSectionTitle` → wrapper روی `WibeSection`.

---

## فاز ۲ — P1

### ۲.۱ `ListRowCompact`

**مسیر:** `components/shared/ListRowCompact.tsx`

ردیف فشرده لیست برای سکشن‌های sparse (لیست‌های جدید، هاب، فیلم).

```tsx
<ListRowCompact
  list={categoryListCard}
  thumb="square"   // یا "poster" برای فیلم
  showCreator
  showStats
/>
```

**جایگزین شده در:**
- `CategoryNewListsSectionServer.tsx`
- `NewListsSection.tsx`
- `hub/HubNewLists.tsx`
- `film/NewListsCompact.tsx`

دسکتاپ: گرید ۲ ستونه در سکشن‌های لیست جدید.

### ۲.۲ آیکن سکشن به‌جای emoji

**مسیر:** `components/shared/SectionIcon.tsx`  
**re-export:** `components/category/CategorySectionIcon.tsx`

`CategorySectionTitle` و `WibeSection` / `HomeSectionTitle` / `ExploreSectionTitle`:

```tsx
<CategorySectionTitle title="..." iconVariant="trending" />
// icon="🔥" — deprecated
```

**Variants:** `trending`, `new`, `saved`, `location`, `viral`, `curators`, `debate`, `film`, `rising`, `bookmark`, `forYou`, `mood`

**Category/Hub/Film:** همه سکشن‌هایی که قبلاً `icon="🆕"` / `🔥` / … داشتند.

**Home:**
- `TrendingThisWeekCarousel` → `iconVariant="trending"`
- `NewAndRisingSection` → `rising`
- `HomeSavedListsSection` → `bookmark`
- `ForYouSection`, `HomePersonalizedFeedSection` → `forYou`
- `HomeMoodRowSection` → `mood`

---

## فاز ۳ — P2

### ۳.۱ کلاس‌های chip (فیلتر و pill)

در `app/globals.css` → `@layer components`:

| کلاس | معنی |
|------|------|
| `wibe-chip` | پایه pill |
| `wibe-chip-active` | حالت انتخاب‌شده (`primary`) |
| `wibe-chip-inactive` | حالت عادی |

**استفاده:** `CategoryFilterBar.tsx`

### ۳.۲ `HorizontalScrollFade`

**مسیر:** `components/shared/HorizontalScrollFade.tsx`

اسکرول افقی با fade لبه (RTL-safe با `start`/`end`).

```tsx
<HorizontalScrollFade
  surface="surface"      // surface | card | background
  fadeEnd               // پیش‌فرض true
  fadeClassName="lg:hidden"
  innerClassName="flex gap-3 ..."
  dir="rtl"
>
  {children}
</HorizontalScrollFade>
```

**استفاده شده در:**
- `QuickCategoryChips.tsx`
- `CategoryFilterBar.tsx`
- `CategoryMostSavedItemsServer.tsx`, `CategoryLatestItemsServer.tsx`
- `hub/LatestItemsSection.tsx`, `hub/MostSavedItemsCafe.tsx`
- `curated/TrendingNowSection.tsx`
- `HomeMoodRowSection.tsx`

### ۳.۳ تایپوگرافی Explore

- `ExploreSectionTitle.tsx` — `wibe-h3` یکسان، `iconVariant`
- `TrendingNowSection.tsx` — عنوان دسکتاپ: `wibe-small` به‌جای `text-base`

### ۳.۴ صفحه مرجع Design System

| مسیر | توضیح |
|------|--------|
| `app/design-system/page.tsx` | شِل صفحه |
| `app/design-system/DesignSystemShowcase.tsx` | نمایش typography، رنگ، دکمه، chip، badge، icons، `ListRowCompact`, fade |

---

## فاز ۴ — محتوای Mood (Home)

**مسیر:** `lib/home-mood-collections.ts`  
**تست:** `lib/home-mood-collections.test.ts`  
**UI:** `components/mobile/home/HomeMoodRowSection.tsx`

### منطق انتخاب لیست

| کارت | id | قانون انتخاب |
|------|-----|----------------|
| برای آخر هفته | `weekend` | فقط کافه/رستوران، فیلم، سفر — **یک لیست از هر دسته** (`pickWeekendMoodLists`) |
| کوتاه و سریع | `quick` | `itemCount ≤ 15`، تنوع دسته (`pickQuickMoodLists`) |
| تازه و داغ | `fresh` | اول `isFastRising`، بعد بقیه rising (`pickFreshMoodLists`) |

**سایر قوانین:**
- بدون تکرار لیست بین سه کارت (`used` Set)
- اولویت کاور واقعی (`coverScore` — نه placeholder)
- زیرعنوان «کوتاه و سریع»: `لیست‌های تا ۱۵ آیتم`
- نمایش `mood.subtitle` روی هر `MoodCard`
- سایدبار دسکتاپ: `SectionIcon variant="mood"` به‌جای emoji

**توابع export برای تست:**
- `pickWeekendMoodLists`
- `pickQuickMoodLists`
- `pickFreshMoodLists`
- `buildHomeMoodCollections`

---

## کلاس‌های تایپوگرافی Consumer

از `globals.css` — ترجیح بر `text-sm` / `text-gray-*` خام:

| کلاس | نقش |
|------|-----|
| `wibe-display` | نمایش بزرگ |
| `wibe-h1` … `wibe-h3` | عناوین |
| `wibe-body` | متن بدنه |
| `wibe-small` | متن ثانویه |
| `wibe-caption` | کپشن / متادیتا |

سطوح: `bg-wibe-surface`, `bg-wibe-card`, `border-wibe`, `text-wibe-secondary`

---

## فهرست فایل‌های جدید

```
app/design-system/page.tsx
app/design-system/DesignSystemShowcase.tsx
components/ui/WibeButton.tsx
components/ui/WibeSection.tsx
components/ui/WibeCard.tsx
components/shared/SectionIcon.tsx
components/shared/HorizontalScrollFade.tsx
components/shared/ListRowCompact.tsx
components/category/CategorySectionIcon.tsx
lib/list-badge-styles.ts
lib/home-mood-collections.test.ts
docs/UI_POLISH_PHASES.md
```

---

## فهرست فایل‌های تغییر یافته (۴۸ فایل)

<details>
<summary>کلیک برای لیست کامل</summary>

- `app/globals.css`
- `app/items/[id]/ItemDetailClient.tsx`
- `app/lists/[slug]/ListDetailClient.tsx`
- `components/category/*` (FilterBar, SectionTitle, NewLists, Latest/MostSaved, Trending, Viral, TopCurators, film/*, hub/*)
- `components/mobile/curated/*` (CuratedGridCard, ExploreSectionTitle, TrendingNowSection)
- `components/mobile/home/*` (ListCard, HomeSectionTitle, Mood, Saved, ForYou, Rising, Trending, QuickCategoryChips, …)
- `components/mobile/items/*` (Hero, Metadata, TopActions, Breadcrumb)
- `components/mobile/lists/ItemPreviewSheet.tsx`
- `components/mobile/profile/tabs/RecentActivityTab.tsx`
- `components/shared/list-entries/LightweightEntryRow.tsx`
- `lib/design-tokens.ts`
- `lib/home-mood-collections.ts`
- `tailwind.config.ts`

</details>

---

## راهنمای توسعه‌دهنده

### Badge لیست جدید

```ts
import { listBadgeLabel, listBadgeSolidClass } from '@/lib/list-badge-styles';

const label = listBadgeLabel('TRENDING');
const cls = listBadgeSolidClass('TRENDING');
```

### سکشن جدید در Category/Home

```tsx
import WibeSection from '@/components/ui/WibeSection';
// یا
import CategorySectionTitle from '@/components/category/CategorySectionTitle';

<CategorySectionTitle title="عنوان" subtitle="..." iconVariant="new" />
```

### اسکرول افقی chip/کارت

```tsx
import HorizontalScrollFade from '@/components/shared/HorizontalScrollFade';
```

### قوانین emoji

- **عنوان سکشن:** `iconVariant` + Lucide (نه emoji در کد جدید)
- **آیکن دسته در دیتا** (`categories.icon`): مجاز — از DB می‌آید
- **Mood card** (`🌙` `⚡` `✨`): هنوز در `home-mood-collections` — اختیاری برای فاز بعد

---

## تست و build

```bash
npx tsc --noEmit
npm test -- lib/home-mood-collections.test.ts
npm run build
```

**نکته production:** `npm start` به Upstash/Redis نیاز ندارد.

---

## کارهای پیشنهادی بعدی (خارج از scope این ۴ فاز)

- مهاجرت بقیه سکشن‌های legacy (`text-gray-*`) به `wibe-*`
- حذف کامل emoji از عنوان سکشن‌ها در film hub قدیمی
- استفاده گسترده‌تر از `WibeButton` / `WibeCard` در List/Profile
- همگام‌سازی `UI_UX_DESIGN.md` با مقادیر واقعی `design-tokens.ts`

---

*آخرین به‌روزرسانی: فازهای ۱–۴ consumer UI polish — branch `feat/admin-dashboard-ux` (uncommitted at doc time).*
