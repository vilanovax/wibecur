# طراحی UI/UX

> **پیاده‌سازی Consumer (فازهای ۱–۴):** [`docs/UI_POLISH_PHASES.md`](docs/UI_POLISH_PHASES.md)  
> **مرجع زنده:** `/design-system` — **توکن‌های کد:** `lib/design-tokens.ts`, `app/globals.css`

## 🎨 Design System

### رنگ‌بندی (Color Palette)

#### Primary Colors
- **Primary**: `#6366F1` (Indigo) — CTA، دکمه اصلی، «ویژه»
- **Primary Dark**: `#4F46E5` — hover states
- **Primary Light**: `#818CF8` — backgrounds

#### Secondary Colors (Legacy — کم‌کاربرد در Consumer)
- **Secondary**: `#8B5CF6` (Purple) — legacy؛ در UI consumer برای ترند استفاده نشود
- **Accent**: `#EC4899` (Pink) — highlights

#### Consumer semantic (Wibe)
- **Surface**: `#F8FAFC` — `bg-wibe-surface`
- **Card**: `#FFFFFF` — `bg-wibe-card`
- **Border**: `#E2E8F0` — `border-wibe`
- **Text secondary**: `#64748B` — `text-wibe-secondary`

#### Semantic Colors
- **Success**: `#10B981` (Green) — badge «جدید»
- **Warning / Hot**: `#F59E0B` (Amber) — ترند، وایرال، داغ
- **Error**: `#EF4444` (Red)
- **Info**: `#3B82F6` (Blue)

#### قانون accent (فاز ۱)
| معنا | رنگ |
|------|-----|
| ترند / وایرال / داغ | `warning` / `hot` |
| CTA / ویژه / primary action | `primary` |
| metadata / fact type | `gray` / `wibe-secondary` |

---

### تایپوگرافی (Typography)

**Consumer — کلاس‌های آماده** (`app/globals.css`):

| کلاس | کاربرد |
|------|--------|
| `wibe-display` | Hero بزرگ |
| `wibe-h1` … `wibe-h3` | عناوین |
| `wibe-body` | پاراگراف |
| `wibe-small` | توضیح ثانویه |
| `wibe-caption` | متادیتا، آمار |

فونت: **Vazirmatn** (`--font-vazirmatn`). از `text-sm` / `text-gray-500` خام در کد جدید پرهیز شود.

#### Font Family (مرجع)
- **Primary**: Vazirmatn / Vazir (RTL)

#### Font Sizes (legacy doc — مقادیر Tailwind در `lib/design-tokens.ts`)
- **H1**: 32px / 2rem (Mobile) | 48px / 3rem (Desktop)
- **H2**: 24px / 1.5rem (Mobile) | 36px / 2.25rem (Desktop)
- **H3**: 20px / 1.25rem (Mobile) | 24px / 1.5rem (Desktop)
- **H4**: 18px / 1.125rem
- **Body**: 16px / 1rem
- **Small**: 14px / 0.875rem
- **Tiny**: 12px / 0.75rem

#### Font Weights
- **Light**: 300
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

---

### Spacing System
- **Base Unit**: 4px
- **Scale**: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96

---

### Border Radius
- **Small**: 4px
- **Medium**: 8px
- **Large**: 12px
- **XLarge**: 16px
- **Full**: 9999px (برای دکمه‌های گرد)

---

### Shadows
```css
/* Small */
box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* Medium */
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

/* Large */
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

/* XLarge */
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

---

## 📱 صفحات موبایل

### صفحه اصلی (Home)

#### Layout Structure
```
┌─────────────────────────┐
│      Header             │  ← جستجو + آیکون پروفایل
├─────────────────────────┤
│   Hero Section          │  ← جستجوی سریع
├─────────────────────────┤
│   پیشنهادات برای شما    │  ← Horizontal Scroll
│   [Card] [Card] [Card]  │
├─────────────────────────┤
│   لیست‌های ترند          │  ← Horizontal Scroll
│   [Card] [Card] [Card]  │
├─────────────────────────┤
│   دسته‌بندی‌ها            │  ← Grid 2x3
│   [🎬] [📚] [☕]        │
│   [🚗] [🎧] [🌱]        │
├─────────────────────────┤
│   لیست‌های جدید          │  ← Vertical List
│   [Card]                │
│   [Card]                │
└─────────────────────────┘
      Bottom Nav
