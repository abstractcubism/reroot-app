# Reroot Matchmaking Improvements PRD

## Goal
Improve roommate/house matching usability for Rutgers students by increasing scannability, reducing decision friction, and improving mobile flow.

## Release Plan

### Phase 1 (Quick Wins)
1. Progressive Disclosure on roommate cards
- Default card shows: Name, Match %, Major, Budget, Campus.
- Bio, full traits/interests, and linked house are hidden behind `View details`.
- Acceptance: card vertical height drops noticeably and users can expand/collapse without page jump.

2. Match Breakdown chips
- Add 2-3 explicit reason chips under match score (e.g., `shared: quiet`, `budget fit`, `same campus`).
- Acceptance: each roommate card shows at least one explanation chip.

3. Save/Favorite
- Add `Save` state independent from Like/Dislike.
- Add `Saved` filter toggle.
- Acceptance: saved roommates persist during session and can be isolated in results.

4. Active filter emphasis
- Increase selected trait/interest contrast (filled emerald + ring + check icon).
- Acceptance: selected filters are clearly distinct at a glance.

### Phase 2 (Core Product)
1. Compare drawer/table
- Users can select up to 3 roommate cards and open a side-by-side comparison table.
- Columns: Major, Campus, Budget, Top Traits, Move-in Window.
- Acceptance: compare view is accessible from both desktop and mobile.

2. House list/map toggle
- Add `List | Map` toggle in house mode.
- Map pins display price + distance and open listing detail preview.
- Acceptance: users can switch views without losing active filters.

### Phase 3 (Retention)
1. Mutual-like messaging trigger
- If two users like each other, show `It's a match` CTA and open chat thread.
- Acceptance: match event appears in-app immediately and can be revisited.

## User Flows

### Flow A: Roommate discovery and shortlist
1. User opens `Match Roommates`.
2. Sets campus/budget/traits.
3. Scans compact cards (high-level only).
4. Expands 2-4 cards for details.
5. Saves 2 candidates, likes 1 candidate.
6. Opens `Saved` filter and compares finalists.
7. Sends message if mutual match exists.

### Flow B: House discovery with commute awareness
1. User switches to `Match Houses`.
2. Applies campus + max budget.
3. Toggles to map view.
4. Selects near-campus options by pin distance.
5. Opens listing and reviews room type + people in house.
6. Saves listing or requests tour.

## Data/Backend Requirements
1. Extend suggestion payload with structured reasons:
- `matchSignals: string[]` (e.g., `same_campus`, `budget_fit`, `trait_overlap:quiet`).
2. Add saved endpoints:
- `POST /api/matchmaking/saved` (save/unsave)
- `GET /api/matchmaking/saved?sessionId=...&mode=...`
3. Messaging prep:
- store likes by user account/session + counterpart id.
- emit match event when reciprocal like exists.

## Frontend Implementation Notes
- Roommates page: `app/frontend/pages/Roommates.tsx`
- Listing card/mobile behavior: `app/frontend/pages/Listing.tsx`
- Detail panel and expanded metadata: `app/frontend/pages/ListingDetail.tsx`
- Shared UI primitives for chip, compare drawer, and map toggle should live in `app/frontend/components/`.

## Success Metrics
1. Higher save rate per session.
2. Lower bounce from roommate results.
3. Increased detail expansion click-through.
4. Increased mutual-like to message conversion.
