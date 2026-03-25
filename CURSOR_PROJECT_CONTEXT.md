# WibeCur — مرجع فنی پروژه (آخرین بروزرسانی: 2026-03-25)

## 1. معرفی پروژه

**WibeCur** (وایب‌کر) یک پلتفرم اجتماعی فارسی/RTL برای ایجاد، کشف و اشتراک‌گذاری **لیست‌های کیوریتد لایف‌استایل** است.
کاربران می‌توانند لیست‌هایی در حوزه‌های مختلف (فیلم، کتاب، رستوران، سفر و ...) بسازند، رأی بدهند، کامنت بگذارند و لیست‌ها را ذخیره کنند.

- **زبان**: فارسی (RTL) — `<html lang="fa" dir="rtl">`
- **دامنه**: `wibecur.ir`
- **پورت توسعه**: `3002` (اسکریپت dev)

---

## 2. تکنولوژی و Stack

| لایه | تکنولوژی | نسخه |
|------|----------|------|
| Framework | **Next.js** (App Router, Turbopack) | 16.0.7 |
| Runtime | React 19, TypeScript 5.7 | — |
| Database | **PostgreSQL 16** (Docker local / feedban.ir remote) | — |
| ORM | **Prisma** 6.19 | — |
| Object Storage | **MinIO** (لوکال) / **Liara Object Storage** (پروداکشن) | — |
| Auth | **NextAuth v5** (beta.30) — Credentials provider, JWT | — |
| State (client) | **TanStack React Query** + **Zustand** 4.5 | — |
| Styling | **Tailwind CSS** 3.4 | — |
| Animation | **Framer Motion** 11 | — |
| Image Processing | **Sharp** 0.34 | — |
| Rate Limiting | **Upstash Redis** (اختیاری) | — |
| Monitoring | **Sentry** (@sentry/nextjs 10) | — |
| AI | **OpenAI SDK** 6 (توضیحات خودکار، جستجوی هوشمند) | — |
| Testing | Vitest + Testing Library, Playwright (e2e) | — |
| Charts | **Recharts** 3.5 (پنل ادمین) | — |
| Icons | **Lucide React** | — |

---

## 3. زیرساخت لوکال (Docker)

**فایل**: `docker-compose.yml`

### 3.1 PostgreSQL
- Container: `wibecur-postgres`
- Image: `postgres:16-alpine`
- Port: `5433:5432` (برای عدم تداخل با PostgreSQL محلی)
- User/Pass/DB: `wibecur` / `wibecur_local_secret` / `wibecur`
- Volume: `postgres_data`

### 3.2 MinIO (Object Storage لوکال)
- Container: `wibecur-minio`
- Image: `minio/minio:latest`
- Ports: `9000` (S3 API) + `9001` (Console)
- User/Pass: `wibecur` / `wibecur_minio_secret`
- Volume: `minio_data`
- Bucket: `wibe` (public-read) — ساخته شده توسط `minio-init`

### 3.3 DATABASE_URL
```
postgresql://wibecur:wibecur_local_secret@localhost:5433/wibecur
```

### 3.4 پروداکشن ریموت
- Database: `pgsql.feedban.ir:5174/wibe`
- Object Storage: Liara (S3-compatible)

---

## 4. ساختار دیتابیس (Prisma Schema)

**فایل**: `prisma/schema.prisma` (786 خط)

### 4.1 مدل‌های اصلی

| مدل | توضیح | فیلدهای کلیدی |
|-----|--------|---------------|
| `users` | کاربران | id, email, password, role, username, bio, reputationScore, curatorScore, curatorLevel, avatarType, avatarId |
| `lists` | لیست‌های کیوریتد | id, title, slug, coverImage, categoryId, userId, tags[], badge, viewCount, likeCount, saveCount, itemCount |
| `items` | آیتم‌های داخل لیست | id, title, description, imageUrl, externalUrl, listId, metadata(JSON), voteCount, rating |
| `categories` | دسته‌بندی‌ها | id, name, slug, icon, color, accentColor, heroImage, layoutType, trendingWeight |
| `comments` | کامنت آیتم | id, itemId, userId, content, likeCount, isFiltered, isApproved |
| `list_comments` | کامنت لیست | id, listId, userId, parentId, type(comment/suggestion/opinion), weightedScore |
| `settings` | تنظیمات singleton | API keys (encrypted), Liara config, limits |

### 4.2 مدل‌های تعاملی

| مدل | توضیح |
|-----|--------|
| `item_votes` | رأی‌گیری آیتم (userId+itemId unique) |
| `list_likes` | لایک لیست |
| `list_reactions` | واکنش سریع لیست (love/cry/night/meh/suggestion) |
| `bookmarks` | ذخیره لیست |
| `follows` | فالو/فالوینگ کاربران |
| `comment_likes` / `list_comment_likes` | لایک کامنت |
| `comment_reports` / `list_comment_reports` | گزارش کامنت |
| `list_comment_votes` | رأی مفید/نامفید کامنت لیست |

