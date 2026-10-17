---
target: list detail ListDetailClient
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-08T10-43-15Z
slug: app-lists-slug-listdetailclient-tsx
---
# Critique: List detail (`ListDetailClient`)

**Target:** `app/lists/[slug]/ListDetailClient.tsx`  
**Mode:** Operate (consume curated list)  
**Method:** dual-agent

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|------:|-----------|
| 1 | Visibility of System Status | 3 | Infinite-scroll mute; suggest status thin for non-owners |
| 2 | Match System / Real World | 3 | Owner save-as-metric vs visitor save-as-action |
| 3 | User Control and Freedom | 3 | Escape hatches OK; chrome before items |
| 4 | Consistency and Standards | 2 | Category chips + breadcrumb + header + hero H1 fight |
| 5 | Error Prevention | 2 | Approve/Reject without confirm; suggest under comment box |
| 6 | Recognition Rather Than Recall | 3 | Posters good; titles lean on cover literacy |
| 7 | Flexibility and Efficiency | 2 | Search only — no decide-tonight aid |
| 8 | Aesthetic and Minimalist Design | 1 | First screen admin/SEO chrome |
| 9 | Error Recovery | 3 | Empty search clear works |
| 10 | Help and Documentation | 2 | Explorer badge / sort / suggest-vs-comment opaque |
| **Total** | | **24/40** | **Acceptable** |

## Design Specificity Verdict

**LLM:** Hero + ranked poster grid feel like Wibe movie consume. Surrounding chrome (breadcrumb, category strip, stats slab, Manage/Share box, comment compose-first) is interchangeable list-app shell.

**Deterministic scan:** detect.mjs on ListDetailClient + ListDetail* / ListItemsGrid / ListSimilarListsSection / VibeCommentSection → **0 findings**.

**Visual overlays:** Skipped. Fallback: MCP live detail + user screenshots. Browser also noted **duplicate H1** (header + hero).

## Overall Impression

Atmosphere in the hero works; the page then becomes a dashboard. Biggest opportunity: **first viewport = hero + items**, with Manage/stats demoted, and a lightweight “امشب چی ببینم؟” path.

## What's Working

1. Cinematic hero (atmosphere, not a card)
2. Ranked 2-col poster grid matches how people scan movie lists
3. Suggestion → owner Approve/Reject loop is clear once you reach it

## Priority Issues

### [P1] Chrome-first first viewport
Category chips, long breadcrumb, stats card, Manage/Share sit above items.
**Fix:** Hide/collapse breadcrumb on mobile; remove category strip from detail; stats compact or below fold; items earlier.
**Command:** `$impeccable distill`

### [P1] Owner Manage is the loudest CTA
Solid indigo مدیریت says “editor page.”
**Fix:** Manage → ⋮ or quiet secondary; primary = ذخیره / اشتراک / browse for consume mode.
**Command:** `$impeccable quieter` + `$impeccable clarify`

### [P1] No decide-tonight path
25 items + search = paralysis for “امشب چی؟”
**Fix:** One of: تصادفی / ۵تای اول / ذخیره برای امشب near top of grid.
**Command:** `$impeccable shape` or `$impeccable delight`

### [P2] Similar lists interrupt consume → social
Between grid and comments.
**Fix:** After comments, or collapsed disclosure.
**Command:** `$impeccable layout`

### [P2] Comment composer before comments
Tall textarea + suggest + sort bury the one comment.
**Fix:** Thread first; compose sticky/collapsed; suggest as secondary chip.
**Command:** `$impeccable distill`

## Persona Red Flags

**Guest (movie tonight):** Owner-flavored chrome; posters without on-card titles; no start-here; bounce risk.
**Active user:** Save easy to miss vs Manage/Share; end of session is moderation/footer not a pick.

## Minor Observations

- Duplicate title: breadcrumb + header + hero (+ dual H1 in DOM)
- Stats white slab snaps cinema → spreadsheet
- Sort chips ceremonial with 1 comment
- Explorer badge unexplained
- Footer copyright competes with end of scroll

## Questions to Consider

1. If first viewport were only hero + top 6 posters, would anyone miss stats/breadcrumb/Manage before scroll?
2. Is this page for *watching from a vibe* or *curating a community artifact* — and why does the primary button answer the second?
