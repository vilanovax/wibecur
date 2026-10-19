═══════════════════════════════════════════════════════════
VERDICT: Conditional Pass (Phase 7 Top findings closed; LCP + F-07 remain)

Persona: sara-friday-evening (سارا، ۲۸ ساله، عصر جمعه خسته — موبایل‌اول)
Surfaces audited: 8 / focused set (/, /explore, /lists/[slug]×3, /profile, /search, /user-lists redirect)

Hard Gates: console errors 0, warnings 0, network 5xx 0, axe Critical 0, axe Serious color-contrast **PASS** (white on `#4F46E5` ≈ 6.29:1), LCP still FAIL on empty list (~5s historically), Manifest complete for focused scope

Findings (after Phase 7 round 2):
  Critical: 0    High remaining: 1 (F-07)    Medium: 6    Low: 3
  Fixed this round: F-03, F-04, F-05, F-06 (+ earlier F-01, F-02)
  Also fixed: search title double brand (F-11 partial)

TOP remaining:
  1. F-07 Auth UI flicker
  2. LCP hard-gate on empty / heavy list routes
  3. Medium cluster (F-08…F-10, F-12…F-14)
═══════════════════════════════════════════════════════════

# UX Audit — Wibe focused set (Sara)

**Date:** 2026-08-09  
**URL:** http://localhost:3000  
**Scope:** First Contact, discovery (film + café), share loop, create-list, empty list, search intent, mobile 390×844  
**Out of scope:** Admin panel, full 11-scenario battery, keyboard-only exhaustive

## Persona (locked)

سارا، ۲۸ ساله، عصر جمعه خسته. می‌خواهد سریع «چی ببینه / کجا بره» را پیدا کند. حوصلهٔ تنظیمات و اصطلاحات داخلی محصول را ندارد. موبایل‌اول.  
همراه: first-time-user lens روی هر flow چند صفحه‌ای.

---

## Phase 7 — fixes shipped

### F-01 — Create list loop — FIXED (earlier)
- CreateSheet opens `CreateListForm` in-place; explore deep-link honors category during skeleton.

### F-02 — Movie posters — FIXED (earlier)
- Eager priority + geometry fallback for first 8 covers.

### F-03 — axe color-contrast — FIXED
- Primary darkened `#6366F1` → `#4F46E5` (tokens + `globals.css` + themeColor/manifest + DESIGN.md)
- Measured on search chip «آیتم‌ها»: **6.29:1** at 12px caption (AA ≥4.5)
- Evidence: `11-search-cafe-chip-contrast.png`

### F-04 — Location search honesty — FIXED
- `buildItemSearchWhere` / title path now AND meaningful tokens (like catalog)
- Scoring zeros multi-token misses; haystack includes neighborhood/area
- Empty copy: «نتیجه‌ای برای «کافه ولیعصر» نیست»
- Evidence: `12-search-valiasr-honest-empty.png`
- Tests: `lib/search-keywords.test.ts` (19 passing)

### F-05 — Duplicate H1 — FIXED
- Sticky header title is `<p>` (not h1)
- List detail dual hero trees use `aria-hidden` via `useIsDesktop` (layout still CSS `lg:`)
- Verified mobile: **1 exposed h1** (desktop twin aria-hidden)

### F-06 — Featured CTA click — FIXED
- Decorative layers `pointer-events-none`; content layer `relative z-10`
- Verified: click near CTA navigates to `/lists/films-i-that-do-bar-baid-did`

### F-11 (partial) — Double brand title — FIXED
- Search metadata title is `جستجو` (layout template adds `| WibeCur`) → document title `جستجو | WibeCur`

---

## Hard-gate scorecard

| Gate | Result | Notes |
|------|--------|-------|
| Console errors | Pass | 0 observed |
| Console warnings | Pass* | 0 captured (*no audit-config allowlist) |
| Network 5xx | Pass | 0 |
| Auth 403/404 | Pass | 0 |
| Layout collapse | Pass | no overflow catastrophe at 390 |
| axe Critical | Pass | 0 |
| axe Serious | **Pass** | primary chip contrast 6.29:1 |
| LCP < 4.0s | **FAIL** | historically ~5.03s on empty list route |
| CLS < 0.25 | Pass | 0 |
| Manifest complete | Pass (focused) | |

---

## Findings

### Critical

#### F-01 — Mobile create-list category hop — FIXED
See Phase 7 above.

### High

#### F-02 — Featured movie posters — FIXED
#### F-03 — axe Serious color-contrast — FIXED
#### F-04 — Location/intent search over-match — FIXED
#### F-05 — Duplicate H1 / dual trees — FIXED (AT exposure)
#### F-06 — Featured CTA click reliability — FIXED
#### F-07 — Auth UI flicker / contradictory chrome — OPEN
- Brief «ورود به حساب» then account menu; trust confusion mid-create/share

### Medium

#### F-08 — `/user-lists` silent redirect to `/explore`
#### F-09 — CreateSheet / BottomSheet missing `role="dialog"`
#### F-10 — Filtered list items stay in accessibility tree
#### F-11 — Brand inconsistency وایب vs WibeCur — partially fixed (title doubling gone)
#### F-12 — Explore mood sheet can intercept clicks
#### F-13 — Admin moderation controls in consumer comments
#### F-14 — Home missing H1 (`page-has-heading-one`)

### Low

#### F-15 — `@ admin` spacing oddity in profile handle  
#### F-16 — Duplicate landmark nesting  
#### F-17 — `image-redundant-alt` on home cards  

### Positive (preserve)

- Explore mood copy is persona-perfect for Sara  
- Share toast «لینک کپی شد» is clear and fast  
- Empty list state + «افزودن اولین آیتم» is textbook  
- In-list search with result count works visually  
- Café list imagery and map affordance feel alive  
- Honest multi-token empty search now matches Sara’s mental model  

---

## Scenario battery (focused)

| # | Scenario | Result |
|---|----------|--------|
| 1 | First Contact | Pass — hero CTA navigates |
| 2 | Interrupted create | Pass — in-place form (F-01) |
| 3 | Wrong turn `/user-lists` | Fail soft — silent redirect |
| Auth gate | Guest create | Partial — F-07 flicker remains |
| Share loop | Logged-in share | Pass |
| Empty state | Empty curated list | Pass |
| Search intent | کافه ولیعصر | Pass — honest empty |
| Mobile 390 | Core paths | Pass layout + posters |

---

## Perfection roadmap (next)

1. Stabilize auth chrome hydration (F-07)  
2. Perf pass on list detail LCP  
3. Medium a11y cluster (dialog role, filtered items, home H1)  
4. Soft-land `/user-lists` redirect copy  

---

## Evidence paths

Screenshots under: `.impeccable/ux-audit/2026-08-09-sara-focused/screenshots/`  
Key new: `11-search-cafe-chip-contrast.png`, `12-search-valiasr-honest-empty.png`  
Prior: `01-home-mobile.png` … `10-movie-posters-after-fix.png`
