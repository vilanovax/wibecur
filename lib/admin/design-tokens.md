# Admin 2.0 – Design Tokens (مرجع استفاده)

توکن‌ها در `lib/design-tokens.ts` تعریف و در `tailwind.config.ts` به Tailwind وصل شده‌اند.

---

## رنگ‌ها

| کاربرد | کلاس Tailwind (مثال) |
|--------|----------------------|
| پس‌زمینه صفحه ادمین | `bg-admin-bg` |
| کارت | `bg-admin-card` |
| پس‌زمینه ملایم | `bg-admin-muted` |
| حاشیه | `border-admin-border` |
| متن اصلی | `text-admin-text-primary` |
| متن ثانویه | `text-admin-text-secondary` |
| برچسب‌ها | `text-admin-text-tertiary` |
| موفقیت | `text-admin-status-success` یا `bg-admin-status-bg-success` |
| هشدار | `text-admin-status-warning` یا `bg-admin-status-bg-warning` |
| خطر | `text-admin-status-danger` یا `bg-admin-status-bg-danger` |
| خنثی | `text-admin-status-info` یا `bg-admin-status-bg-info` |
| غیرفعال | `text-admin-status-disabled` |
| ترند | `text-intelligence-trending` |
| بوست | `text-intelligence-boost` |
| آنالیتیکس | `text-intelligence-analytics` |

---

## سایه و شعاع

| کاربرد | کلاس |
|--------|------|
| کارت | `shadow-admin rounded-admin-xl` |
| مودال / دراپ‌داون | `shadow-admin-lg rounded-admin-xl` |
| دکمه | `rounded-admin-lg` |
| اینپوت | `rounded-admin-md` |
| تگ / بج | `rounded-full` |

---

## تایپوگرافی ادمین

| کاربرد | کلاس |
|--------|------|
| عدد KPI | `text-admin-2xl font-semibold` |
| عنوان کارت | `text-admin-lg font-semibold` |
| عنوان سکشن | `text-admin-xl font-semibold` |
| برچسب | `text-admin-sm` |
| متادیتا | `text-admin-xs` |

---

## سلسله‌مراتب دکمه

- **Primary:** `bg-indigo-600 text-white hover:bg-indigo-700` (یا از primary برند)
- **Secondary:** `bg-admin-muted text-admin-text-primary hover:bg-admin-border`
- **Danger:** `bg-admin-status-danger text-white hover:opacity-90`

---

## حالت‌های بصری (State-Based)

| حالت | کلاس نمونه |
|------|-------------|
| سالم | `border-r-4 border-admin-status-success` (RTL: border راست) |
| در حال افت | `border-r-4 border-admin-status-danger` |
| نیازمند Boost | بج نارنجی `bg-admin-status-bg-warning text-admin-status-warning` |
| غیرفعال | `opacity-60` |
| ترند | `ring-2 ring-intelligence-trending/20` |

```tsx
className={clsx(
  'rounded-admin-xl p-6 shadow-admin',
  isDeclining && 'border-r-4 border-admin-status-danger',
  isTrending && 'ring-2 ring-intelligence-trending/20'
)}
```

---

## Dark Mode

ساختار توکن برای حالت تیره در `adminDark` آماده است؛ پیاده‌سازی با CSS vars یا کلاس `dark:` در مرحله بعد.
