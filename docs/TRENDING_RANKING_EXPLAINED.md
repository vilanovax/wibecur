# How Trending Ranking Works in Our System

## 1. Do we store rank in the database?

**No.** We do **not** store list rank or trending score in the database.

- **Lists:** We only store raw counters: `saveCount`, `likeCount`, `viewCount`, `itemCount`, `createdAt`. There is no `rank` or `trendingScore` column on `lists`.
- **Creator rankings:** We *do* store **creator** rank/score in `creator_rankings` (for users/curators). That is a separate system and is updated by a **cron job** (`/api/cron/ranking`). List trending does not use that table.

So for **list trending**: rank and score are **computed at read time** and **not stored**.

---

## 2. Do we only store score and sort dynamically using ORDER BY?

We don’t store score either. We:

- **Store:** Only raw data: `lists.saveCount`, `lists.likeCount`, `lists.createdAt`, and per-event data in `bookmarks` (with `createdAt`), `list_likes`, `list_comments`.
- **Compute at runtime:** A **trending score** from `lib/trending/score.ts` using 7-day (or 1-day) metrics.
- **Sort in application code:** After fetching lists and aggregating metrics, we sort by that computed score in JavaScript (e.g. `withScore.sort((a, b) => b.score - a.score)`). There is no `ORDER BY trending_score` in SQL because that column doesn’t exist.

So: **no stored score**, **no ORDER BY on score in DB**. We sort by the **computed** score in the API/service layer.

---

## 3. Where is the Trending score calculated?

| Layer | Where | What |
|--------|--------|------|
| **Formula** | `lib/trending/score.ts` | `calculateTrendingScore(metrics)` — pure function. |
| **Metrics** | `lib/trending/service.ts` | Fetches lists from DB, then calls `bookmarks.groupBy`, `list_likes.groupBy`, `list_comments.groupBy` (and similar) to get 7d (and 1d) counts, then builds `ListMetrics7d` and calls `calculateTrendingScore`. |
| **API** | `app/api/trending/global/route.ts`, `app/api/trending/fast/route.ts`, `app/api/trending/category/[slug]/route.ts`, `app/api/trending/monthly/route.ts` | Each route calls the service (e.g. `getGlobalTrending`, `getFastRising`, `getTrendingByCategory`, `getMonthlyPopular`). So **score is calculated at API request time** (then cached — see below). |
| **Admin / Debug** | `lib/admin/trending-debug.ts` and `lib/admin/lists-intelligence.ts` | A **different formula** (baseScore + velocity + recency − decay) for admin/debug and list intelligence. This is **not** the same as the public trending API. |

So: **trending score is calculated in the API/runtime path** (inside the route handlers and the trending service), using **no database view** and **no cron** for list ranking. The only cron (`/api/cron/ranking`) is for **creator** rankings, not list trending.

---

## 4. Is score recalculated on every save event or periodically?

- **On every save (bookmark):**  
  Only the **raw counter** is updated: in `app/api/lists/[id]/bookmark/route.ts` we do `lists.update({ data: { saveCount: { increment: 1 } } })` (or decrement on unbookmark). We **do not** recalculate any trending score or rank on save.
- **When the score is used:**  
  Score (and thus rank) is recalculated **when a trending API is called**, using the latest DB data (bookmarks, list_likes, list_comments, lists). So effectively it’s **recalculated on demand**, and then the result is **cached** (see below).

So: **not on every save**, and **not on a fixed schedule** for lists — it’s **on-demand at request time**, then cached.

---

## 5. Is there any cached ranking layer?

**Yes.** The public trending APIs use **Next.js `unstable_cache`**:

- **Global:** `app/api/trending/global/route.ts` — cache key `['trending-global-lists']`, revalidate **600 s** (10 min).
- **Fast rising:** `app/api/trending/fast/route.ts` — cache key `['trending-fast-rising']`, revalidate **300 s** (5 min).
- **Per category:** `app/api/trending/category/[slug]/route.ts` — cache key `['trending-category-${category.id}']`, revalidate **600 s**.

So we have a **cached ranking layer**: the first request after expiry runs the full query + score computation; subsequent requests get the cached result until revalidation.

---

## 6. Relevant Prisma models

**Lists (no rank/score):**

```prisma
model lists {
  id               String            @id
  title            String
  slug             String            @unique
  description      String?
  coverImage       String?
  categoryId       String?
  userId           String
  tags             String[]          @default([])
  badge            ListBadge?
  isPublic         Boolean           @default(true)
  isFeatured       Boolean           @default(false)
  viewCount        Int               @default(0)
  likeCount        Int               @default(0)
  saveCount        Int               @default(0)   // ← only counter stored
  itemCount        Int               @default(0)
  commentsEnabled  Boolean           @default(true)
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
  isActive         Boolean           @default(true)
  bookmarks        bookmarks[]
  items            items[]
  list_likes       list_likes[]
  list_reactions   list_reactions[]
  list_comments    list_comments[]
  categories       categories?
  users            users
  // NO: rank, trendingScore
}
```