### 4.3 مدل‌های مدیریتی

| مدل | توضیح |
|-----|--------|
| `item_moderation` | مدیریت محتوای آیتم (flagScore, status: NORMAL/SOFT_FLAG/UNDER_REVIEW/HIDDEN) |
| `item_reports` | گزارش آیتم |
| `moderation_case` | کیس‌های مدیریت (REPORT/AUTO_FLAG/ANOMALY/PENDING) |
| `moderation_note` | یادداشت‌های مدریت |
| `audit_log` | لاگ عملیات ادمین |
| `user_violations` | تخلفات کاربر |
| `comment_penalties` | جریمه کامنت |
| `bad_words` | لیست کلمات ممنوع |
| `comment_settings` | تنظیمات جهانی کامنت |

### 4.4 مدل‌های فیچر/اکتشاف

| مدل | توضیح |
|-----|--------|
| `home_featured_slot` | اسلات‌های منتخب هفته (زمان‌بندی، آنالیتیکس) |
| `home_featured_event` | رویدادهای تراکینگ منتخب (VIEW_LIST, QUICK_SAVE) |
| `admin_featured_notification_sent` | جلوگیری اسپم نوتیف اسلات |
| `suggested_items` | پیشنهاد آیتم توسط کاربر |
| `suggested_lists` | پیشنهاد لیست توسط کاربر |
| `notifications` | اعلان‌ها |

### 4.5 مدل‌های گیمیفیکیشن/رتبه‌بندی

| مدل | توضیح |
|-----|--------|
| `creator_rankings` | رتبه‌بندی سازندگان (curatorScore, influenceScore, momentumScore, globalRank) |
| `achievements` | تعریف دستاوردها (code, tier: bronze/silver/gold/elite) |
| `user_achievements` | دستاوردهای باز شده |
| `creator_spotlights` | اسپاتلایت سازندگان (weekly/rising/category/editor) |
| `user_category_affinity` | وابستگی کاربر به دسته |
| `discovery_spotlight_cache` | کش اسپاتلایت اکتشاف |

### 4.6 Enum‌ها

```
UserRole: USER | EDITOR | ADMIN | SUPER_ADMIN | MODERATOR | ANALYST
CuratorLevel: EXPLORER | NEW_CURATOR | ACTIVE_CURATOR | TRUSTED_CURATOR | INFLUENTIAL_CURATOR | ELITE_CURATOR | VIBE_LEGEND
AvatarType: DEFAULT | UPLOADED
AvatarStatus: APPROVED | PENDING | REJECTED
ListBadge: TRENDING | NEW | FEATURED
ItemModerationStatus: NORMAL | SOFT_FLAG | UNDER_REVIEW | HIDDEN
ModerationStatus: OPEN | IN_REVIEW | RESOLVED | IGNORED
ModerationType: REPORT | AUTO_FLAG | ANOMALY | PENDING
ModerationEntityType: LIST | COMMENT | USER | CATEGORY
HomeFeaturedAction: VIEW_LIST | QUICK_SAVE
```

---

## 5. سیستم Object Storage و تصاویر

### 5.1 معماری کلی

```
تصویر خارجی → API (image-resolve/placeholder) → دانلود → Sharp optimize → آپلود S3 → URL عمومی
```

تمام تصاویر در نهایت در Object Storage (MinIO لوکال / Liara پروداکشن) ذخیره می‌شوند.

### 5.2 فایل‌های کلیدی

| فایل | مسئولیت |
|------|---------|
| `lib/object-storage-config.ts` | خواندن config از DB + تشخیص URL استوریج خودمان (`isOurStorageUrl`) |
| `lib/object-storage.ts` | آپلود (از URL / Buffer)، دریافت فایل، `ensureImageInLiara` |
| `lib/image-config.ts` | پروفایل‌های بهینه‌سازی (avatar, coverList, itemImage, hubCover, ...) |
| `lib/image-optimizer.ts` | بهینه‌سازی با Sharp (resize, WebP, quality) |
| `lib/display-image.ts` | `getDisplayImageUrl()` — تصمیم‌گیری نمایش: Liara مستقیم یا resolve API |
| `lib/placeholder-images.ts` | `getRandomPlaceholderUrl()` — placeholder از API |
| `lib/placeholder-liara.ts` | دانلود Picsum → آپلود Liara → cache |
| `components/shared/ImageWithFallback.tsx` | کامپوننت اصلی نمایش تصویر با fallback chain |

### 5.3 پیکربندی Object Storage

