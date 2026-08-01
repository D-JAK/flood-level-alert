## Goal
Produce a set of article-ready screenshots of Kerala Dam Watch, saved to the project Files panel so you can download and drop them into the write-up.

## Screens to capture
1. Dashboard `/` — alert counters, freshness panel with "Refresh now", dam cards (including one STALE tag)
2. Dam detail `/dam/:id` — level, status, source link, history chart
3. Map `/map` — alert-coloured markers, locate-me button
4. Flood Near Me `/nearby` — radius selector, nearby dams and alerts
5. Emergency contacts `/emergency` — category-grouped call buttons
6. Official alerts — dashboard with the Sachet accordion expanded + marquee visible
7. Share card — dam card with the WhatsApp share popover open
8. Malayalam view — dashboard with the language toggle set to ML (shows bilingual support)

## How
- Drive the running local app with Playwright (headless Chromium) and capture at two sizes: mobile (393x751, dpr 2 — matches how the app is actually used) and desktop (1280x900) for the wide shots (dashboard, map, detail).
- Wait for feed data to load so no skeletons appear; expand accordions/popovers before shooting.
- Save all PNGs to `/mnt/documents/screenshots/` with descriptive names (`01-dashboard-mobile.png`, etc.) and show them inline in chat.
- QA every image before delivering: no loading skeletons, no clipped text, no empty map tiles; re-shoot anything broken.

## Optional polish
For 2–3 hero shots, also generate framed versions (macOS-style window, drop shadow, gradient background) suitable for the top of the article.

## Notes
Screenshots use live upstream data, so numbers reflect today's bulletin. No app code changes are involved.