**Bookmarks (for 7d/1d counts):**

```prisma
model bookmarks {
  id        String   @id
  userId    String
  listId    String
  createdAt DateTime @default(now())
  lists     lists
  users     users
  @@unique([userId, listId])
  @@index([listId])
  @@index([userId])
}
```

**Creator rankings (stored rank/score — used for creators, not list trending):**

```prisma
model creator_rankings {
  id                 String   @id @default(cuid())
  userId             String   @unique
  curatorScore       Int      @default(0)
  influenceScore     Int      @default(0)
  momentumScore      Int      @default(0)
  rankingScore       Float    @default(0)
  globalRank         Int      @default(0)
  previousGlobalRank Int?
  monthlyRank        Int?
  categoryRank       Json?
  lastUpdated        DateTime @updatedAt
  lastActivityAt     DateTime?
  users              users
}
```

---

## 7. Relevant “SQL” (Prisma usage)

Trending does **not** use a single ORDER BY on a score column. Conceptually:

**Step 1 – Fetch candidate lists (e.g. by category):**

```ts
// lib/trending/service.ts — getTrendingByCategory
const lists = await prisma.lists.findMany({
  where: { isActive: true, isPublic: true, categoryId },
  select: { id: true, title: true, slug: true, saveCount: true, likeCount: true, ... },
  take: 100,
});
```

**Step 2 – 7-day metrics (no ORDER BY score; we don’t have it):**

```ts
// bookmarks in last 7 days per list
const saves = await prisma.bookmarks.groupBy({
  by: ['listId'],
  where: { listId: { in: listIds }, createdAt: { gte: cutoff } },
  _count: { listId: true },
});
// similarly: list_likes.groupBy, list_comments.groupBy, etc.
```

**Step 3 – Score in JS, then sort in JS:**

```ts
const score = calculateTrendingScore(metrics);
withScore.push({ ...list, score, badge });
// ...
return withScore.sort((a, b) => b.score - a.score).slice(0, limit);
```

So the “relevant query” is: **Prisma `findMany` + `groupBy`** for raw data; **no SQL ORDER BY on score**. Ordering by score happens in application code after computing the score.

---

## 8. Relevant API code

**Score formula (pure function):**

```ts
// lib/trending/score.ts
// TrendingScore = (S7×4 + C7×3 + L7×2 + V7×0.5 + SaveVelocity×5) / (1 + AgeDays×0.1)
export function calculateTrendingScore(metrics: ListMetrics7d): number {
  const { S7, L7, C7, V7, AgeDays, SaveVelocity } = metrics;
  const numerator =
    S7 * TRENDING_WEIGHTS.S7 +
    C7 * TRENDING_WEIGHTS.C7 +
    L7 * TRENDING_WEIGHTS.L7 +
    V7 * TRENDING_WEIGHTS.V7 +
    SaveVelocity * TRENDING_WEIGHTS.SAVE_VELOCITY;
  const denominator = 1 + AgeDays * TRENDING_WEIGHTS.AGE_DECAY;
  return Math.max(0, numerator / denominator);
}
```

**Global trending route (cached):**

```ts
// app/api/trending/global/route.ts
const CACHE_SECONDS = 600; // 10 min
const getCached = unstable_cache(
  () => getGlobalTrending(prisma, 6),
  ['trending-global-lists'],
  { revalidate: CACHE_SECONDS, tags: ['trending'] }
);
const data = await getCached();
```

**On bookmark (only counter updated, no score/rank):**

```ts
// app/api/lists/[id]/bookmark/route.ts
await tx.lists.update({
  where: { id: listId },
  data: { saveCount: { increment: 1 } },  // or decrement
  select: { saveCount: true },
});
// no trending score or rank update
```

---

## Summary table

| Question | Answer |
|----------|--------|
| Store **rank** in DB? | **No** (for lists). Yes only for **creators** in `creator_rankings`. |
| Store **score** in DB? | **No** for lists. |
| Sort by score with ORDER BY? | **No.** We sort by **computed** score in the app after fetching. |
| Where is score calculated? | **Runtime** in `lib/trending/service.ts` + `lib/trending/score.ts`, invoked from API routes. |
| Recalculated on every save? | **No.** Only `saveCount` (and bookmark row) updated on save. |
| Recalculated periodically? | **No** dedicated cron for list trending. Recalculated **on API request**, then cached. |
| Cached ranking layer? | **Yes.** Next.js `unstable_cache` (5–10 min revalidate) on trending API routes. |

---

**Note:** The **admin** trending logic (`lib/admin/trending-debug.ts`, `lib/admin/lists-intelligence.ts`) uses a **different formula** (e.g. baseScore + velocity + recency − decay) for transparency and debugging. It does not use the same weights as `lib/trending/score.ts` and is not cached the same way.
