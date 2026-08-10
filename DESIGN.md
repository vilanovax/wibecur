---
name: Wibe
description: Mobile-first RTL curated lifestyle lists — save-first discovery
colors:
  # Indigo-600 for AA contrast of white-on-primary at caption size (was #6366F1 ≈ 4.47)
  primary: "#4F46E5"
  primary-dark: "#4338CA"
  primary-light: "#818CF8"
  surface: "#F8FAFC"
  card: "#FFFFFF"
  background: "#FFFFFF"
  border: "#E2E8F0"
  text: "#0F172A"
  text-muted: "#64748B"
  text-subtle: "#94A3B8"
  success: "#10B981"
  warning: "#F59E0B"
  hot: "#F59E0B"
  danger: "#EF4444"
  info: "#3B82F6"
typography:
  display:
    fontFamily: "Vazirmatn, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: "44px"
  h1:
    fontFamily: "Vazirmatn, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: "40px"
  h2:
    fontFamily: "Vazirmatn, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: "34px"
  h3:
    fontFamily: "Vazirmatn, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: "28px"
  body:
    fontFamily: "Vazirmatn, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "26px"
  small:
    fontFamily: "Vazirmatn, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "22px"
  caption:
    fontFamily: "Vazirmatn, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "18px"
rounded:
  sm: "8px"
  md: "14px"
  lg: "20px"
  xl: "28px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  "2xl": "32px"
  "3xl": "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"
    textColor: "#FFFFFF"
  chip-active:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
  empty-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
---

## Overview

Consumer UI is **Operate + Experience**: RTL Persian, Vazirmatn, slate surfaces, indigo primary, amber for hot/trend. Atmosphere comes from list imagery and mood cards — not purple/pink decorative gradients. Source of truth in code: `lib/design-tokens.ts`, `app/globals.css`, presets `wibe-*`.

**Contract for new work + migration:** [`docs/CONSUMER_DESIGN_TOKENS.md`](docs/CONSUMER_DESIGN_TOKENS.md) · audit: `npm run audit:design-tokens`

## Colors

- **Primary (indigo)** — CTA، ویژه، لینک فعال
- **Warning / hot (amber)** — ترند، وایرال، بج منتخب هیرو
- **Surfaces** — background white، surface `#F8FAFC`، card white، border slate-200
- **Text** — foreground slate-900، secondary slate-500
- Do not use legacy purple/pink for consumer trend accents
- **Light-only:** never add `.dark` to the document; `.dark { … }` in `globals.css` is reserved/unused until PRODUCT flips the decision. `prefers-color-scheme: dark` is overridden to light.

## Typography

Use role classes only in new work:

| Role | Class |
|------|--------|
| Display | `wibe-display` |
| Title | `wibe-h1` … `wibe-h3` |
| Body | `wibe-body` |
| Secondary | `wibe-small` |
| Meta | `wibe-caption` |

Avoid raw `text-sm` / `text-gray-*` on consumer surfaces.

## Layout

- Mobile-first; desktop shell max ~1200px (`.wibe-desktop-shell`)
- Bottom nav: خانه · لیست‌ها · اکسپلور · پروفایل
- Safe-area on fixed chrome; sheets use `overscroll-contain`
- First viewport on home: search sticky + hero + one trending lane; For You deferred below saved for logged-in; category chips demoted (mood stays on `/explore`)
- Lists (`/lists`): catalog — browse modes own sort (ترند/جدید/محبوب); category chips first; featured «منتخب» demoted; filter sheet = advanced only (no sort, no mood; «حداقل ذخیره» not star ratings)
- Explore (`/explore`): mood-first 2×2 owns first viewport; QuickNow + داغ deferred below fold; categories via quiet link to Lists — not a full catalog grid

## Elevation & Depth

Shadows: `shadow-vibe-sm` / `shadow-vibe-card` / `shadow-vibe-hero` / `shadow-vibe-floating`. Prefer subtle depth; hero may use image + dark gradient for type readability.

## Shapes

Radius scale 8 / 14 / 20 / 28 / pill. Cards and sheets commonly `rounded-2xl` / `rounded-xl`. Empty states: dashed `border-wibe` card.

## Components

- **WibeButton** — primary / secondary / ghost / outline
- **WibeEmptyState** — standard empty (icon ring + title + description + actions)
- **WibeSection** / **WibeCard** — section chrome
- Mood cards — soft per-mood gradients from config, not global purple wash
- Focus — `focus-visible:ring-*` preferred; search uses `focus-within`

## Do's and Don'ts

**Do**
- Keep Explore mood-first (`/explore`) and Lists as catalog (`/lists`)
- Use amber for hot/trend; indigo for CTA
- Honor `prefers-reduced-motion`
- Animate `transform` / `opacity` / explicit color props — not `transition-all`

**Don't**
- Stack browse mode + vibe chips + filters all visible at once
- Use emoji-only empty states with gray utilities
- Lock pinch-zoom (`maximumScale: 1`)
- Treat `/user-lists/[id]` as Explore (that route is personal list detail)
