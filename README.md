# Kerala Dam Watch

Lovable Build Prompts — Kerala Disaster Information Portal

Prepared 1 Aug 2026. Endpoints verified live on that date.

How to use: paste Prompt 1 as the very first message in a new Lovable project. Wait for it to build and deploy. Then paste Prompts 2, 3, 4 one at a time, checking the result between each. Do not paste them all at once — Lovable degrades badly on long multi-feature prompts and you will get a beautiful shell with nothing working.

Two changes made to the ChatGPT PRD, and why

1. Real data from commit one. No mock JSON.

The PRD says to build with mock data and integrate real APIs later. For a normal product that is correct advice. For this one it is not. Kerala is flooding right now, three people died on 1 August, eight districts are under red alert. A portal that renders plausible-looking dam levels from a mock file, deployed on a public URL during an active event, is a liability — and mock-first has a way of becoming mock-forever when the team gets tired. The real feeds are free, public, need no API key, and return CORS headers allowing direct browser fetch. There is no reason to mock them.

2. Supabase, auth, admin portal, and community reporting cut from v1.

Not cut forever — cut from v1. The scope decision was official sources only. Without user submissions there is nothing to moderate, nobody to authenticate, and nothing to store. The two JSON feeds are the database. This removes roughly two-thirds of the PRD and takes the build from a week to an afternoon. Add Supabase in v2, when crowdsourced reports come in and you have a verification workflow and ideally KSDMA backing.

Also cut from v1: river dashboard, weather dashboard, rainfall, relief camps, hospitals, police/fire stations, notifications, global search, CSV export, PWA. Each needs a data source that has not been identified yet. Adding UI for data you do not have produces empty panels that make the whole site look broken.

Kept, and added: emergency contacts. It is static, needs no feed, carries zero staleness risk, and during a flood it may genuinely be the single most useful thing on the site.

PROMPT 1 — Core build

Build a mobile-first web app called Kerala Dam Watch — a public dashboard showing live water levels for dams in Kerala, India, during monsoon flooding.

Stack: React + TypeScript + TailwindCSS + shadcn/ui. No backend, no database, no auth. All data is fetched client-side from public JSON endpoints.

Data

Fetch these two endpoints on load and every 15 minutes:

https://raw.githubusercontent.com/amith-vp/Kerala-Dam-Water-Levels/main/live.json (KSEB dams)

https://raw.githubusercontent.com/amith-vp/Kerala-Dam-Water-Levels/main/irrigation_live.json (Irrigation dams)

Both return Access-Control-Allow-Origin: *, so fetch them directly from the browser. No proxy needed.

Response shape:

{
  "lastUpdate": "01.08.2026",
  "dams": [
    {
      "id": "1",
      "name": "Neyyar",
      "officialName": "Neyyar",
      "district": "Thiruvananthapuram",
      "MWL": "84.75",
      "FRL": "84.75",
      "ruleLevel": "",
      "blueLevel": "83.25",
      "orangeLevel": "83.75",
      "redLevel": "84.4",
      "latitude": 8.5333,
      "longitude": 77.15,
      "data": [
        {
          "date": "01.08.2026",
          "waterLevel": "84.75",
          "storagePercentage": "100.00",
          "inflow": "12.5",
          "spillwayRelease": "8.2",
          "totalOutflow": "8.2",
          "rainfall": "45.0"
        }
      ]
    }
  ]
}


Important notes on this data:

All numeric fields arrive as strings. Parse them. Some are empty strings — handle that.

Dates are DD.MM.YYYY. Parse accordingly, do not assume ISO.

The KSEB feed has no district field. The irrigation feed does. Handle both.

data is an array; the current reading is data[0].

The two feeds have different lastUpdate values. Never merge them into one global timestamp.

Alert levels

Colour each dam by comparing data[0].waterLevel against the official thresholds already in the payload. Do not invent thresholds.

waterLevel >= redLevel → RED / അതീവ ജാഗ്രത

waterLevel >= orangeLevel → ORANGE / ജാഗ്രത

waterLevel >= blueLevel → BLUE / ശ്രദ്ധിക്കുക

below all → NORMAL / സാധാരണ

any threshold missing or unparseable → UNKNOWN / വിവരം ലഭ്യമല്ല, rendered grey

CRITICAL — staleness handling

This is the single most important feature of the app. Build it first and do not compromise it.

The upstream feeds sometimes stop updating. As of today the KSEB feed is ten days stale while the irrigation feed is current. Showing a ten-day-old water level as if it were live, during an active flood, could get someone killed.

Compute staleness per dam, from that dam's own reading date, not from a global timestamp.

Under 12 hours → render normally. Show relative age, e.g. "3 മണിക്കൂർ മുൻപ്" / "3 hours ago".

12 to 48 hours → render the card visually degraded: greyscale, 60% opacity, and a prominent amber STALE / പഴയ വിവരം badge showing exact age in days and hours.

Over 48 hours → do not render the water level number at all. Replace the entire reading with the text നിലവിലെ വിവരം ലഭ്യമല്ല / No current data plus the date last seen and a link to the official source. A blank is safe. A stale number is not.