Config از **جدول `settings`** دیتابیس خوانده می‌شود (نه env مستقیم):
- `liaraBucketName` → bucket name
- `liaraEndpoint` → S3 endpoint
- `liaraAccessKey` → access key (encrypted)
- `liaraSecretKey` → secret key (encrypted)

اسکریپت `scripts/set-liara-config.ts` مقادیر env (`LIARA_*`) را رمز کرده در DB ذخیره می‌کند.

### 5.4 API Routes تصویر

| Route | عملکرد |
|-------|--------|
| `GET /api/placeholder?seed=X&size=cover` | تصویر placeholder: Picsum → آپلود Liara → redirect |
| `GET /api/image-resolve?url=X&folder=covers` | URL خارجی → آپلود Liara → redirect (با cache) |
| `GET /api/image-proxy?url=X` | پراکسی تصاویر Liara (CORS/باکت خصوصی) |
| `POST /api/upload` | آپلود مستقیم فایل |
| `POST /api/admin/upload` | آپلود ادمین |

### 5.5 ImageWithFallback (کامپوننت اصلی)

```
1. اگر src خالی/placeholder → getRandomPlaceholderUrl(alt+src) → /api/placeholder
2. اگر Liara URL → /api/image-proxy?url=... (پراکسی)
3. اگر URL خارجی → /api/image-resolve?url=...&folder=... (آپلود+redirect)
4. خطا → placeholder رندوم → خطا → gradient خاکستری SVG
```

### 5.6 پروفایل‌های بهینه‌سازی تصویر

| پروفایل | ابعاد max | کیفیت | حداکثر حجم | فرمت |
|---------|-----------|-------|------------|------|
| avatar | 400×400 | 85 | 500KB | webp |
| coverList | 1000×800 | 85 | 1MB | webp |
| itemImage | 1000×900 | 85 | 1MB | webp |
| itemThumbnail | 800×600 | 80 | 300KB | webp |
| hubCover | 1920×1080 | 85 | 2MB | webp |
| default | 1000×1000 | 80 | 500KB | webp |

---

## 6. احراز هویت (Auth)

**فایل‌ها**: `lib/auth-config.ts`, `lib/auth.ts`

- **NextAuth v5** با Credentials provider
- استراتژی: **JWT** (بدون session DB)
- رمز عبور: **bcryptjs**
- Session max age: 30 روز
- صفحه ورود: `/login`

### نقش‌ها و دسترسی

| نقش | دسترسی Admin |
|-----|-------------|
| `SUPER_ADMIN` | همه |
| `ADMIN` | همه |
| `MODERATOR` | مدیریت محتوا |
| `ANALYST` | فقط خواندن آنالیتیکس |
| `EDITOR` | ویرایش محتوا |
| `USER` | کاربر عادی |

- مسیرهای `/admin/*` فقط برای نقش‌های ادمین
- مسیر `/profile` نیاز به ورود
- `lib/auth.ts`: توابع `getCurrentUser()`, `requireAuth()`, `requireAdmin()`, `checkAdminAuth()`

---

## 7. رمزنگاری

**فایل**: `lib/encryption.ts`

- الگوریتم: **AES-256-GCM**
- کلید: از env `ENCRYPTION_KEY` (در dev: fallback)
- استفاده: رمزنگاری API keys و secrets در جدول `settings`
- توابع: `encrypt()`, `decrypt()`, `testEncryption()`

---

## 8. ساختار صفحات (App Router)

### 8.1 صفحات عمومی (موبایل‌اول)

| مسیر | کامپوننت/توضیح |
|------|----------------|
| `/` | صفحه اصلی — Header, SearchBar, CategoryChips, HeroSpotlight, TrendingCarousel, CreatorSpotlight, ForYou, ... |
| `/lists` | فهرست لیست‌ها |
| `/lists/[slug]` | جزئیات لیست |
| `/items/[id]` | جزئیات آیتم |
| `/categories/[slug]` | صفحه دسته‌بندی |
| `/curated/guide` | راهنمای کیوریتور |
| `/leaderboard` | جدول رتبه‌بندی |
| `/login` | ورود |
| `/profile` | پروفایل کاربر (نیاز auth) |
| `/u/[username]` | پروفایل عمومی |
| `/user-lists` | لیست‌های شخصی |
| `/user-lists/[id]` | جزئیات لیست شخصی |
| `/user-lists/[id]/add-item` | افزودن آیتم |
| `/sponsored/[id]` | محتوای حمایت‌شده |

### 8.2 صفحات ادمین

