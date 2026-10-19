---
target: lists page / ListsPageClient
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
p2_count: 2
timestamp: 2026-08-08T07-12-52Z
slug: app-lists-listspageclient-tsx
---
# Critique — Wibe Lists browse (/lists)

**Target:** `app/lists/ListsPageClient.tsx`  
**Mode:** Operate (catalog browse)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Mode/chip clear; mobile lacks N لیست context |
| 2 | Match System / Real World | 3 | Expand icon ≠ global search |
| 3 | User Control and Freedom | 3 | Chip همه scroll vs filter inconsistency |
| 4 | Consistency and Standards | 2 | View toggle hidden; popular naming collide |
| 5 | Error Prevention | 2 | Guest Saved empty; dual search |
| 6 | Recognition Rather Than Recall | 3 | Filter vibes buried |
| 7 | Flexibility and Efficiency | 3 | Sticky + URL sync strong; density fights speed |
| 8 | Aesthetic and Minimalist Design | 2 | Chrome before Featured |
| 9 | Error Recovery | 3 | Empty states with CTAs |
| 10 | Help and Documentation | 1 | No chip semantics cue |
| **Total** | | **25/40** | **Acceptable** |

## Design Specificity
Partially Wibe (lifestyle media, emoji cats, featured) + generic catalog chrome.

**Detector:** 0 findings. Manual: emoji chips, focus-visible gaps on ListsPageClient toolbar, featured ۱/۳ + pills confirmed live.

## Priority Issues
1. [P1] Expand icon misreads as layout not global search
2. [P1] First-viewport chrome density (breadcrumb+search+chips+modes before Featured)
3. [P1] Chip scroll-spy vs filter same look different job
4. [P2] Mobile status / bare section counts (۲ without «لیست»)
5. [P2] Guest × ذخیره‌شده empty after commit

## Questions
1. Why does Featured lose the race to chrome?
2. Chips = navigate or filter — pick one?
3. Hide Saved mode for guests?
