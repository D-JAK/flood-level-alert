## Goal

Bring the app up to the mockup screens (2, 3, 4 — skipping the welcome screen), using only real published data.

## What the data supports

Verified against the live feeds and the source repo today:

- Live feeds give one reading per dam per day: level, FRL, MWL, storage %, inflow, spillway release, total outflow, rainfall, remarks, lat/lon (all 38 dams), district + gross storage (Irrigation dams only).
- The source repo also publishes `historic_data/<Dam_Name>.json` and `irrigation_historic_data/<Dam_Name>.json` — roughly 2,000 **daily** rows per dam. This is what the timeline chart and the Rising/Falling trend need; the current detail page shows "not enough history" because it only reads the single live row.
- The mockup's "24 hours" hourly chart is not possible: the official bulletin is published once a day. The chart will offer 7 days / 30 days / 1 year of daily readings instead.
- Gross storage in TMC exists only for the 20 Irrigation dams. It will be shown when published and omitted otherwise — never estimated.

## Work

**1. Historical data source (new)**
- Add a server function + query that fetches a single dam's historic JSON by name, with the same localStorage caching pattern as the other feeds (long stale time — the file changes once a day).
- Tolerate the malformed dates present in older rows (e.g. `10.042024`, `09.04.2.23`): parse strictly, drop unparseable rows rather than guessing.

**2. Dam detail page**
- Replace the single-point chart with a real daily timeline plus a 7d / 30d / 1y range selector, alert-threshold reference lines, and units on the axis.
- Add a **Trend** tile (Rising / Falling / Steady) computed from the last two valid daily readings, with the compared dates shown so it is auditable.
- Add Gross Storage to the details table for dams that publish it.
- Loading skeleton and an explicit "history source unavailable" state if the file 404s.

**3. Map page**
- Add a search box filtering markers by dam name or district.
- Add a bottom card that appears on marker tap (level, FRL, % full, alert, chevron to detail) instead of only the Leaflet popup, matching the mockup on mobile.

**4. Navigation**
- Add a mobile bottom tab bar (Home, Map, Near me, Alerts, Emergency) that mirrors the existing `SiteNav` routes; keep the current top nav on desktop and keep the live clock and language toggle visible on every route.

## Out of scope

- Welcome/onboarding screen (explicitly skipped).
- Hourly water-level data and any "Alerts" data beyond the existing NDMA Sachet feed.
- No new backend or database; everything stays public-feed + localStorage cache.
