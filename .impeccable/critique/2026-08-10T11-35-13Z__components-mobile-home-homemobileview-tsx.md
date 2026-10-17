---
target: home page / HomeMobileView
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
p2_count: 2
timestamp: 2026-08-10T11-35-13Z
slug: components-mobile-home-homemobileview-tsx
---
# Critique — Wibe mobile home (post distill + polish)

**Target:** `components/mobile/home/HomeMobileView.tsx`  
**Mode:** Operate (save-first discovery)  
**Observed:** logged-in mobile ~390×844 at `http://localhost:3003/`

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Tab/nav/save pressed clear; bookmark API failures silent |
| 2 | Match System / Real World | 3 | Persian lifestyle voice; ترند/برای تو/اکسپلور still need a map |
| 3 | User Control and Freedom | 3 | Save toggle + nav exits; guest save → login |
| 4 | Consistency and Standards | 2 | Indigo saved coherent; discovery vocabulary still split |
| 5 | Error Prevention | 3 | Guest save gated; unsave one-tap (ok for bookmark) |
| 6 | Recognition Rather Than Recall | 3 | Covers + bookmark; titles on heavy gradients truncate |
| 7 | Flexibility and Efficiency | 3 | Tabs, PTR, BottomNav shortcuts |
| 8 | Aesthetic and Minimalist Design | 3 | Chips demoted, home footer gone; mid-band still dense |
| 9 | Error Recovery | 2 | Save catch leaves UI unchanged — no toast/retry |
| 10 | Help and Documentation | 2 | For You tip in source; no live cue for ترند vs اکسپلور |
| **Total** | | **27/40** | **Acceptable (~68%)** |

## Design Specificity Verdict

**LLM:** Surface reads as Wibe, not a generic feed shell. RTL Vazirmatn, indigo primary, amber «منتخب هفته», lifestyle covers, and Persian save-first copy are product-locked. Distilled IA (hero → one feed lane → saved → secondary chips) matches the curated-lists brief. Residual generic PWA chrome: pill feed tabs, horizontal rail, four-item bottom nav competing with Home’s discovery labels.

**Deterministic scan:** `detect.mjs --json components/mobile/home` → exit 0, **0 findings** (`[]`).

**Visual overlays:** [Human] injection succeeded via live-server `:8401` — 24 overlay nodes (layout animation, low contrast text, nested cards, image hover transform). Server stopped after capture. No `impeccable` console messages despite successful DOM overlay.

## Overall Impression

Distill + polish closed the two biggest first-viewport failures: discovery pile-up and invisible save. The home now leads with cinematic spotlight and a practiceable save loop. The remaining structural debt is logged-in discovery vocabulary — ترند / برای تو / اکسپلور / لیست‌ها still compete after the hero.

## What's Working

1. Hero «منتخب هفته» owns the first composition — amber badge, «مشاهده لیست», visible save.
2. Save affordance is high-contrast on discovery (white-glass → indigo filled) on hero, trend cards, and saved rail.
3. Distilled stack live: hero → feed → ذخیره‌شده‌ها → secondary chips; marketing footer absent on mobile home.

## Priority Issues

### [P1] Overlapping discovery doors (logged-in)
- **What:** After hero: «ترند» + «برای تو» + «همه ترندها» + BottomNav «اکسپلور» + «لیست‌ها» + category chips.
- **Why:** Save-first success needs one clear lane; multiple catalog doors reintroduce the old split.
- **Fix:** Home = spotlight + one default lane; mood/browse stay on Explore/Lists; For You as deferred personalization.
- **Suggested command:** `$impeccable distill` / `$impeccable shape`

### [P2] Silent save failure
- **What:** Bookmark toggle catch swallows errors; no toast/retry.
- **Why:** Core loop can fail without status.
- **Fix:** Optimistic UI + error toast + honest pressed state.
- **Suggested command:** `$impeccable harden`

### [P2] First-viewport density
- **What:** Search + tall hero + tabs + rail still stack before a calm pause.
- **Why:** Operate scanability taxed despite chip demotion.
- **Fix:** Shorten hero copy/meta on mobile; one primary action weight.
- **Suggested command:** `$impeccable quieter` / `$impeccable layout`

### [P3] Dual tree / a11y duplication
- **What:** Mobile + desktop trees both in DOM; chips/mood may announce twice.
- **Why:** Screen-reader noise.
- **Fix:** `aria-hidden` / inert on inactive breakpoint tree.
- **Suggested command:** `$impeccable audit`

### [P3] Rising amber not on live home rail
- **What:** Trend cards show no rising badge; amber only on «منتخب هفته».
- **Why:** Intent not visible on current home discovery.
- **Fix:** Surface on qualifying cards or drop expectation.
- **Suggested command:** `$impeccable polish`

## Prior P1 Closure Verdict

| Prior P1 | Status | Evidence |
|----------|--------|----------|
| Discovery pile-up after hero | **CLOSED** | No Explore teaser; chips below feed/saved; post-hero = feed + one rail |
| Save invisible on hero/trend | **CLOSED** | White-glass / indigo save controls visible & tappable |
| Trend vs For You vs Explore split | **PARTIAL** | For You hidden for guests; logged-in still has parallel doors |

## Persona Red Flags

**Casey (mobile, logged-in):** «ترند» next to «برای تو» while thumb also has «اکسپلور» — unclear which door is today’s job.

**Jordan (first-timer / guest):** Source hides For You/Saved (good); guest save → login; no home cue explaining why Explore exists.

**Sam (a11y):** Duplicate regions in a11y tree; hero badge `aria-hidden`; DevTools overlay can obscure BottomNav.

## Minor Observations

- PTR copy «رها کن تا بروز شود» present.
- Three category chips — healthy chunk size.
- Only logged-in state live-verified this run.

## Questions to Consider

1. If Home’s job is save-first spotlight, why does a logged-in thumb still get a second personalization tab *and* a peer «اکسپلور»?
2. Should «همه ترندها» exist beside an active «ترند» tab?
3. When hero save fails, silence — or a one-line recovery?