| مسیر | توضیح |
|------|--------|
| `/admin/dashboard` | داشبورد کنترل — KPI, Activity, Risk Panel, Trending |
| `/admin/lists` | مدیریت لیست‌ها + لیست‌های کاربری |
| `/admin/items` | مدیریت آیتم‌ها (جستجو IMDB, پوستر, توضیح AI) |
| `/admin/categories` | مدیریت دسته‌ها (CRUD, soft delete, impact) |
| `/admin/users` | مدیریت کاربران (toggle active, trash, restore) |
| `/admin/comments` | مدیریت کامنت‌ها (approve/reject, penalties, reports, bad-words) |
| `/admin/moderation` | سیستم مدیریت محتوا (cases, assign, notes) |
| `/admin/analytics` | آنالیتیکس (charts, growth, system status) |
| `/admin/kpi` | KPI داشبورد |
| `/admin/pulse` | Pulse — overview, categories, trending, suggestions |
| `/admin/audit` | لاگ عملیات |
| `/admin/settings` | تنظیمات (API keys, Object Storage, comment settings) |
| `/admin/suggestions` | مدیریت پیشنهادات کاربران |
| `/admin/custom/featured` | مدیریت اسلات‌های منتخب هفته |

---

## 9. ساختار کامپوننت‌ها

### 9.1 `components/mobile/` — کامپوننت‌های موبایل‌اول

```
mobile/
├── home/           # صفحه اصلی: HeroSpotlight, TrendingCarousel, CategoryGrid, ListCard, ForYou, ...
├── layout/         # Header, BottomNav, NotificationIcon
├── lists/          # BookmarkButton, ListCommentSection, SuggestItemForm, FilterSheet, ...
├── items/          # ItemLikeButton, ItemReportModal, SaveToPersonalListModal
├── comments/       # CommentForm, CommentItem, CommentSection
├── profile/        # ProfileHeader, ProfileTabs, AvatarSelection, EditProfile, AchievementSheet
├── curated/        # CuratedGrid, CuratedHero, CategoryChips, RisingCreators, TrendingNow, ...
├── recommendations/ # توصیه‌ها
├── shared/         # مشترک موبایل
└── user-lists/     # لیست‌های شخصی
```

### 9.2 `components/shared/` — کامپوننت‌های مشترک

| کامپوننت | توضیح |
|----------|--------|
| `ImageWithFallback.tsx` | نمایش تصویر با fallback chain (Liara proxy → placeholder → gray) |
| `CommentAvatar.tsx` | آواتار کامنت |
| `ConfirmDialog.tsx` | دیالوگ تأیید |
| `CuratorBadge.tsx` | نشان کیوریتور |
| `CuratorScoreBar.tsx` | نوار امتیاز کیوریتور |
| `EliteAvatarFrame.tsx` | فریم آواتار الیت |
| `ErrorBoundary.tsx` | مدیریت خطا |
| `Toast.tsx` | اعلان‌ها |

### 9.3 `components/admin/` — پنل ادمین

```
admin/
├── layout/         # Sidebar, AdminHeader, MiniUserPanel, QuickCreateFab, TopBar
├── dashboard/      # KpiCard, ActivityStream, RiskPanel, Charts, TrendingRadar, ...
├── analytics/      # AnalyticsDashboard, Charts, GrowthBlock, SystemStatusBar
├── categories/     # CategoryCard, CategoryIntelligence, FilterBar, ImpactCard, WeightCard
├── comments/       # CommentsTable, CommentRow, PenaltyModal, BulkActionBar
├── lists/          # مدیریت لیست
├── items/          # مدیریت آیتم
├── users/          # مدیریت کاربر
├── moderation/     # مدیریت محتوا
├── suggestions/    # مدیریت پیشنهادات
├── audit/          # لاگ عملیات
├── pulse/          # پالس
├── upload/         # آپلود
├── design-system/  # سیستم طراحی
└── shared/         # مشترک ادمین
```

### 9.4 `components/providers/`

| Provider | توضیح |
|----------|--------|
| `SessionProvider` | NextAuth session |
| `QueryProvider` | TanStack React Query |
| `PWAProvider` | Progressive Web App |
| `MainContainer` | container اصلی |

### 9.5 `components/category/` — صفحه دسته‌بندی

### 9.6 `components/auth/` — فرم‌های احراز هویت

---

## 10. API Routes

### 10.1 API عمومی