```

#### Components

**Hero Section**
- جستجوی بزرگ و برجسته
- دکمه "جستجو" با آیکون
- پیشنهادات جستجو (اختیاری)

**Recommendation Card**
```
┌─────────────────────┐
│  [Cover Image]      │  ← 16:9 Aspect Ratio
│                     │
├─────────────────────┤
│ عنوان لیست          │  ← Bold, 18px
│ توضیحات کوتاه...    │  ← Regular, 14px, 2 lines
├─────────────────────┤
│ 🏷️ 10 آیتم  ❤️ 234 │  ← Stats
└─────────────────────┘
```

**Category Card**
```
┌──────────┐
│   🎬     │  ← Icon, 48px
│          │
│  فیلم    │  ← Text, 14px
└──────────┘
```

---

### صفحه جزئیات لیست (List Detail)

#### Layout Structure
```
┌─────────────────────────┐
│  ← Back    Share  ⭐    │  ← Header with Actions
├─────────────────────────┤
│  [Cover Image]          │  ← Full Width, 200px height
│                         │
├─────────────────────────┤
│  عنوان لیست             │  ← H1, Bold
│  توضیحات کامل...        │  ← Body, 2-3 lines
│  🏷️ Tag1  🏷️ Tag2      │  ← Tags
├─────────────────────────┤
│  📊 آمار                │
│  👁️ 1.2K  ⭐ 89  ❤️ 234│
├─────────────────────────┤
│  [Filter Button]        │  ← اگر آیتم‌ها زیاد باشند
├─────────────────────────┤
│  ┌───────────────────┐  │
│  │ [Item Image]      │  │  ← Item Card
│  │ #1  عنوان آیتم    │  │
│  │ توضیحات...        │  │
│  │ ❤️ 120  ⭐ 45     │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ [Item Image]      │  │
│  │ #2  عنوان آیتم    │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

#### Item Card in List
```
┌─────────────────────────┐
│  #1                     │  ← Rank Badge
│  ┌──────┐  عنوان آیتم   │  ← Image + Title
│  │ Image│  توضیحات کوتاه│  ← Description (1 line)
│  └──────┘  ❤️ 120  ⭐ 45│  ← Stats
└─────────────────────────┘
```

---

### صفحه جزئیات آیتم (Item Detail)

#### Layout Structure
```
┌─────────────────────────┐
│  ← Back          Share  │
├─────────────────────────┤
│  [Large Image]          │  ← Full Width, 300px
│                         │
├─────────────────────────┤
│  عنوان آیتم             │  ← H1
│  توضیحات کامل...        │  ← Body, Multi-line
├─────────────────────────┤
│  📅 2025  🎭 عاشقانه    │  ← Metadata
│  🌍 تهران  💭 رمانتیک   │
├─────────────────────────┤
│  📊 آمار                │
│  👁️ 500  ⭐ 45  ❤️ 120 │
├─────────────────────────┤
│  [❤️ Like] [⭐ Bookmark]│  ← Action Buttons
│  [🔗 External Link]     │
├─────────────────────────┤
│  در این لیست‌ها:         │
│  • لیست ۱               │
│  • لیست ۲               │
├─────────────────────────┤
│  آیتم‌های مشابه          │  ← Horizontal Scroll
│  [Card] [Card] [Card]  │
└─────────────────────────┘
```

---

### صفحه جستجو (Search)

#### Layout Structure
```
┌─────────────────────────┐
│  [Search Input]     ✕   │  ← Search Bar
├─────────────────────────┤
│  [Filter Button]        │  ← Open Filter Sheet
├─────────────────────────┤
│  نتایج جستجو (۱۵۰)      │  ← Result Count
├─────────────────────────┤
│  ┌───────────────────┐  │
│  │ [List Card]       │  │  ← List Results
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ [Item Card]       │  │  ← Item Results
│  └───────────────────┘  │
└─────────────────────────┘
```

#### Filter Bottom Sheet
```
┌─────────────────────────┐
│  ───                    │  ← Drag Handle
│  فیلترها                 │  ← Title
├─────────────────────────┤
│  دسته‌بندی                │
│  [ ] فیلم  [✓] کتاب     │  ← Checkboxes
├─────────────────────────┤
│  شهر                     │
│  [Dropdown]             │
├─────────────────────────┤
│  سال                     │
│  [2020] [2021] [2022]   │  ← Chips
├─────────────────────────┤
│  [Reset]  [Apply]       │  ← Action Buttons
└─────────────────────────┘
```

---

### صفحه پروفایل (Profile)

