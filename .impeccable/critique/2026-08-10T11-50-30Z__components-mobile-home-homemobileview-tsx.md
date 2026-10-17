---
target: home page / HomeMobileView
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
p2_count: 2
timestamp: 2026-08-10T11-50-30Z
slug: components-mobile-home-homemobileview-tsx
---
# Critique — Wibe mobile home (post A+B)

**Target:** `components/mobile/home/HomeMobileView.tsx`  
**Mode:** Operate (save-first discovery)  
**Observed:** logged-in mobile ~390×844 at `http://localhost:3003/`

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Save pressed clear; deferred Saved/For You stuck as empty pulse |
| 2 | Match System / Real World | 3 | Persian lifestyle voice; اکسپلور vs ترند still needs a map |
| 3 | User Control and Freedom | 3 | Bookmark toggle + nav exits |
| 4 | Consistency and Standards | 3 | White-glass → indigo save coherent; dual trees remain |
| 5 | Error Prevention | 3 | Guest save gated |
| 6 | Recognition Rather Than Recall | 3 | Labeled nav, covers, visible bookmark |
| 7 | Flexibility and Efficiency | 2 | Returner accelerators (Saved / For You) do not load live |
| 8 | Aesthetic and Minimalist Design | 3 | Tabs gone; empty deferred shells waste mid-stack |
| 9 | Error Recovery | 3 | Optimistic save + error toast coded (failure not forced live) |
| 10 | Help and Documentation | 2 | No live cue for ترند vs اکسپلور |
| **Total** | | **27/40** | **Acceptable (~68%)** |

## Design Specificity Verdict

**LLM:** Reads as Wibe. Single trending sentence replaces peer-tab shell. Residual catalog-PWA chrome (rail, BottomNav, chips). Logged-in personalization loop currently missing live because deferred sections fail to resolve.

**Deterministic scan:** `detect.mjs --json components/mobile/home` → exit 0, **0 findings**.

**Visual overlays:** Mutation OK; detect.js from `:8401` injected; live-server stopped. No overlay markers / impeccable console (clean scan). Next.js DevTools «N» is not impeccable.

## Overall Impression

Tab-level discovery overlap is fixed and save remains legible. Score flat at 27 because a new P1 replaced the old one: logged-in «ذخیره‌شده‌ها / برای تو» never land — empty pulse shells then chips.

## What's Working

1. Single feed lane — «ترند این هفته» + «همه ترندها»; no ترند/برای تو tabs
2. High-contrast save on hero + trend cards
3. Distilled first stack — no Explore teaser; chips after feed

## Priority Issues

### [P1] Logged-in personal stack never resolves
- **What:** After trending, two deferred shells stay empty/pulse; chips jump next. Bookmarks API can return data while UI stays blank.
- **Why:** Returner peak-end (mine → for you) is the Operate promise.
- **Fix:** Eager-mount or fail visibly; Saved before For You; never leave aria-hidden pulse forever.
- **Suggested command:** `$impeccable harden` / `$impeccable optimize`

### [P2] Residual catalog doors
- **What:** همه ترندها + لیست‌ها + اکسپلور + chips still compete after the single lane.
- **Why:** Soft reopen of discovery split.
- **Fix:** Keep Home = spotlight + trend; clarify mood = Explore only.
- **Suggested command:** `$impeccable clarify` / `$impeccable distill`

### [P2] First-viewport density
- **What:** Tall hero + search + trend rail before calm pause.
- **Why:** Operate scanability taxed.
- **Fix:** Shorten hero copy/meta on mobile.
- **Suggested command:** `$impeccable quieter` / `$impeccable layout`

### [P3] Dual tree / skeleton a11y · Dev overlay on Profile
- **Suggested command:** `$impeccable audit` / ignore DevTools in prod

## Prior P1 Closure Verdict

| Prior P1 | Status | Evidence |
|----------|--------|----------|
| Discovery pile-up after hero | **CLOSED** | No teaser; chips after feed; one trend lane |
| Save invisible on hero/trend | **CLOSED** | White-glass / indigo controls visible |
| Trend / For You / Explore split | **PARTIAL** | Peer tabs gone; For You deferred but often absent live; BottomNav still peers |
| Overlapping doors (logged-in) | **PARTIAL→new hole** | Tab overlap closed; broken Saved→For You is the new major hole |

## Persona Red Flags

**Casey (returner):** Expects ذخیره‌شده‌ها; gets blank shells then chips.  
**Jordan (first-timer):** Above-fold clearer; still unclear why اکسپلور ≠ ترند.  
**Sam (a11y):** Deferred regions aria-hidden while pulsing; duplicate desktop trees.

## Minor Observations

PTR copy present. Three chips = healthy chunk. Toast `bottom-24` not forced-fail verified. Guest flash before session hydrate.

## Questions to Consider

1. Why do logged-in users hit two empty shells instead of ذخیره‌شده‌ها before chips?
2. Does «همه ترندها» need to sit beside an already-titled trend lane when لیست‌ها exists in nav?
3. When deferred personalization fails — silence, or one-line retry?