| Route | Method | توضیح |
|-------|--------|--------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth endpoints |
| `/api/categories` | GET | لیست دسته‌ها |
| `/api/categories/[slug]/page-data` | GET | داده صفحه دسته |
| `/api/categories/[slug]/trending` | GET | ترندینگ دسته |
| `/api/lists/home` | GET | داده صفحه اصلی |
| `/api/lists/public` | GET | لیست‌های عمومی |
| `/api/lists/following` | GET | لیست‌های فالوینگ |
| `/api/lists/user-created` | GET | لیست‌های ساخته شده کاربر |
| `/api/lists/[id]/bookmark` | POST/DELETE | ذخیره/حذف بوکمارک |
| `/api/lists/[id]/bookmark-status` | GET | وضعیت بوکمارک |
| `/api/lists/[id]/reactions` | GET/POST | واکنش‌های لیست |
| `/api/lists/[id]/comments` | GET/POST | کامنت‌های لیست |
| `/api/lists/[id]/auto-suggest` | POST | پیشنهاد خودکار AI |
| `/api/lists/comments/[id]/like` | POST | لایک کامنت لیست |
| `/api/lists/comments/[id]/vote` | POST | رأی مفید/نامفید |
| `/api/lists/comments/[id]/report` | POST | گزارش کامنت |
| `/api/lists/comments/[id]/approve` | POST | تأیید کامنت |
| `/api/lists/comments/[id]/reject` | POST | رد کامنت |
| `/api/items/search` | GET | جستجوی آیتم |
| `/api/items/trending` | GET | آیتم‌های ترند |
| `/api/items/[id]/comments` | GET/POST | کامنت آیتم |
| `/api/items/[id]/like` | POST | لایک آیتم |
| `/api/items/[id]/report` | POST | گزارش آیتم |
| `/api/items/[id]/similar` | GET | آیتم‌های مشابه |
| `/api/items/[id]/also-liked` | GET | همچنین پسندیدند |
| `/api/items/[id]/saved-status` | GET | وضعیت ذخیره |
| `/api/items/fetch-movie-data` | POST | دریافت داده فیلم |
| `/api/items/generate-description` | POST | تولید توضیح AI |
| `/api/comments/[id]/like` | POST | لایک کامنت |
| `/api/comments/[id]/report` | POST | گزارش |
| `/api/trending/global` | GET | ترندینگ جهانی |
| `/api/trending/fast` | GET | ترندینگ سریع |
| `/api/trending/monthly` | GET | ترندینگ ماهانه |
| `/api/trending/category/[slug]` | GET | ترندینگ دسته |
| `/api/leaderboard` | GET | لیدربورد |
| `/api/discovery/creators` | GET | اکتشاف سازندگان |
| `/api/spotlight/current` | GET | اسپاتلایت فعلی |
| `/api/spotlight/personalized` | GET | اسپاتلایت شخصی‌شده |
| `/api/follow/[userId]` | POST/DELETE | فالو/آنفالو |
| `/api/follow/following` | GET | لیست فالوینگ |
| `/api/suggestions/items` | POST | پیشنهاد آیتم |
| `/api/suggestions/lists` | POST | پیشنهاد لیست |
| `/api/notifications` | GET/PATCH | اعلان‌ها |
| `/api/home/categories` | GET | دسته‌ها برای هوم |
| `/api/home-featured/impression` | POST | ثبت impression |
| `/api/home-featured/track` | POST | تراکینگ featured |
| `/api/public-profile/[username]` | GET | پروفایل عمومی |
| `/api/images/search` | GET | جستجوی تصاویر |

### 10.2 API کاربر (`/api/user/`)

| Route | Method | توضیح |
|-------|--------|--------|
| `/api/user/profile` | GET/PATCH | پروفایل |
| `/api/user/avatar` | POST | آپلود/تغییر آواتار |
| `/api/user/bookmarks` | GET | بوکمارک‌ها |
| `/api/user/comments` | GET | کامنت‌های من |
| `/api/user/lists` | GET/POST | لیست‌های شخصی |
| `/api/user/lists/[id]` | GET/PATCH/DELETE | مدیریت لیست شخصی |
| `/api/user/lists/[id]/items` | GET/POST | آیتم‌های لیست |
| `/api/user/lists/[id]/items/[itemId]` | PATCH/DELETE | مدیریت آیتم |
| `/api/user/achievements` | GET | دستاوردها |
| `/api/user/activity` | GET | فعالیت‌ها |
| `/api/user/interaction-count` | GET | تعداد تعاملات |
| `/api/user/my-lists` | GET | لیست‌های من |
| `/api/upload` | POST | آپلود تصویر |

### 10.3 API ادمین (`/api/admin/`)

