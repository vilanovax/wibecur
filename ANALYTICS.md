# آنالیتیکس – وایب‌کر

از **Vercel Analytics** برای ردیابی استفاده می‌شود. اگر روی Vercel دیپلوی شود، آمار صفحات و eventهای سفارشی به‌طور خودکار ثبت می‌شوند.

---

## نصب

پکیج `@vercel/analytics` نصب شده و کامپوننت `<Analytics />` در `app/layout.tsx` قرار دارد. نیازی به متغیر محیطی اضافه نیست.

---

## eventهای ثبت‌شده

| Event | توضیح | دادهٔ اختیاری |
|-------|-------|----------------|
| `list_bookmark` | ذخیرهٔ لیست در بوکمارک | `listId` |
| `list_unbookmark` | حذف لیست از بوکمارک | `listId` |
| `list_create` | ساخت لیست شخصی | - |
| `item_save` | افزودن آیتم به لیست شخصی | `itemId`, `listId` |
| `follow` | دنبال کردن کیوریتور | `targetUserId` |
| `search` | جستجو | `query`, `source` (chip \| input) |
| `comment_submit` | ارسال کامنت | - |
| `share` | اشتراک‌گذاری (مثلاً دستاورد) | `type`, `achievementCode` |

---

## نحوهٔ استفاده

برای ثبت event سفارشی:

```ts
import { track } from '@/lib/analytics';

track('event_name', { key: 'value' });
```

نام event باید از نوع `AnalyticsEvent` در `lib/analytics.ts` باشد. برای eventهای جدید، آن را به `AnalyticsEvent` اضافه کن.

---

## مشاهدهٔ آمار

- **Vercel Dashboard** → پروژه → تب **Analytics**
- صفحه‌بینی‌ها به‌صورت خودکار ثبت می‌شوند
- eventهای سفارشی در تب **Custom Events** نمایش داده می‌شوند (نیاز به پلن Pro ممکن است باشد)

---

## نکات

- در محیط dev و بدون دیپلوی روی Vercel، eventها ثبت می‌شوند اما ممکن است در داشبورد نمایش داده نشوند
- برای سرویس‌های دیگر (مثلاً Google Analytics، PostHog) می‌توان `lib/analytics.ts` را گسترش داد تا هم‌زمان به آن‌ها هم ارسال کند
