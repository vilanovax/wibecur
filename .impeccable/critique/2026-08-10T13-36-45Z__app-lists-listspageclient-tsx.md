---
target: lists
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
p2_count: 2
timestamp: 2026-08-10T13-36-45Z
slug: app-lists-listspageclient-tsx
---
Method: dual-agent (A: 8703b189-6a79-4dbd-b7f8-96d8cdc787c8 · B: c64c3d39-2bd5-4767-8175-6391bfd70988)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Context line + active modes solid; filter badge still weak when advanced filters on |
| 2 | Match System / Real World | 3 | «سراسری» good; «حداقل امتیاز» stars mean saveCount not ratings |
| 3 | User Control and Freedom | 3 | Sheet reset/dismiss OK; no lightweight undo after Apply |
| 4 | Consistency and Standards | 2 | Modes + sheet مرتب‌سازی both own sort; categories duplicated |
| 5 | Error Prevention | 2 | Honest filter count fixed; star-as-saves still misleads |
| 6 | Recognition Rather Than Recall | 3 | Modes/chips labeled; advanced options in accordions |
| 7 | Flexibility and Efficiency | 2 | One preset; view mode buried in filter sheet |
| 8 | Aesthetic and Minimalist Design | 3 | Distill worked; sticky stack still dense (~31% viewport) |
| 9 | Error Recovery | 3 | Empty states with concrete CTAs |
| 10 | Help and Documentation | 1 | No cue for سراسری vs page search or امتیاز metaphor |
| **Total** | | **26/40** | **Needs Work** |

## Design Specificity Verdict

**LLM assessment**: Grounded in Wibe catalog browse — RTL, indigo/amber, modes+chips first, منتخب demoted, mood absent. Residual generic filter-sheet furniture (star امتیاز, نوع سازنده) dilutes specificity inside the sheet.

**Deterministic scan**: CLI detect on ListsPageClient + FilterBottomSheetPro + ListsFeaturedCarousel → `[]` (exit 0). Browser overlay (pre-existing detect.js) reported noisy Nested cards / Image hover / Low contrast — largely FP for intentional cards/motion.

**Visual overlays**: No reliable fresh overlay owned by this run; live-inject config missing. Fallback = CLI clean + DOM/screenshot evidence (chrome ~31% of 390×844; featured under chrome; filter opens with «بدون فیلتر»).

## Overall Impression

Catalog JOB is legible after distill (+1 from 25). Biggest remaining trust break: star «امتیاز» that filters by saveCount, plus dual mode↔sort controls.

## What's Working

1. Modes + category chips own the first decision; mood correctly stays on Explore.
2. Status honesty: context line, «بدون فیلتر», «سراسری» label.
3. Imagery-led category sections feel curated Persian PWA, not a filter dashboard.

## Priority Issues

### [P1] «حداقل امتیاز» stars filter by saveCount
- **Why**: Users expect ratings; get popularity thresholds → wrong results + broken trust.
- **Fix**: Rename to ذخیره/محبوبیت with numeric thresholds, or remove until real ratings.
- **Suggested command**: `$impeccable clarify`

### [P1] Browse modes and sheet مرتب‌سازی both mutate sort
- **Why**: Two controls for one concept; sheet can desync inferred mode.
- **Fix**: Modes own primary sort; sheet mirrors 1:1 or becomes secondary-only with locked sync.
- **Suggested command**: `$impeccable distill`

### [P2] Filter sheet still a kitchen sink
- **Why**: Categories duplicate chips; view mode buried; creator/itemCount/rating add load.
- **Fix**: Sheet = advanced only; view toggle on toolbar; demote fake rating.
- **Suggested command**: `$impeccable distill`

### [P2] First-viewport chrome density (~31%)
- **Why**: Search·سراسری·modes·filter·chips·context·featured still compete on 390×844.
- **Fix**: Tighten sticky stack; shrink or further defer featured.
- **Suggested command**: `$impeccable layout`

### [P3] سراسری vs in-page search unexplained
- **Why**: Two search entry points; first-timers guess scope.
- **Fix**: Helper copy, differentiated placeholder, or one primary with scope toggle.
- **Suggested command**: `$impeccable clarify`

## Persona Red Flags

**Jordan (First-Timer)**: Opens filter → star امتیاز with no legend; سراسری vs search unclear.

**Alex (Power User)**: Mode + sheet sort double work; view toggle requires 85vh sheet.

**Sam (Mobile Thumb)**: Three horizontal systems (chips + featured + bottom nav); sticky Apply can intercept taps.

## Minor Observations

- Dead VIBE_CHIPS remain in ListsPageClient after mood distill.
- Category masonry rhythm is strong — keep.
- Dual «همه» is related labels (chip vs status/sheet), not two identical chips.

## Questions to Consider

- Should Lists filter ever expose «امتیاز», or only honesty about saves/popularity?
- Is view mode a filter, or persistent chrome next to فیلتر?
- After demoting منتخب, should it shrink further so the first category section lands in the first viewport?