| Route | Method | توضیح |
|-------|--------|--------|
| `/api/admin/lists` | GET | لیست‌ها |
| `/api/admin/lists/[id]` | GET/PATCH/DELETE | مدیریت لیست |
| `/api/admin/lists/[id]/trash` | POST | حذف نرم |
| `/api/admin/lists/[id]/restore` | POST | بازیابی |
| `/api/admin/lists/[id]/debug` | GET | اطلاعات دیباگ |
| `/api/admin/lists/user-created` | GET | لیست‌های کاربری |
| `/api/admin/items` | GET | آیتم‌ها |
| `/api/admin/items/[id]` | PATCH/DELETE | ویرایش/حذف |
| `/api/admin/items/fetch-from-imdb` | POST | دریافت از IMDB |
| `/api/admin/items/fetch-movie-data` | POST | داده فیلم |
| `/api/admin/items/generate-description` | POST | توضیح AI |
| `/api/admin/items/search-google-images` | POST | جستجوی تصویر |
| `/api/admin/items/upload-movie-poster` | POST | آپلود پوستر |
| `/api/admin/items/reports` | GET | گزارش‌ها |
| `/api/admin/items/reports/[id]/resolve` | POST | حل گزارش |
| `/api/admin/categories` | GET/POST | دسته‌ها |
| `/api/admin/categories/[id]` | PATCH/DELETE | ویرایش/حذف |
| `/api/admin/categories/[id]/trash` | POST | حذف نرم |
| `/api/admin/categories/[id]/restore` | POST | بازیابی |
| `/api/admin/categories/[id]/impact` | GET | تأثیر دسته |
| `/api/admin/users/[id]` | GET/PATCH | مدیریت کاربر |
| `/api/admin/users/[id]/toggle-active` | POST | فعال/غیرفعال |
| `/api/admin/users/[id]/trash` | POST | حذف نرم |
| `/api/admin/users/[id]/restore` | POST | بازیابی |
| `/api/admin/comments` | GET | کامنت‌ها |
| `/api/admin/comments/[id]` | DELETE | حذف |
| `/api/admin/comments/[id]/approve` | POST | تأیید |
| `/api/admin/comments/[id]/reject` | POST | رد |
| `/api/admin/comments/[id]/penalty` | POST | جریمه |
| `/api/admin/comments/bad-words` | GET/POST | کلمات ممنوع |
| `/api/admin/comments/bad-words/[id]` | DELETE | حذف کلمه |
| `/api/admin/comments/bulk` | POST | عملیات دسته‌ای |
| `/api/admin/comments/reports` | GET | گزارش‌ها |
| `/api/admin/comments/violations` | GET | تخلفات |
| `/api/admin/moderation` | GET | کیس‌ها |
| `/api/admin/moderation/[id]` | GET/PATCH | مدیریت کیس |
| `/api/admin/moderation/[id]/status` | PATCH | تغییر وضعیت |
| `/api/admin/moderation/[id]/assign` | PATCH | اختصاص |
| `/api/admin/moderation/[id]/note` | POST | یادداشت |
| `/api/admin/moderation/create` | POST | ایجاد کیس |
| `/api/admin/moderation/preview` | GET | پیش‌نمایش |
| `/api/admin/moderation/summary` | GET | خلاصه |
| `/api/admin/moderation/actions/trash-list` | POST | حذف لیست |
| `/api/admin/moderation/actions/suspend-user` | POST | تعلیق کاربر |
| `/api/admin/settings` | GET/PATCH | تنظیمات |
| `/api/admin/settings/comment-settings` | GET/PATCH | تنظیمات کامنت |
| `/api/admin/suggestions/items` | GET | پیشنهادات آیتم |
| `/api/admin/suggestions/items/[id]` | PATCH | تأیید/رد |
| `/api/admin/suggestions/lists` | GET | پیشنهادات لیست |
| `/api/admin/suggestions/lists/[id]` | PATCH | تأیید/رد |
| `/api/admin/kpi/growth` | GET | رشد KPI |
| `/api/admin/pulse/overview` | GET | خلاصه پالس |
| `/api/admin/pulse/categories` | GET | دسته‌ها |
| `/api/admin/pulse/trending` | GET | ترندینگ |
| `/api/admin/pulse/trending-lists` | GET | لیست‌های ترند |
| `/api/admin/pulse/suggestions` | GET | پیشنهادات |
| `/api/admin/pulse/cities` | GET | شهرها |
| `/api/admin/audit` | GET | لاگ |
| `/api/admin/upload` | POST | آپلود |
| `/api/admin/live-activity` | GET | فعالیت زنده |
| `/api/admin/custom/featured` | GET/POST | اسلات منتخب |
| `/api/admin/custom/featured/[slotId]` | PATCH/DELETE | مدیریت اسلات |
| `/api/admin/custom/featured/[slotId]/performance` | GET | آنالیتیکس اسلات |
| `/api/admin/custom/featured/lists` | GET | لیست‌ها |
| `/api/admin/custom/featured/suggestions` | GET | پیشنهادات |
| `/api/admin/custom/featured/check-conflict` | GET | بررسی تداخل |
| `/api/admin/custom/featured/rotation-insight` | GET | بینش چرخش |
| `/api/admin/custom/featured/category-insights` | GET | بینش دسته |
| `/api/admin/custom/featured/weekly-report` | GET | گزارش هفتگی |

### 10.4 Cron Jobs

