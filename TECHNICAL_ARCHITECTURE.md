# معماری فنی و ساختار پروژه

## 🏗️ معماری کلی سیستم

### الگوی معماری
- **Monorepo Structure**: یک پروژه Next.js با مسیرهای جداگانه برای موبایل و ادمین
- **Server-Side Rendering (SSR)**: برای SEO و عملکرد بهتر
- **Static Site Generation (SSG)**: برای صفحات استاتیک
- **Incremental Static Regeneration (ISR)**: برای به‌روزرسانی محتوای داینامیک

---

## 📁 ساختار دقیق پروژه

```
wibeCur/
├── app/                              # Next.js App Router
│   ├── (mobile)/                     # Route Group برای موبایل
│   │   ├── layout.tsx               # Layout موبایل (Bottom Nav)
│   │   ├── page.tsx                 # صفحه اصلی موبایل
│   │   ├── lists/
│   │   │   ├── page.tsx             # لیست تمام لیست‌ها
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx         # جزئیات لیست
│   │   │   └── create/
│   │   │       └── page.tsx         # ساخت لیست جدید
│   │   ├── items/
│   │   │   └── [id]/
│   │   │       └── page.tsx         # جزئیات آیتم
│   │   ├── search/
│   │   │   └── page.tsx             # صفحه جستجو
│   │   ├── profile/
│   │   │   ├── page.tsx             # پروفایل کاربر
│   │   │   ├── my-lists/
│   │   │   │   └── page.tsx         # لیست‌های من
│   │   │   ├── bookmarks/
│   │   │   │   └── page.tsx         # بوکمارک‌ها
│   │   │   └── settings/
│   │   │       └── page.tsx         # تنظیمات
│   │   └── categories/
│   │       └── [slug]/
│   │           └── page.tsx         # لیست‌های یک دسته‌بندی
│   │
│   ├── (admin)/                      # Route Group برای ادمین
│   │   ├── layout.tsx               # Layout ادمین (Sidebar)
│   │   ├── dashboard/
│   │   │   └── page.tsx             # داشبورد
│   │   ├── lists/
│   │   │   ├── page.tsx             # مدیریت لیست‌ها
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx         # ویرایش لیست
│   │   │   └── create/
│   │   │       └── page.tsx         # ساخت لیست کیوریتد
│   │   ├── items/
│   │   │   ├── page.tsx             # مدیریت آیتم‌ها
│   │   │   └── [id]/
│   │   │       └── page.tsx         # ویرایش آیتم
│   │   ├── users/
│   │   │   ├── page.tsx             # مدیریت کاربران
│   │   │   └── [id]/
│   │   │       └── page.tsx         # جزئیات کاربر
│   │   ├── categories/
│   │   │   └── page.tsx             # مدیریت دسته‌بندی‌ها
│   │   ├── analytics/
│   │   │   └── page.tsx             # آنالیتیکس
│   │   └── settings/
│   │       └── page.tsx             # تنظیمات سیستم
│   │
│   ├── api/                          # API Routes
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts         # NextAuth Handler
│   │   ├── lists/
│   │   │   ├── route.ts             # GET/POST لیست‌ها
│   │   │   ├── [id]/
│   │   │   │   └── route.ts         # GET/PUT/DELETE لیست
│   │   │   ├── [id]/items/
│   │   │   │   └── route.ts         # مدیریت آیتم‌های لیست
│   │   │   └── [id]/bookmark/
│   │   │       └── route.ts         # بوکمارک لیست
│   │   ├── items/
│   │   │   ├── route.ts             # GET/POST آیتم‌ها
│   │   │   ├── [id]/
│   │   │   │   └── route.ts         # GET/PUT/DELETE آیتم
│   │   │   ├── [id]/like/
│   │   │   │   └── route.ts         # لایک آیتم
│   │   │   └── [id]/bookmark/
│   │   │       └── route.ts         # بوکمارک آیتم
│   │   ├── search/
│   │   │   └── route.ts             # جستجو
│   │   ├── recommendations/
│   │   │   └── route.ts             # پیشنهادات هوشمند
│   │   ├── analytics/
│   │   │   └── route.ts             # داده‌های آنالیتیکس
│   │   └── upload/
│   │       └── route.ts             # آپلود تصاویر
│   │
│   ├── layout.tsx                    # Root Layout
│   ├── page.tsx                      # صفحه اصلی (redirect)
│   └── globals.css                   # استایل‌های全局
│
├── components/
│   ├── mobile/                       # کامپوننت‌های موبایل
│   │   ├── layout/
│   │   │   ├── MobileLayout.tsx     # Layout اصلی موبایل
│   │   │   ├── BottomNav.tsx        # نوار پایین
│   │   │   └── Header.tsx           # هدر موبایل
│   │   ├── lists/
│   │   │   ├── ListCard.tsx         # کارت لیست
│   │   │   ├── ListGrid.tsx         # گرید لیست‌ها
│   │   │   ├── ListDetail.tsx       # جزئیات لیست
│   │   │   └── ListItem.tsx         # آیتم در لیست
│   │   ├── items/
│   │   │   ├── ItemCard.tsx         # کارت آیتم
│   │   │   ├── ItemDetail.tsx       # جزئیات آیتم
│   │   │   └── ItemGrid.tsx         # گرید آیتم‌ها
│   │   ├── search/
│   │   │   ├── SearchBar.tsx        # نوار جستجو
│   │   │   ├── FilterSheet.tsx      # فیلتر (Bottom Sheet)
│   │   │   └── SearchResults.tsx    # نتایج جستجو
│   │   ├── profile/
│   │   │   ├── ProfileHeader.tsx    # هدر پروفایل
│   │   │   ├── ProfileTabs.tsx      # تب‌های پروفایل
│   │   │   └── ActivityList.tsx     # لیست فعالیت‌ها
│   │   ├── recommendations/
│   │   │   ├── RecommendationSection.tsx  # بخش پیشنهادات
│   │   │   └── RecommendationCard.tsx     # کارت پیشنهاد
│   │   └── ui/                       # کامپوننت‌های UI موبایل
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Badge.tsx
│   │       └── Skeleton.tsx
│   │
│   ├── admin/                        # کامپوننت‌های ادمین
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx      # Layout ادمین
│   │   │   ├── Sidebar.tsx          # منوی کناری
│   │   │   └── TopBar.tsx           # نوار بالایی
│   │   ├── dashboard/
│   │   │   ├── StatsCards.tsx       # کارت‌های آمار
│   │   │   ├── Charts.tsx            # نمودارها
│   │   │   └── RecentActivity.tsx   # فعالیت‌های اخیر
│   │   ├── lists/
│   │   │   ├── ListsTable.tsx       # جدول لیست‌ها
│   │   │   ├── ListForm.tsx         # فرم لیست
│   │   │   └── ListEditor.tsx       # ویرایشگر لیست
│   │   ├── items/
│   │   │   ├── ItemsTable.tsx       # جدول آیتم‌ها
│   │   │   └── ItemForm.tsx         # فرم آیتم
│   │   ├── users/
│   │   │   ├── UsersTable.tsx       # جدول کاربران
│   │   │   └── UserDetail.tsx       # جزئیات کاربر
│   │   └── analytics/
│   │       ├── AnalyticsDashboard.tsx
│   │       └── Reports.tsx
│   │
│   └── shared/                       # کامپوننت‌های مشترک
│       ├── Image.tsx                 # کامپوننت تصویر بهینه
│       ├── Loading.tsx               # لودینگ
│       ├── ErrorBoundary.tsx         # Error Boundary
│       ├── Modal.tsx                 # مودال
│       └── Toast.tsx                 # نوتیفیکیشن
│
├── lib/
│   ├── ai/                           # منطق هوش مصنوعی
│   │   ├── recommendation-engine.ts  # موتور پیشنهادات
│   │   ├── scoring.ts                # محاسبه امتیاز
│   │   └── user-profile.ts           # پروفایل کاربر (بر اساس رفتار)
│   ├── api/                          # کلاینت API
│   │   ├── lists.ts                  # API لیست‌ها
│   │   ├── items.ts                  # API آیتم‌ها
│   │   ├── search.ts                 # API جستجو
│   │   └── recommendations.ts       # API پیشنهادات
│   ├── auth/                         # احراز هویت
│   │   └── config.ts                 # تنظیمات NextAuth
│   ├── utils/                        # توابع کمکی
│   │   ├── format.ts                 # فرمت‌دهی
│   │   ├── validation.ts             # اعتبارسنجی
│   │   └── constants.ts              # ثابت‌ها
│   └── hooks/                        # Custom Hooks
│       ├── useRecommendations.ts    # هوک پیشنهادات
│       ├── useBookmark.ts           # هوک بوکمارک
│       └── useInfiniteScroll.ts     # هوک Infinite Scroll
│
├── types/                            # TypeScript Types
│   ├── list.ts                       # تایپ لیست
│   ├── item.ts                       # تایپ آیتم
│   ├── user.ts                       # تایپ کاربر
│   └── api.ts                        # تایپ‌های API
│
├── public/
│   ├── manifest.json                 # PWA Manifest
│   ├── sw.js                         # Service Worker
│   ├── icons/                        # آیکون‌های PWA
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── apple-touch-icon.png
│   └── images/                       # تصاویر استاتیک
│
├── middleware.ts                     # Next.js Middleware
├── next.config.js                    # تنظیمات Next.js
├── tailwind.config.js                # تنظیمات Tailwind
├── tsconfig.json                     # تنظیمات TypeScript
└── package.json                      # وابستگی‌ها

```