That last rule will feel wrong to implement. Implement it anyway.

Show a persistent banner at the top of the page whenever any feed is over 24 hours old, naming which feed and how old.

Pages

Only two. Do not add more.

1. Dashboard (home)

Persistent disclaimer bar at the very top, always visible, cannot be dismissed: "അനൗദ്യോഗിക വിവരങ്ങൾ. ഔദ്യോഗിക നിർദ്ദേശങ്ങൾക്ക് KSDMA-യെ ആശ്രയിക്കുക." / "Unofficial aggregator. Not a government service. Always confirm with KSDMA and your district authorities before acting." with a link to sdma.kerala.gov.in

Summary strip: count of dams at RED, ORANGE, BLUE, and count with stale/no data.

Dams at RED and ORANGE pinned to the top, as large cards, sorted by severity.

Below that, all remaining dams as a compact sortable/filterable table.

Filter by district. Filter by alert level. Text search by dam name.

Each dam card/row shows: name, district, current level, FRL, storage %, spillway release, alert badge, its own timestamp, and a link to the official source.

2. Dam detail (route /dam/:id)

All fields for that dam.

A Recharts line chart of water level over time with horizontal reference lines drawn at blueLevel, orangeLevel, redLevel and FRL.

Link to official source.

Design

Clean, minimal, fast, mobile-first. Think Apple Weather crossed with a government status page. Blue/white/grey base with alert colours used sparingly and only where they carry meaning. No decorative animation. No hero section. No marketing copy. Assume the user is anxious, on a phone, on a bad 3G connection, and needs one number fast.

Malayalam is the primary language, English secondary. Show both on key labels, with Malayalam first. The audience is people in the affected districts.

Keep the initial payload small. Show skeleton loaders while fetching. If a fetch fails, serve the last successfully fetched payload from memory, clearly labelled with its age — never show an error page with no data.

PROMPT 2 — Map

Only after Prompt 1 is working and deployed.

Add a third page: an interactive map at route /map.

Use Leaflet with OpenStreetMap tiles — no API key, no billing.

Plot every dam using the latitude / longitude already in the feed data.

Colour each marker by its alert level, using the exact same logic as the dashboard. Import the shared function; do not duplicate it.

Dams with data over 48 hours old render as hollow grey markers.

Clicking a marker opens a popup with dam name, current level, alert badge, its timestamp, and a link through to the dam detail page.

Add a "locate me" button.

Include a legend explaining the colours, in Malayalam and English.

Default view centred on Kerala, zoom level 7.

Must work well on a phone. Markers need to be large enough to tap accurately.

PROMPT 3 — Emergency contacts

Add a page at route /emergency listing emergency contact numbers, grouped by category: State Emergency Operations Centre, District Control Rooms (all 14 districts), Police, Fire and Rescue, Ambulance, and Disaster Management.

Every number is a tel: link with a large, obvious one-tap call button.

Malayalam labels first, English second.

This page must work fully offline — hardcode the numbers directly in the source, no fetch, no dependency on any feed.

Link it prominently from the dashboard header. During a flood this may be the most useful page on the site.

I will supply the actual numbers — leave clearly marked placeholders and do not invent any. Wrong emergency numbers are worse than no emergency numbers.

PROMPT 4 — Polish

Add a footer stating: data sourced from KSEB Dam Safety Organisation and Kerala State Disaster Management Authority via a public community-maintained feed; this site is not affiliated with either; link to both official sites and to the project's GitHub repo.

Add an "about the data" page explaining in plain Malayalam and English where numbers come from, how often they update, what the alert colours mean, and — explicitly — that the feed can lag and users must confirm with official sources.

Add <meta> tags and Open Graph tags so links shared on WhatsApp preview correctly. This will spread mainly through WhatsApp, so the preview card matters a lot.

Add a manual refresh button showing the time of the last successful fetch.

Ensure full keyboard navigation and sufficient colour contrast. Do not rely on colour alone to convey alert level — always pair it with a text label.

Before you paste anything

Someone should spend ten minutes checking why the KSEB feed stopped updating on 22 July. Look at the GitHub Actions run history on amith-vp/Kerala-Dam-Water-Levels. KSEB owns Idukki, Idamalayar, Kakki, Sholayar and Kallarkutty — the dams that matter most this week. KSEB opened all five Kallarkutty shutters on 1 August and the feed does not show it.

If that feed cannot be revived, half this dashboard renders "no current data" — which is the honest and correct outcome, but you should know it before you build, not after. The fallback is scraping sdma.kerala.gov.in/dam-water-level/ directly and contributing the fix upstream.

Do not add to v1

Community reporting, admin portal, login, notification subscriptions, rivers, weather, rainfall, relief camps, hospitals, police stations, CSV export, dark mode, AI prediction, satellite imagery, boat tracking. Every one of these is in the original PRD. Every one of them either needs a data source nobody has identified, or a moderation workflow nobody has staffed. Ship two pages that are correct before adding a tenth page that is empty.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://flood-level-alert.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/39371c9b-a1c3-4235-a90a-263b4b773417).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
