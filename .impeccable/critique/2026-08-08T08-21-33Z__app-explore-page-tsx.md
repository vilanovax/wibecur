---
target: explore page
total_score: 24
max_score: 36
na_heuristics: 10
p0_count: 1
p1_count: 2
p2_count: 2
timestamp: 2026-08-08T08-21-33Z
slug: app-explore-page-tsx
---
# Critique — Wibe Explore (/explore)

**Target:** `app/explore/page.tsx` + `components/mobile/curated`  
**Mode:** Operate (mood-first discovery)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Explore active clear; surprise opaque |
| 2 | Match System / Real World | 4 | Mood situation copy strong |
| 3 | User Control and Freedom | 3 | Expand moods no collapse; surprise one-way |
| 4 | Consistency and Standards | 2 | Dual اکسپلور label; mood↔QuickNow overlap |
| 5 | Error Prevention | 2 | Wrong/duplicate covers break trust |
| 6 | Recognition Rather Than Recall | 3 | Many parallel discovery modes |
| 7 | Flexibility and Efficiency | 3 | Many doors, redundant |
| 8 | Aesthetic and Minimalist Design | 2 | Post-fold stack dilutes mood door |
| 9 | Error Recovery | 2 | Surprise misfire → browser back |
| 10 | Help and Documentation | n/a | Operate mood surface |
| **Total** | | **24/36** | **Acceptable** |

## Design Specificity
Mood 2×2 is Wibe-specific; below fold becomes generic catalog. Cover mismatches strip curated feel.

**Detector:** 0 findings on explore/curated. Manual: no text-gray/arbitrary in targets; focus-visible gaps on mood/surprise; violet mood pastels in `mood-explorer-config`; duplicate `cafe-2.webp`.

## Priority Issues
1. [P0] Cover trust (wrong hot cover + duplicate cafe thumbs)
2. [P1] Post-fold discovery dilution
3. [P1] Mood grid ↔ QuickNow redundancy
4. [P2] Opaque surprise
5. [P2] Dual «اکسپلور» label + footer end

## Questions
1. Why full catalog scroll after the mood 2×2?
2. Is Surprise recovery or peer hero?
3. Cover-match gate before amber ترند?
