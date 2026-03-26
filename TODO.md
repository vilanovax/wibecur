# TODO - Deferred Features

## Phase 2: Gamification + Curator System

These features were removed from the explore page for MVP simplicity.
They should be implemented together as part of the gamification initiative.

### Curator Features
- [ ] **Elite Curators Section** — showcase top curators on explore page
  - Component exists: `components/mobile/curated/EliteCuratorsSection.tsx`
  - API exists: `/api/discovery/creators`
  - Needs: real data instead of `MOCK_CURATORS`
- [ ] **Rising Curators (ستاره‌های در حال ظهور)** — emerging curators with weekly growth
  - Component exists: `components/mobile/curated/RisingCuratorsSection.tsx`
  - Needs: connect to ranking cron + real follower data
- [ ] **Curator Levels** — 7-tier system (Explorer → Vibe Legend)
  - Logic exists: `lib/curator.ts`
  - Needs: UI badges, profile integration, level-up notifications
- [ ] **Spotlight System** — weekly/rising/category/editor spotlight types
  - Logic exists: `lib/spotlight.ts`
  - Needs: connect to frontend, editorial tools

### Personalization Features
- [ ] **For You Section (برای تو)** — personalized list recommendations
  - Component exists: `components/mobile/curated/ForYouSection.tsx`
  - Backend exists: `lib/discovery.ts` (affinity scoring with 5 weights)
  - Needs: real user behavioral data, connect frontend to `/api/discovery/creators`
- [ ] **Personalized Spotlight** — user-specific creator recommendations
  - API exists: `/api/spotlight/personalized`
  - Needs: enough user interaction data to be meaningful
- [ ] **Explore tabs: "برای تو" and "الیت"** — re-add to `ExploreSmartHero` when sections are ready

### Cron Jobs (exist but not critical for MVP)
- [ ] `/api/cron/discovery` — daily user category affinity computation
- [ ] `/api/cron/ranking` — creator ranking updates

### Notes
- All removed components are kept in codebase, just not rendered
- Backend APIs and scoring logic are already built — mainly need frontend wiring + real data
- Mock data in `lib/curated/mock-data.ts` can be removed once real API integration is done