---

## 🔧 تکنولوژی‌های پیشنهادی

### Core
- **Next.js 14+**: Framework اصلی با App Router
- **TypeScript**: برای type safety
- **React 18+**: با Server Components

### Styling
- **Tailwind CSS**: برای استایل‌دهی
- **shadcn/ui**: کامپوننت‌های UI آماده
- **Framer Motion**: برای انیمیشن‌ها (اختیاری)

### State Management
- **Zustand**: برای state management ساده
- **React Query (TanStack Query)**: برای مدیریت داده‌های سرور
- **React Context**: برای state محلی

### Authentication
- **NextAuth.js**: یا **Clerk** برای احراز هویت

### Forms & Validation
- **React Hook Form**: برای مدیریت فرم‌ها
- **Zod**: برای validation schema

### Image Optimization
- **next/image**: برای بهینه‌سازی تصاویر
- **Cloudinary** یا **ImageKit**: برای CDN تصاویر (اختیاری)

### PWA
- **next-pwa**: پلاگین PWA برای Next.js
- **Workbox**: برای Service Worker

### Analytics
- **Vercel Analytics**: یا **Google Analytics**
- **PostHog**: برای product analytics (اختیاری)

---

## 🗄️ ساختار داده‌ها (Conceptual)

### Entity: List
```typescript
{
  id: string
  title: string
  description: string
  coverImage: string
  category: Category
  tags: string[]
  items: Item[]
  createdBy: User
  isCurated: boolean
  isPublic: boolean
  stats: {
    views: number
    bookmarks: number
    likes: number
  }
  createdAt: Date
  updatedAt: Date
}
```

