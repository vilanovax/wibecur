# Consumer UX — پیشرفت و جلوگیری از کار تکراری

آخرین به‌روزرسانی: **۲۰۲۶-۰۸-۰۷** · `main` @ `e68b0f1`

این سند کارهای **انجام‌شده** روی مسیر consumer را قفل می‌کند. قبل از شروع polish/a11y/token جدید، اینجا را بخوان.

منبع قدیمی‌تر polish فاز ۱–۴: [`docs/UI_POLISH_PHASES.md`](./UI_POLISH_PHASES.md)  
تصمیمات محصول قفل‌شده: [`PRODUCT.md`](../PRODUCT.md) · [`DESIGN.md`](../DESIGN.md)

---

## وضعیت کلی

| موج | موضوع | وضعیت | PR / commit |
|-----|--------|--------|-------------|
| A | خلوت Home/Lists + ناوبری + polish hero/explore | ✅ | `e3ab5e0` |
| B | overscroll / transition / a11y پایه + empty مشترک | ✅ | `80d6124` |
| C | مسیر `/explore`، redirect `/user-lists`، empties، PRODUCT/DESIGN | ✅ | `80d6124` + `#3` |
| CI | ESLint flat، soft-fail settings، e2e/nav، Prisma URL | ✅ | `edd9c68`…`3553338` |
| Dead code | حذف کامپوننت‌های مردهٔ هنوز روی gray | ✅ | `c838158` |
| Perf | defer Sentry Replay، trim home unused JS | ✅ | `a1dac19` |
| P2 | `text-gray-*` → توکن روی سطح‌های ثانویه consumer | ✅ | [#4](https://github.com/vilanovax/wibecur/pull/4) `f973c29` |
| P3 | mood sheet دسته‌ها + سیاست light-only | ✅ | [#5](https://github.com/vilanovax/wibecur/pull/5) `92fdb49` |
| Focus | `focus-visible` روی کنترل‌های پرترافیک | ✅ | [#6](https://github.com/vilanovax/wibecur/pull/6) `e68b0f1` |
| Smoke | `/` + `/explore` + mood sheet روی `localhost:3005` | ✅ | دستی، پس از merge #5/#6 |

---

## انجام‌شده — جزئیات (تکرار نکن)

### کشف و IA

- مسیر رسمی اکسپلور: **`/explore`**
- لندینگ قدیمی **`/user-lists` → ۳۰۷ به `/explore`**
- جزئیات لیست شخصی همچنان: `/user-lists/[id]` (+ add-item)
- خانه: teaser کشف به‌جای ردیف مود سنگین؛ مود اصلی روی اکسپلور
- ناو: خانه / لیست‌ها / اکسپلور / پروفایل (`consumer-nav-config`)

### Empty states

- `components/shared/WibeEmptyState.tsx` — الگوی مشترک
- مهاجرت empties پروفایل / لیست‌ها / starter روی همان الگو
- emoji خام + `text-gray-*` در emptyهای اصلی consumer حذف/جایگزین شده

### توکن رنگ consumer

- sweep ثانویه: پروفایل، کامنت، suggest، auth، آیتم‌ها → `text-foreground` / `text-wibe-secondary`
- کامپوننت‌های مردهٔ هنوز روی gray حذف شدند (`c838158`)
- **عمداً خارج از scope:** `app/admin/**`، بخش زیادی از `components/admin/**`، بعضی `components/category/**` و error pages

### Mood sheet / guided discovery

- تطبیق سخت‌تر موضوع در `lib/discovery/guided-recommendations.ts`
- تست: `lib/discovery/guided-topic-match.test.ts`
- badge/گرادیان دسته در `GuidedDiscoveryResults.tsx`
- smoke: مود «خسته‌ای؟» باز می‌شود؛ badgeها با سکشن هم‌خوان

### Light-only

- Consumer **بدون dark mode** تا اطلاع بعدی
- مستند در `PRODUCT.md` / `DESIGN.md` / `globals.css` (`color-scheme: light`)
- کلاس `.dark` روی `<html>` ست نمی‌شود؛ توکن‌های dark فقط رزرو

### a11y / focus

- Skip link، بدون قفل `maximumScale`
- AuthField: `htmlFor` / label
- Quick Now همیشه در دسترس؛ skeleton For You فقط بعد از `inView`
- `HomeResponsiveContent`: `useIsDesktop` فقط برای `aria-hidden` شاخه غیرفعال
- `focus-visible:ring` روی: AuthField، BottomNav، DesktopTopNav، HeaderActions، WibeButton، Search clear، Quick Now / Category / Guided chips، ProfilePicks note
- BottomNav inactive: `text-wibe-secondary` (نه `text-gray-500`)
- **عمداً نیمه‌کاره:** `MoodMissionCard` / `RandomSurpriseCard` / بخشی از `MoodExplorerHero` — هنوز روی outline سراسری `:focus-visible` در `globals.css` (هوک impeccable به‌خاطر watermark تزئینی `text-[Nrem]` بلاک کرد)

### CI / build

- ESLint flat config (Next 16)
- settings soft-fail وقتی DB در build در دسترس نیست
- e2e هم‌راستا با ناو/auth فعلی
- PRهای #4، #5، #6 با lint/test + e2e + lighthouse سبز merge شدند

---

## انجام‌نشده / بعدی (از اینجا ادامه بده)

اولویت پیشنهادی:

1. **CLS تصاویر consumer** — `sizes` / ابعاد روی `ImageWithFallback` و کارت‌های لیست/ترند/hero
2. **`focus-visible` روی mood cards** — بعد از تصمیم برای watermarkهای تزئینی (ignore impeccable یا جایگزینی بدون literal font-size)
3. **sweep `text-gray-*` باقی‌مانده** — عمدتاً admin + بعضی category/error (consumer تقریباً تمیز است)
4. **Deploy / smoke روی prod واقعی** — نه فقط `localhost:3005`

عمداً باز / بازنگری نکن مگر درخواست صریح:

- dark mode واقعی
- تغییر دوبارهٔ IA اکسپلور ↔ لیست‌ها
- بازنویسی empty state مشترک از صفر
- بازگرداندن کامپوننت‌های حذف‌شده در `c838158`

---

## چک‌لیست سریع قبل از PR جدید

- [ ] آیا این کار در جدول «موج» بالا ✅ است؟ → نزن دوباره
- [ ] آیا فقط admin/category را هدف گرفته‌ای؟ → از sweep consumer جدا نگه دار
- [ ] آیا فایل تحت impeccable با watermark تزئینی است؟ → اول استراتژی ignore/جایگزین، بعد edit
- [ ] بعد از merge: smoke حداقل `/` و `/explore` روی build production

---

## لینک PRهای این موج

| PR | عنوان |
|----|--------|
| [#3](https://github.com/vilanovax/wibecur/pull/3) | admin dashboard UX + مسیر consumer مرتبط |
| [#4](https://github.com/vilanovax/wibecur/pull/4) | migrate secondary consumer off `text-gray` |
| [#5](https://github.com/vilanovax/wibecur/pull/5) | mood sheet categories + light-only |
| [#6](https://github.com/vilanovax/wibecur/pull/6) | focus-visible consumer controls |
