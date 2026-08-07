# Consumer Design Tokens — استاندارد و چک‌لیست

زبان طراحی واحد برای UI مصرف‌کننده (نه ادمین).  
منبع حقیقت: `DESIGN.md` · `lib/design-tokens.ts` · `app/globals.css` · پیش‌نمایش [`/design-system`](/design-system).

---

## زبان طراحی (خلاصه)

| محور | قانون |
|------|--------|
| جهت / فونت | RTL فارسی · Vazirmatn |
| Primary | Indigo `#6366F1` — CTA، لینک فعال، ویژه |
| Hot / trend | Amber `#F59E0B` (`warning` / `hot`) — نه بنفش |
| Surfaces | `background` سفید · `surface` `#F8FAFC` · `card` سفید · `border` slate-200 |
| متن | `foreground` / `wibe-secondary` — نه `text-gray-*` |
| تم | **Light-only** — کلاس `.dark` روی `<html>` نزن |
| شعاع | 8 / 14 / 20 / 28 / pill — کارت‌ها معمولاً `rounded-2xl` |
| سایه | `shadow-vibe-sm` / `card` / `hero` / `floating` |
| فوکوس | `focus-visible:ring-2 focus-visible:ring-primary/30` |

---

## کلاس‌های نقش‌محور (اجباری در کار جدید)

| نقش | کلاس |
|-----|------|
| Display | `wibe-display` |
| عنوان | `wibe-h1` … `wibe-h3` |
| بدنه | `wibe-body` |
| ثانویه | `wibe-small` |
| متا | `wibe-caption` |
| سطح | `bg-wibe-surface` · `bg-wibe-card` · `border-wibe` · `text-wibe-secondary` |

**ممنوع در consumer جدید:** `text-[11px]` / `text-[10px]` / `text-[1.65rem]` · `text-gray-*` · `bg-gray-50/100` برای سطح UI · گرادیان بنفش تزئینی.

---

## جدول مهاجرت (جایگزینی امن)

| قدیمی | جدید |
|-------|------|
| `text-gray-400` … `text-gray-600` | `text-wibe-secondary` |
| `text-gray-700` … `text-gray-900` | `text-foreground` |
| `bg-gray-50` / `bg-gray-100` | `bg-wibe-surface` |
| `bg-gray-200` (اسکلتون / placeholder) | `bg-wibe-surface` |
| `hover:bg-gray-50` / `100` | `hover:bg-wibe-surface` |
| `border-gray-200` / `300` | `border-wibe` |
| `rounded-lg` کارت اصلی | ترجیحاً `rounded-2xl` |
| `violet-*` / `purple-*` accent ترند | `primary` یا `warning` |

**لمس نکن (عمداً تیره):** `bg-gray-800/900` روی هیرو/پوستر فیلم، متن سفید روی گرادیان تصویر.

---

## Primitives ترجیحی

| کامپوننت | مسیر |
|----------|------|
| `WibeButton` | `components/ui/WibeButton.tsx` |
| `WibeSection` | `components/ui/WibeSection.tsx` |
| `WibeCard` | `components/ui/WibeCard.tsx` |
| `WibeEmptyState` | `components/shared/WibeEmptyState.tsx` |
| Badge لیست | `lib/list-badge-styles.ts` |
| عنوان سکشن دسته | `CategorySectionTitle` + `iconVariant` |

---

## چک‌لیست PR (consumer)

- [ ] تایپ فقط با `wibe-*` / `text-h1`…`text-caption` (نه `text-[Npx]`)
- [ ] سطح‌ها با `wibe-surface` / `wibe-card` / `border-wibe`
- [ ] ترند = amber · CTA = indigo
- [ ] `focus-visible` روی کنترل‌های جدید
- [ ] بدون گرادیان بنفش تزئینی
- [ ] RTL: `start`/`end` به‌جای `left`/`right` وقتی منطقی است
- [ ] `npm run audit:design-tokens` — تعداد نقض نسبت به baseline کم شده یا ثابت مانده

---

## آدیت

```bash
npm run audit:design-tokens
```

اسکریپت: `scripts/audit-consumer-design-tokens.mjs`  
محدوده: `app/` (غیر admin/api) · `components/mobile` · `shared` · `category` · `profile` · `ui`

### Baseline (۲۰۲۶-۰۸-۰۷ · قبل از موج ۱)

| الگو | تعداد تقریبی |
|------|----------------|
| `bg-gray-*` | ~۵۰۴ |
| `border-gray-*` | ~۱۳۲ |
| `text-[Npx\|rem]` | ~۱۱۲ |
| `text-gray-*` | ~۱۰۱ |
| `hover:bg-gray-*` | ~۸۶ |
| violet/purple | ~۳۲ |
| فایل دارای نقض | ~۱۸۳ |

### بعد از موج ۱ (همین PR)

| الگو | تقریبی |
|------|--------|
| `bg-gray-*` | ~۳۷۳ (−۱۳۱) |
| `border-gray-*` | ~۱۱۷ |
| `hover:bg-gray-*` | ~۶۴ |
| violet/purple | ~۲۱ |
| فایل دارای نقض | ~۱۶۵ |

موج ۱ شامل: layout (Header/BottomNav/Notification) · اسکلتون‌ها · Search overlay · ConfirmDialog · Comment sections · Item action buttons.

---

## موج‌های مهاجرت

| موج | محدوده | وضعیت |
|-----|--------|--------|
| ۰ | توکن + DESIGN.md + /design-system + Impeccable hook | ✅ موجود |
| ۱ | Doc + audit script + layout/skeletons/shared chrome | این PR |
| ۲ | Home / Lists / Explore / Category hub (light) | بعدی |
| ۳ | Item / Profile / Comments / Suggest forms | بعدی |
| ۴ | Film legacy dark sections (با احتیاط contrast) | بعدی |
| — | Admin | خارج از scope (توکن جدا در `lib/admin/design-system`) |

---

## ارتباط با اسناد دیگر

- `DESIGN.md` — brief محصول/زیبایی
- `docs/UI_POLISH_PHASES.md` — تاریخچه فازهای ۱–۴ polish
- این سند — **قرارداد اجرایی** برای کار جدید و مهاجرت