### Entity: Item
```typescript
{
  id: string
  title: string
  description: string
  image: string
  externalLink?: string
  metadata: {
    year?: number
    genre?: string
    city?: string
    mood?: string
    // ... سایر متادیتا
  }
  lists: List[]  // لیست‌هایی که این آیتم در آن‌ها است
  stats: {
    views: number
    bookmarks: number
    likes: number
    dislikes: number
  }
  score: number  // امتیاز رتبه‌بندی
  createdAt: Date
  updatedAt: Date
}
```

### Entity: User
```typescript
{
  id: string
  email: string
  name: string
  avatar?: string
  role: 'user' | 'moderator' | 'admin'
  preferences: {
    categories: string[]
    notifications: NotificationSettings
  }
  stats: {
    listsCreated: number
    bookmarks: number
    likes: number
  }
  createdAt: Date
}
```

### Entity: UserActivity
```typescript
{
  id: string
  userId: string
  type: 'click' | 'bookmark' | 'like' | 'search' | 'view'
  targetType: 'list' | 'item'
  targetId: string
  metadata: {
    duration?: number  // برای view
    searchQuery?: string  // برای search
  }
  timestamp: Date
}
```

### Entity: Category
```typescript
{
  id: string
  slug: string
  name: string
  icon: string
  description: string
  parentId?: string  // برای دسته‌بندی‌های تو در تو
  filters: {
    cities?: string[]
    years?: number[]
    genres?: string[]
    moods?: string[]
  }
}
```

---

## 🔄 Flow های اصلی

### Flow: مشاهده لیست
```
User → Home Page
  → Click on List Card
  → List Detail Page
    → Load List Data (SSR)
    → Load Items (Client-side)
    → Track View Activity
    → Show Recommendations
```

### Flow: ساخت لیست
```
User → Profile → Create List
  → Fill Form (React Hook Form)
  → Validate (Zod)
  → Upload Cover Image
  → Add Items (Search & Select)
  → Submit
  → API: Create List
  → Redirect to List Detail
```

### Flow: پیشنهادات هوشمند
```
User Activity → Track in UserActivity
  → Background Job: Update User Profile
  → Recommendation Engine:
    → Analyze User Behavior
    → Calculate Similarity Scores
    → Generate Recommendations
  → Cache Recommendations
  → Display on Home Page
```

### Flow: رتبه‌بندی پویا
```
Item Interaction (Like/Bookmark/View)
  → Update Item Stats
  → Trigger Score Recalculation
  → Update Item Score
  → Reorder Items in Lists
  → Update Trending Lists
```

---

## 🎯 الگوریتم پیشنهادات (جزئیات)

