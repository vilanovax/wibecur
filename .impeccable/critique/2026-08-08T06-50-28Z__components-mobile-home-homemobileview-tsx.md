---
target: home page / HomeMobileView
total_score: 23
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 3
p2_count: 2
timestamp: 2026-08-08T06-50-28Z
slug: components-mobile-home-homemobileview-tsx
---
# Critique — Wibe mobile home

**Target:** `components/mobile/home/HomeMobileView.tsx`  
**Mode:** Operate (save-first discovery)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Home/Trend active clear; save feedback only on already-saved rail |
| 2 | Match System / Real World | 4 | Persian RTL lifestyle language + metaphors |
| 3 | User Control and Freedom | 3 | Nav + see-all exits; guest For You soft-gate |
| 4 | Consistency and Standards | 2 | Green save badge vs indigo brand; Explore teaser + tab + chips |
| 5 | Error Prevention | 2 | Same «مشاهده همه» label → different destinations |
| 6 | Recognition Rather Than Recall | 3 | Mood discovery must be recalled as Explore |
| 7 | Flexibility and Efficiency | 2 | No fast save on hero/feed; create-list absent |
| 8 | Aesthetic and Minimalist Design | 2 | Equal-weight module stack + footer dead space |
| 9 | Error Recovery | 2 | Guest For You login only; weak empty recovery |
| 10 | Help and Documentation | n/a | Operate home; inline activation enough |
| **Total** | | **23/36** | **Acceptable** |

## Design Specificity Verdict

**LLM:** Mostly Wibe-specific (hero «منتخب هفته», mood copy, lifestyle covers, saved rail) with a generic mid-band discovery stack (chips → teaser → tabs → carousels) that could transfer to many content apps.

**Deterministic scan:** `detect.mjs` on `components/mobile/home` → **0 findings**. Manual grep: 2× intentional `bg-gray-900` hero backdrops; 0 arbitrary `text-[Npx]`; 0 violet classes (brand via `primary`); emoji chips data-driven; `focus-visible` only on `HomeSearchBar`.

**Visual overlays:** Not available — localhost:3000 down; used user screenshots as fallback.

## Overall Impression

Hero owns the first emotional beat. After that, Home stacks catalog chips, mood teaser, Trend/For You, and saved rail as peers — diluting the save-first job. Biggest opportunity: one clear discovery lane + visible save on the surfaces users already look at.

## What's Working

1. Hero spotlight — amber badge, cinematic cover, clear «مشاهده لیست».
2. Product voice — RTL Persian, indigo/amber system, lifestyle imagery.
3. Logged-in «ذخیره‌شده‌های تو» — real return path once saves exist.

## Priority Issues

### [P1] Discovery pile-up after hero
- **What:** Chips + Explore teaser + Trend/For You compete before open/save.
- **Why:** Operate scanability and save-first success suffer.
- **Fix:** One primary lane above fold; demote teaser or chips.
- **Suggested command:** `$impeccable distill` or `$impeccable layout`

### [P1] Save invisible on discovery surfaces
- **What:** Hero/Trend are view-only; green bookmark only on already-saved cards.
- **Why:** Guests never practice the core loop on Home.
- **Fix:** Save control on hero + feed cards; guest → login-to-save.
- **Suggested command:** `$impeccable polish` / `$impeccable onboard`

### [P1] Trend vs For You vs Explore split the story
- **What:** Three discovery doors with overlapping jobs.
- **Why:** Mood-first positioning fights catalog-first Home IA.
- **Fix:** Home = spotlight + one feed; Explore owns mood; hide For You for guests.
- **Suggested command:** `$impeccable shape` or `$impeccable distill`

### [P2] Green save badge vs indigo brand
- **What:** Bright green circles on saved rail.
- **Why:** Third accent fights primary system.
- **Fix:** Filled indigo bookmark / primary saved state.
- **Suggested command:** `$impeccable colorize`

### [P2] Footer + gap kill scroll end
- **What:** Marketing footer + tall empty band above bottom nav.
- **Why:** Peak-end fails; wasted thumb zone.
- **Fix:** Collapse/remove mobile home footer; tighten safe-area padding.
- **Suggested command:** `$impeccable quieter` / `$impeccable layout`

## Persona Red Flags

**Guest first-timer:** Sees vibe question + chips but no save; «برای تو» may soft-gate to login after promising personalization.

**Logged-in returner:** Saved rail works but sits below teaser + full Trend — high scroll tax to reach “mine.”

**Alex (power):** No keyboard focus-visible on most home controls beyond search.

## Minor Observations

- Search placeholder strong; chips repeat same three verticals.
- Trend food cards weak continuity from film hero story.
- «مشاهده همه» easy to miss vs indigo tab pair.
- Hero subtitle contrast softer on busy photo (`text-white/65–78`).

## Questions to Consider

1. If Explore is the mood door, why does Home also ask «امروز دنبال چه وایبی هستی؟»?
2. Guest first win: **Save on hero** or **Open Explore** — delete the other from first screenful?
3. Should «برای تو» appear for guests at all?