| Route | توضیح |
|-------|--------|
| `/api/cron/ranking` | بروزرسانی رتبه‌بندی سازندگان |
| `/api/cron/discovery` | بروزرسانی اکتشاف |

---

## 11. کتابخانه‌های کلیدی (`lib/`)

| فایل | توضیح |
|------|--------|
| `prisma.ts` | Singleton PrismaClient (connection pooling) |
| `db.ts` | `dbQuery()` با retry logic, `cachedQuery()`, `getCounts()`, `getCategories()` |
| `settings.ts` | CRUD تنظیمات singleton (encrypted API keys) |
| `auth-config.ts` | NextAuth config |
| `auth.ts` | `getCurrentUser()`, `requireAuth()`, `requireAdmin()` |
| `encryption.ts` | AES-256-GCM encrypt/decrypt |
| `rate-limit.ts` | Upstash Redis rate limiting (60 req/min, graceful fallback) |
| `seo.ts` | SEO helpers, `getBaseUrl()`, `toAbsoluteImageUrl()` |
| `trending/score.ts` | الگوریتم امتیاز ترندینگ |
| `trending/service.ts` | سرویس ترندینگ |
| `trending/constants.ts` | ثابت‌های ترندینگ |
| `ranking.ts` | سیستم رتبه‌بندی |
| `achievements.ts` | سیستم دستاوردها |
| `discovery.ts` | اکتشاف |
| `spotlight.ts` | اسپاتلایت |
| `curator.ts` | محاسبات کیوریتور |
| `moderation.ts` | سیستم مدیریت محتوا |
| `comment-antispan.ts` | ضد اسپم کامنت |
| `comment-utils.ts` | ابزارهای کامنت |
| `category-page-data.ts` | داده صفحه دسته |
| `featured-rotation.ts` | چرخش منتخب |
| `featured-suggestions.ts` | پیشنهادات منتخب |
| `featured-performance.ts` | آنالیتیکس منتخب |
| `home-featured.ts` | منتخب صفحه اصلی |
| `analytics.ts` | آنالیتیکس |
| `api-error.ts` | مدیریت خطای API |
| `image-validator.ts` | اعتبارسنجی تصویر |
| `vibe-avatars.ts` | آواتارهای وایب |
| `listSimilarity.ts` | شباهت لیست‌ها |
| `design-tokens.ts` | توکن‌های طراحی |
| `query-client.ts` | تنظیمات React Query |
| `utils/slug.ts` | تولید slug |
| `utils/number-converter.ts` | تبدیل اعداد فارسی/انگلیسی |
| `utils/notifications.ts` | ابزارهای اعلان |
| `utils/cache-client.ts` | کش کلاینت |
| `audit/log.ts` | ثبت لاگ عملیات |
| `audit/actions.ts` | اکشن‌های لاگ |
| `audit/snapshots.ts` | اسنپ‌شات‌ها |
| `audit/request-meta.ts` | متادیتای درخواست |
| `admin/dashboard-data.ts` | داده داشبورد ادمین |
| `admin/analytics-metrics.ts` | متریک‌های آنالیتیکس |
| `admin/lists-intelligence.ts` | هوش لیست‌ها |
| `admin/types.ts` | تایپ‌های ادمین |
| `schemas/item-metadata.ts` | اسکیمای متادیتای آیتم |

---

## 12. Hooks سفارشی

| Hook | توضیح |
|------|--------|
| `hooks/useCachedFetch.ts` | Fetch با cache |
| `hooks/useOutsideClick.ts` | تشخیص کلیک خارج |
| `hooks/usePermissions.ts` | بررسی سطح دسترسی |

---

## 13. Context‌ها

| Context | توضیح |
|---------|--------|
| `contexts/HomeDataContext.tsx` | داده صفحه اصلی (featured, trending, rising, recommendations) — React Query |

---

## 14. تایپ‌ها (`types/`)

| فایل | توضیح |
|------|--------|
| `next-auth.d.ts` | Augment NextAuth types (role, id) |
| `category-page.ts` | تایپ صفحه دسته |
| `curated.ts` | تایپ‌های کیوریتد |
| `items.ts` | تایپ‌های آیتم |

---

## 15. Middleware

**فایل**: `middleware.ts`

- Rate limiting برای همه API routes (Upstash Redis)
- احراز هویت NextAuth
- Matcher: `/api/*`, `/admin/*`, `/profile`
- اگر Upstash تنظیم نشده: rate limiting غیرفعال

---

## 16. تنظیمات Next.js

**فایل**: `next.config.js`

- Turbopack فعال (Next.js 16 default)
- Remote image patterns: `localhost`, `127.0.0.1`, هر HTTPS
- Sentry integration
- PWA (اختیاری)
- Server actions body limit: 2MB

