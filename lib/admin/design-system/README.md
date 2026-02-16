# Admin Design System — Wibe

سیستم طراحی مخصوص **Control, Debug, Intelligence**.

- **Data-first** — اول داده، بعد تزئین
- **Semantic colors** — primary, success, warning, danger, info, trending
- **Consistent** — radius، spacing، shadow یکسان
- **Structured** — hierarchy واضح، بدون گرادینت تزئینی

## توکن‌ها

- `lib/admin/design-system/tokens.ts`  
  رنگ‌ها، فاصله‌ها، radius، shadow، تایپوگرافی، وضعیت‌های متنی (Active, Inactive, …).

## کامپوننت‌ها

- `components/admin/design-system/`  
  - **AdminCard** — variant: default | success | warning | danger | neutral  
  - **MetricCard** — title, value, delta, trend, icon  
  - **Badge** — success | warning | danger | neutral | trending  
  - **ActionButton** — primary | secondary | ghost | danger  
  - **IntelligenceHeaderBar** — عنوان، breadcrumb، اکشن‌ها  
  - **DebugTable** — جدول داده با ستون‌های تعریف‌شده  

## استفاده

```tsx
import {
  AdminCard,
  MetricCard,
  Badge,
  ActionButton,
  IntelligenceHeaderBar,
  DebugTable,
} from '@/components/admin/design-system';
import { adminSpacing, adminRadius } from '@/lib/admin/design-system';
```

## Primary

`#6366F1` (indigo) — CTA، active state، لینک‌ها.

## Layout

- Sidebar: 260px (در layout ادمین)
- Main max-width: 1440px (در صورت نیاز در layout قابل تنظیم)
- Section gap: 32px · Card gap: 24px · Inner padding: 20px
