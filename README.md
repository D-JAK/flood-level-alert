# Kerala Dam Watch

A mobile-first public dashboard for dam water levels and flood alerts in Kerala, India.

**Live app:** https://flood-level-alert.lovable.app

## What it does

Kerala Dam Watch pulls official public feeds, shows current dam water levels, alert status, spillway releases, and active flood warnings — in both Malayalam and English. It is built to work on slow connections and low-end phones, with device-side caching so it stays useful even when the network is patchy.

## Data sources

| Source | What it provides | Update cadence |
| --- | --- | --- |
| [Kerala-Dam-Water-Levels](https://github.com/amith-vp/Kerala-Dam-Water-Levels) by Amith VP | KSEB and Irrigation dam readings (water level, storage %, inflow, outflow, rainfall) | Once a day (official bulletins) |
| [KSEB dam bulletin](https://dams.kseb.in/?page_id=45) | Official KSEB reservoir levels | Once a day |
| [KSDMA / Irrigation](https://sdma.kerala.gov.in/) | Irrigation dam bulletins | Once a day |
| [NDMA Sachet](https://sachet.ndma.gov.in/) | Official rain, flood and flash-flood CAP alerts | Within minutes of issue |
| [India-WRIS](https://aff.india-water.gov.in/home.php) | Central Water Commission flood forecasts | Used automatically when reachable |

All data is fetched from public endpoints. The app does not store any personal data and does not require login.

## Key features

- **Dashboard** — live water levels for KSEB and Irrigation dams, sorted by alert severity. Filter by district, alert level, or dam name.
- **Staleness handling** — each dam is stamped with its own reading age. Stale readings are clearly tagged; very old readings hide the number and show “No current data”.
- **Alert levels** — Red / Orange / Blue / Normal / Unknown, computed from official thresholds in the feed.
- **Interactive map** — Leaflet map with alert-coloured markers, “Locate me”, and manual refresh.
- **Flood Near Me** — one-time location prompt, then auto-filter to your district. Shows nearby dams and official alerts within a chosen radius.
- **Official alerts** — NDMA Sachet warnings for Kerala, with a top-level marquee for the most recent alert and a collapsible accordion for the full list.
- **Emergency contacts** — category-grouped Kerala emergency numbers as `tel:` links, works offline.
- **Bilingual** — full English / Malayalam toggle.
- **Device caching** — localStorage cache with refresh intervals matched to source cadence (hourly for dams, every 10 minutes for alerts). Reloads do not hit upstream servers.
- **Credits & data sources** — transparent attribution and links to every upstream source.

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React 19 + Vite)
- [TanStack Query](https://tanstack.com/query)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Leaflet](https://leafletjs.com/) + [React-Leaflet](https://react-leaflet.js.org/)
- [Recharts](https://recharts.org/) for dam-level history charts

## Running locally

```sh
git clone https://github.com/D-JAK/flood-level-alert.git
cd flood-level-alert
npm i
npm run dev
```

Then open http://localhost:8080.

## Important disclaimer

This is an **unofficial aggregator**. Always confirm with [KSDMA](https://sdma.kerala.gov.in/), district authorities, and official bulletins before acting.

## Credits

- Built by [Daliya Joseph](https://www.linkedin.com/in/daliyajoseph/)
- Dam data feed by [Amith VP](https://github.com/amith-vp/Kerala-Dam-Water-Levels)
- Part of the [Techiepedia](https://chat.whatsapp.com/Ld4pktw8OEh9LvOcdKa2N8) community
- Source code: [D-JAK/flood-level-alert](https://github.com/D-JAK/flood-level-alert)

## License

This project is open source. See the repository for license details.
