# Performance optimizations (2026-08)

Changelog for the consumer performance pass on **home**, **category**, and **list** pages, plus admin bundle splits and ops baselines.

## Goals

- Faster TTFB / streaming shell (Header + BottomNav before payload)
- Smaller client hydration payload (no double-serialize of RSC data)
- Lower CLS on desktop Lighthouse (home / list)
- Safer DB indexes without locking production tables
- Measurable baseline for before/after

## Baseline (desktop Lighthouse)

Captured via `npm run lighthouse:prod` → `perf/baselines/latest.json`.

### Before CLS fixes

| Page | Perf | A11y | LCP | CLS |
| --- | ---: | ---: | ---: | ---: |
| home `/` | 73 | 95 | ~1.5s | **0.614** |
| category `/categories/movies` | 98 | 95 | ~1.1s | 0.003 |
| list `/lists/great-breakfast-cafes` | 92 | 95 | ~0.9s | **0.175** |

### After CLS fixes (`post-cls-fix`)

| Page | Perf | A11y | LCP | CLS |
| --- | ---: | ---: | ---: | ---: |
| home `/` | **93** | 95 | ~1.7s | **0.003** |
| category `/categories/movies` | 98 | 95 | ~1.0s | 0.003 |
| list `/lists/great-breakfast-cafes` | **99** | 95 | ~1.0s | **0.003** |

Re-run after deploy:

```bash
npm run build
DISABLE_HSTS=true PORT=3011 npm run start   # or: npm run start:lhci
# other terminal
LHCI_BASELINE_LABEL=post-cls npm run lighthouse:prod
```

Local tip: do **not** serve `Strict-Transport-Security` on loopback (`DISABLE_HSTS=true`); Chrome will interstitial HTTP→HTTPS and LHCI fails with `CHROME_INTERSTITIAL_ERROR`.

## What changed

### Caching & data

- ISR restored: auth out of root layout; optional client `SessionProvider`
- `getSettings` / home / category menu / list-by-slug: `React.cache` + `unstable_cache` + public tags
- View count: `POST /api/lists/[id]/view` + beacon (no blocking SSR write)
- Prisma indexes (applied on current DB with `CONCURRENTLY`):
  - `items_listId_deletedAt_order_idx`
  - `list_likes_listId_createdAt_idx`
  - category list indexes + `users_role_idx` (already present)
  - `pg_trgm` GIN on item / catalog titles
- Manual SQL (no `_prisma_migrations` on this DB — do **not** blind `migrate deploy`):
  - `prisma/migrations/manual_add_list_perf_indexes.sql`
  - `prisma/migrations/manual_add_perf_indexes.sql`

### Home

- SSR category chips
- Slim client seed: `lib/home-page-client-seed.ts` (`toHomeClientSeed`) — featured id stub; strip description / hero image fields from cards
- Suspense streaming: `HomeContent` under `Suspense` + `HomePageSkeleton` sized like desktop/mobile first viewport
- Hero / trending slots no longer flash on every `isRefetching`
- Deferred sections reserve `min-h` to reduce skeleton→content CLS
- Variable Vazirmatn; `date-fns` deep imports + `optimizePackageImports`

### Category

- Slim client seed: `lib/category-page-client-seed.ts`
- No SSR→client swap on refetch (`refetchOnWindowFocus: false`)

### List detail

- Windowed grid (24 + IntersectionObserver) in `ListDetailClient`
- Nested batching + **`content-visibility: auto`** on grid cells (`ListItemsGrid`)
- Hero: dual CSS layouts (`lg:grid` / `lg:hidden`) instead of `useIsDesktop()` — removes hydration CLS when SSR snapshot is mobile and client is desktop
- Comments: cursor pagination (`useInfiniteQuery`)
- Similar lists: candidate titles `take: 80`

### Explore

- Suspense around payload so Header/BottomNav stream first

### Admin

- `next/dynamic` for KPI (recharts), analytics, dashboard, pulse, settings
- Settings panels lazy per tab
- Content hub views (people / catalog / import / …) lazy; lists view stays eager

### Profile

- `EditProfileSheet2` loaded only when the sheet opens
- Profile hero gradient uses `--primary-*` tokens (DESIGN.md)

## Reverse-proxy cache (ops)

App already sets `Cache-Control` on public JSON (home, browse, list items, …). At the edge/reverse proxy:

| Path pattern | Suggested |
| --- | --- |
| `/` , `/categories/*` , `/lists/*` (HTML) | honor Next `s-maxage` / ISR; or short CDN TTL 30–60s with purge on admin publish |
| `/api/lists/home` | `s-maxage=300` (already on response) |
| `/api/lists/browse` | `s-maxage=300` |
| `/_next/static/*` | immutable long cache |
| Authed `/api/user/*` | never shared cache |

Invalidate via existing `lib/public-cache.ts` tags when lists/categories change in admin.

## Important DB note

The configured Postgres has **no** `_prisma_migrations` table (schema was evolved with `db push`).  

- Prefer `manual_add_*.sql` with `CREATE INDEX CONCURRENTLY IF NOT EXISTS`
- Do not run `prisma migrate deploy` until migrations are baselined / resolved

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run lighthouse:ci` | LHCI against `LHCI_BASE_URL` |
| `npm run lighthouse:prod` | home + category + list + write `perf/baselines/` |
| `npm run lighthouse:baseline` | snapshot only from `.lighthouseci/` |

## Follow-ups

- Drive home CLS below 0.1 if still high after skeleton match (font/session chrome)
- True virtualizer (`@tanstack/react-virtual`) only if lists regularly exceed ~200 visible cells
- Baseline `_prisma_migrations` on prod when ready for formal migrate history