#### Layout Structure
```
┌─────────────────────────┐
│  [Avatar]               │  ← Profile Header
│  نام کاربر              │
│  user@example.com       │
│  📊 5 لیست  ⭐ 23       │  ← Stats
├─────────────────────────┤
│  [Settings Icon]        │  ← Settings Button
├─────────────────────────┤
│  [Tabs]                 │
│  لیست‌های من | بوکمارک‌ها │
├─────────────────────────┤
│  ┌───────────────────┐  │
│  │ [List Card]       │  │  ← Content based on Tab
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ [List Card]       │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

---

## 🖥️ صفحات ادمین (Desktop)

### Layout کلی

```
┌─────────────────────────────────────────┐
│  Logo  [Menu Items]        [User Menu] │  ← Top Bar
├──────┬──────────────────────────────────┤
│      │                                  │
│ Side │      Main Content Area           │
│ Bar  │                                  │
│      │                                  │
│      │                                  │
└──────┴──────────────────────────────────┘
```

### Sidebar
- داشبورد
- لیست‌ها
- آیتم‌ها
- کاربران
- دسته‌بندی‌ها
- آنالیتیکس
- تنظیمات

### داشبورد (Dashboard)

#### Layout
```
┌─────────────────────────────────────────┐
│  آمار کلی                               │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
│  │Users│ │Lists│ │Items│ │Views│       │
│  └────┘ └────┘ └────┘ └────┘          │
├─────────────────────────────────────────┤
│  نمودار رشد                             │
│  [Line Chart]                           │
├─────────────────────────────────────────┤
│  لیست‌های ترند        فعالیت‌های اخیر   │
│  [Table]              [List]            │
└─────────────────────────────────────────┘
```

---

## 🎭 کامپوننت‌های UI

### Consumer primitives (فاز ۱–۳)

| کامپوننت | مسیر |
|----------|------|
| `WibeButton` | `components/ui/WibeButton.tsx` |
| `WibeSection` | `components/ui/WibeSection.tsx` |
| `WibeCard` | `components/ui/WibeCard.tsx` |
| `ListRowCompact` | `components/shared/ListRowCompact.tsx` |
| `HorizontalScrollFade` | `components/shared/HorizontalScrollFade.tsx` |
| `SectionIcon` | `components/shared/SectionIcon.tsx` |
| List badges | `lib/list-badge-styles.ts` |

کلاس chip: `wibe-chip`, `wibe-chip-active`, `wibe-chip-inactive`

### Button

#### Variants
- **Primary**: پس‌زمینه Primary، متن سفید
- **Secondary**: پس‌زمینه شفاف، border Primary
- **Ghost**: بدون پس‌زمینه و border
- **Danger**: پس‌زمینه قرمز

#### Sizes
- **Small**: height 32px, padding 8px 16px
- **Medium**: height 40px, padding 12px 24px
- **Large**: height 48px, padding 16px 32px

---

### Card

#### List Card
```
┌─────────────────────────┐
│  [Image 16:9]          │
│                         │
├─────────────────────────┤
│  Title (Bold, 18px)     │
│  Description (14px)     │
│  Tags: [Tag] [Tag]      │
│  Stats: 👁️ 1.2K  ⭐ 89 │
└─────────────────────────┘
```

---

### Input

#### Search Input
- Border radius: 24px (pill shape)
- Icon در سمت چپ
- Clear button در سمت راست (وقتی متن دارد)

---

### Badge

#### Rank Badge
- دایره‌ای یا مربع
- پس‌زمینه Primary
- متن سفید
- Font size: 14px, Bold

---

## 🎬 انیمیشن‌ها

### Transitions
- **Default**: 200ms ease-in-out
- **Fast**: 150ms ease-in-out
- **Slow**: 300ms ease-in-out

### Page Transitions
- **Slide**: از راست به چپ (موبایل)
- **Fade**: برای دسکتاپ

### Micro-interactions
- **Button Hover**: Scale 1.05
- **Card Hover**: Shadow افزایش
- **Like**: Heart animation (scale + bounce)
- **Bookmark**: Star fill animation

---

## 📐 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

---

## ♿ Accessibility

### Contrast Ratios
- Text on Background: حداقل 4.5:1
- Large Text: حداقل 3:1

### Focus States
- Outline: 2px solid Primary color
- Offset: 2px

### Screen Reader
- استفاده از semantic HTML
- ARIA labels برای icon-only buttons
- Alt text برای تمام تصاویر

---

## 🌙 Dark Mode

### Color Mapping
- Background: `#FFFFFF` → `#0F172A`
- Surface: `#F8FAFC` → `#1E293B`
- Text Primary: `#0F172A` → `#F8FAFC`
- Text Secondary: `#64748B` → `#94A3B8`

### Implementation
- استفاده از CSS Variables
- Toggle در Header
- ذخیره preference در localStorage

---

## 📱 PWA Design

### Splash Screen
- Logo در مرکز
- پس‌زمینه Primary color
- Animation: Fade in

### Install Prompt
- Bottom Sheet در موبایل
- Banner در دسکتاپ
- دکمه "نصب" با آیکون

---

## 🎨 Design Principles

1. **سادگی**: رابط کاربری ساده و بدون پیچیدگی
2. **وضوح**: اطلاعات به‌صورت واضح نمایش داده شوند
3. **یکپارچگی**: استفاده از Design System یکپارچه
4. **دسترسی‌پذیری**: قابل استفاده برای همه
5. **عملکرد**: طراحی با توجه به سرعت و عملکرد

---

این Design System یک پایه محکم برای طراحی رابط کاربری فراهم می‌کند.