---

## 17. اسکریپت‌ها (`scripts/`)

| اسکریپت | توضیح |
|---------|--------|
| `set-liara-config.ts` | ذخیره config Object Storage در DB |
| `migrate-all-images-to-liara.ts` | مهاجرت تصاویر به Liara |
| `replace-unsplash-with-picsum-and-upload.ts` | جایگزینی Unsplash با Picsum + آپلود |
| `seed-categories.ts` | seed دسته‌ها |
| `seed-movie-lists.ts` | seed لیست فیلم |
| `seed-more-lists.ts` | seed لیست‌های بیشتر |
| `create-bot-users.ts` | ساخت کاربران bot |
| `create-bot-list.ts` | ساخت لیست bot |
| `generate-placeholders.ts` | تولید placeholder |
| `generate-pwa-icons.ts` | آیکون‌های PWA |
| `export-database.ts` | خروجی دیتابیس |
| `update-images.ts` | بروزرسانی تصاویر |

---

## 18. تست

- **Unit**: Vitest + Testing Library (`vitest.config.ts`)
- **E2E**: Playwright (`playwright.config.ts`)
- تست‌های موجود: `lib/seo.test.ts`, `lib/trending/score.test.ts`, `lib/utils/number-converter.test.ts`, `lib/utils/slug.test.ts`, `components/shared/ErrorBoundary.test.tsx`

---

## 19. متغیرهای محیطی کلیدی

| متغیر | توضیح | محل استفاده |
|-------|--------|-------------|
| `DATABASE_URL` | آدرس PostgreSQL | Prisma |
| `DIRECT_URL` | آدرس مستقیم DB | Prisma |
| `NEXTAUTH_SECRET` | رمز JWT | NextAuth |
| `NEXTAUTH_URL` | آدرس پایه | NextAuth |
| `ENCRYPTION_KEY` | کلید رمزنگاری 32 کاراکتر | lib/encryption |
| `LIARA_BUCKET_NAME` | نام bucket | scripts (→ DB) |
| `LIARA_ENDPOINT` | آدرس S3 | scripts (→ DB) |
| `LIARA_ACCESS_KEY` | کلید دسترسی | scripts (→ DB) |
| `LIARA_SECRET_KEY` | کلید محرمانه | scripts (→ DB) |
| `UPSTASH_REDIS_REST_URL` | آدرس Redis (اختیاری) | rate-limit |
| `UPSTASH_REDIS_REST_TOKEN` | توکن Redis (اختیاری) | rate-limit |
| `NEXT_PUBLIC_APP_URL` | آدرس عمومی سایت | SEO |
| `NEXT_PUBLIC_SKIP_EXTERNAL_IMAGES` | غیرفعال‌سازی تصاویر خارجی | ImageWithFallback |
| `SENTRY_AUTH_TOKEN` | توکن Sentry | monitoring |
| `SENTRY_ORG` / `SENTRY_PROJECT` | تنظیمات Sentry | monitoring |

---

## 20. نکات مهم معماری

1. **Object Storage config از DB**: تنظیمات Liara/MinIO در جدول `settings` ذخیره‌اند (encrypted). اول باید `set-liara-config` اجرا شود.
2. **تصاویر همیشه از Object Storage**: هر تصویر خارجی اول به Liara/MinIO آپلود و بعد URL نهایی استفاده می‌شود.
3. **Soft Delete**: لیست‌ها، دسته‌ها و کاربران با `deletedAt` حذف نرم می‌شوند.
4. **Vibe Moderation Engine**: سیستم امتیاز پرچم وزنی (`flagScore`) برای مدیریت خودکار محتوا.
5. **Curator Gamification**: سیستم امتیاز و سطح کیوریتور (7 سطح) + دستاوردها + اسپاتلایت.
6. **ISR**: صفحه اصلی با `revalidate = 60` (هر 60 ثانیه).
7. **Admin Layout 2.0**: سایدبار جمع‌شدنی + هدر + MiniUserPanel + QuickCreateFab.
8. **کامنت دو سطحی**: کامنت روی آیتم (`comments`) + کامنت روی لیست (`list_comments`) با پاسخ یک سطحی.

---

## 21. جریان داده صفحه اصلی

```
app/page.tsx
  └── HomeDataProvider (React Query → /api/lists/home)
        ├── HomeHeroSpotlight (featured list + slot tracking)
        ├── TrendingThisWeekCarousel (trending lists)
        ├── UtilityModule
        ├── CreatorSpotlightSection
        ├── NewAndRisingSection (rising lists)
        ├── ForYouSection (recommendations)
        ├── CategoryGridHome
        └── BottomCTASection
```

---

*این فایل برای استفاده Cursor IDE و درک سریع پروژه توسط AI assistant تولید شده است.*