### محاسبه امتیاز پیشنهاد
```typescript
function calculateRecommendationScore(
  item: Item,
  userProfile: UserProfile,
  userActivity: UserActivity[]
): number {
  // 1. Similarity Score (بر اساس دسته‌بندی و تگ‌ها)
  const similarityScore = calculateSimilarity(
    item,
    userProfile.preferredCategories,
    userProfile.preferredTags
  );

  // 2. Behavior Score (بر اساس فعالیت‌های کاربر)
  const behaviorScore = calculateBehaviorScore(
    item,
    userActivity
  );

  // 3. Popularity Score (بر اساس محبوبیت کلی)
  const popularityScore = calculatePopularityScore(
    item.stats
  );

  // 4. Trend Score (بر اساس ترند شدن)
  const trendScore = calculateTrendScore(
    item.stats.recentGrowth
  );

  // 5. Recency Score (آیتم‌های جدیدتر)
  const recencyScore = calculateRecencyScore(
    item.createdAt
  );

  // ترکیب امتیازها با وزن‌های مختلف
  return (
    similarityScore * 0.3 +
    behaviorScore * 0.25 +
    popularityScore * 0.2 +
    trendScore * 0.15 +
    recencyScore * 0.1
  );
}
```

### محاسبه امتیاز رتبه‌بندی آیتم
```typescript
function calculateItemScore(item: Item): number {
  const { likes, bookmarks, views, dislikes } = item.stats;
  
  // امتیاز پایه
  const baseScore = 
    (likes * 10) +
    (bookmarks * 8) +
    (views * 0.1) -
    (dislikes * 5);

  // ضریب زمان (آیتم‌های جدیدتر)
  const ageInDays = (Date.now() - item.createdAt) / (1000 * 60 * 60 * 24);
  const timeDecay = Math.exp(-ageInDays / 30); // نیمه‌عمر 30 روز

  // ضریب ترند (افزایش ناگهانی)
  const trendMultiplier = calculateTrendMultiplier(item);

  return baseScore * timeDecay * trendMultiplier;
}
```

---

## 🔔 سیستم نوتیفیکیشن

### انواع نوتیفیکیشن
1. **Push Notifications** (PWA)
   - محتوای جدید
   - ترند شدن
   - پیشنهادات شخصی

2. **In-App Notifications**
   - فعالیت‌های اجتماعی
   - به‌روزرسانی‌های لیست‌های بوکمارک شده

3. **Email Notifications** (اختیاری)
   - خلاصه هفتگی
   - رویدادهای مهم

### ساختار نوتیفیکیشن
```typescript
{
  id: string
  userId: string
  type: 'push' | 'in-app' | 'email'
  category: 'new-content' | 'trending' | 'recommendation' | 'social'
  title: string
  message: string
  actionUrl?: string
  read: boolean
  createdAt: Date
}
```

---

## 🚀 بهینه‌سازی‌ها

### Performance
- **Image Optimization**: استفاده از next/image
- **Code Splitting**: Lazy loading کامپوننت‌ها
- **Data Fetching**: استفاده از Server Components
- **Caching**: کش API responses
- **CDN**: برای تصاویر و فایل‌های استاتیک

### SEO
- **Meta Tags**: برای هر صفحه
- **Structured Data**: Schema.org markup
- **Sitemap**: تولید خودکار
- **robots.txt**: مدیریت crawler

### Accessibility
- **Semantic HTML**: استفاده از تگ‌های مناسب
- **ARIA Labels**: برای screen readers
- **Keyboard Navigation**: پشتیبانی کامل
- **Color Contrast**: رعایت استانداردها

---

## 🔒 امنیت

### Best Practices
- **Input Validation**: اعتبارسنجی تمام ورودی‌ها
- **SQL Injection Prevention**: استفاده از ORM/Query Builder
- **XSS Prevention**: Sanitize کردن خروجی‌ها
- **CSRF Protection**: استفاده از tokens
- **Rate Limiting**: محدود کردن درخواست‌ها
- **Authentication**: استفاده از JWT یا session-based
- **Authorization**: بررسی دسترسی در هر endpoint

---

## 📊 Monitoring & Logging

### ابزارهای پیشنهادی
- **Error Tracking**: Sentry
- **Performance Monitoring**: Vercel Analytics
- **Logging**: Winston یا Pino
- **Uptime Monitoring**: UptimeRobot

### معیارهای مانیتورینگ
- Response Time
- Error Rate
- API Usage
- User Activity
- Server Resources

---

## 🧪 Testing Strategy

### انواع تست
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: برای API endpoints
- **E2E Tests**: Playwright یا Cypress
- **Visual Regression**: Percy یا Chromatic

### Coverage Goals
- Unit Tests: > 80%
- Integration Tests: > 70%
- Critical Paths: 100%

---

این معماری فنی یک پایه محکم برای توسعه اپلیکیشن فراهم می‌کند و امکان مقیاس‌پذیری و نگهداری را تضمین می‌کند.

