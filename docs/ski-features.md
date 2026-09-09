# Ski features

This document describes the first shared mountain-data slice and the intended path for expanding it.

## Current routes

- `/` renders the storefront homepage with shopping heroes, featured products, and collections.
- `/resorts` renders the resort directory and shared `ResortMap` component. Search by name or location with `?q=Canada`, and combine this with an exact `region` filter. The GET form produces shareable URLs and works without JavaScript.
- `/resorts/:resortHandle` renders one resort, a shared `SnowfallSummary`, an official resort link, and the shared map with the active resort highlighted.
- `/events` renders the event directory through the shared `EventList` component.

## Shared components

### `ResortMap`

Location: `app/components/ResortMap.tsx`

Use this when a page needs a compact resort directory. It accepts:

```ts
<ResortMap resorts={resorts} activeSlug="park-city" />
```

The component uses Leaflet with OpenStreetMap tiles. Keep the `resorts` prop and route links stable if the tile provider or map library changes later.

### `SnowfallSummary`

Location: `app/components/SnowfallSummary.tsx`

Use this for a compact conditions block on resort pages, collection landing pages, or eventually the homepage:

```ts
<SnowfallSummary summary={snowfall} />
```

The data is loaded server-side by `app/data/weather.ts` from Open-Meteo. The shared Oxygen cache stores validated weather independently of the page response. The component does not know where the data came from, so a resort-specific provider can replace Open-Meteo later without changing the UI.

### `GearRecommendations`

Location: `app/components/GearRecommendations.tsx`

`app/data/recommendations.ts` converts normalized weather into shopping guidance. The route owns the conditions and passes the resulting recommendations into the component:

```ts
<GearRecommendations recommendations={recommendations} />
```

The recommendations are deliberately rules-based and are not avalanche or mountain-safety advice.

### `EventList`

Location: `app/components/EventList.tsx`

The list accepts normalized `MountainEvent` records and does not fetch data itself:

```ts
<EventList events={events} />
```

The current adapter is the curated seed in `app/data/events.ts`. Replace that adapter with an approved event feed only after confirming reuse terms and source stability.

## Data flow

1. `app/data/resorts.ts` owns the typed resort registry.
2. A route resolves a resort by slug.
3. `app/data/weather.ts` fetches current conditions and snowfall from Open-Meteo.
4. Shared components render the normalized data.
5. Routes decide composition; components stay reusable and deliberately smaller.

## Planned additions

- Add a second weather provider when one is selected.
- Replace the placeholder official webcam links with provider-approved embeds where available.
- Add an events data adapter rather than putting event-fetching logic in components.
- Add a geocoding provider only if search expands beyond the curated registry; Leaflet already supports pan and zoom.

## Homepage direction

The homepage is a storefront first, with shopping heroes, featured products, and collections. Resort conditions, maps, and events are supporting tools on their dedicated routes. Any future homepage integration should remain compact and support shopping.

## Weather resilience

The resort loader defers `getResortWeather` so the map and official links render while weather loads. The result is `fresh`, `stale`, or `unavailable`:

- Validated forecasts are fresh for 15 minutes and retained in Oxygen's cache for up to six hours. Keys include provider schema version, resort slug, and coordinates.
- A refresh has a five-second timeout. HTTP errors, invalid JSON, missing metrics, and network failures fall back to the saved forecast only while it is under six hours old. The original fetch timestamp is preserved.
- Stale forecasts show a visible warning; condition-based shopping recommendations are hidden until fresh data returns.
- Without a usable cached forecast, the weather panel shows an unavailable message. Resort details, map, avalanche links, and webcam links remain accessible.
- Page responses are not cached, keeping freshness decisions in the weather adapter. Cache reads and writes are best effort; eviction or a cold cache can mean no stale fallback is available.

`SnowfallSummary` displays the last successful fetch time in UTC, not the provider's model update time. Snow depth is converted from meters to centimeters. Past snowfall uses the last 24 complete hourly totals; the seven-day forecast includes today and excludes yesterday. Missing values are not replaced with zero; genuine zero-snow values remain valid.

Provider fields and units: [Open-Meteo API documentation](https://open-meteo.com/en/docs). These are modeled weather values, not official resort operating reports.

Run the isolated weather adapter tests without a server or external API calls:

```sh
npx playwright test --config playwright.weather.config.ts
```

## Resort directory search

Search logic lives in `filterResorts` in `app/data/resorts.ts`. It matches every search term against resort names and locations, ignoring case and accents. Region choices come directly from the registry. Empty results offer a clear-filters link rather than trying to fit an empty map.

The map rebuilds when filters change, caps zoom for single-resort results, preserves the selected locale in marker links, and keeps resort cards available if the map library fails to load.

Run directory search tests:

```sh
npx playwright test --config playwright.resorts.config.ts
```

## Adding a resort

Add an entry to `app/data/resorts.ts` with a unique stable slug, display name, local region, world area, approximate latitude/longitude, elevation, official homepage, conditions page, webcam page and optional regional avalanche source. Use `null` for an unverified avalanche source. Keep source references in `docs/resort-status.md`. The directory, filters and route lookup share this registry; a future CMS adapter should return the same type.

World-region filtering uses `area`. Snow filters use `snow=new-snow`, `snow=freezing` or `snow=snow-depth`. Weather is fetched only when a snow filter is requested, after text/geographic filtering. Stale/unavailable reports are excluded and counted visibly.

## Adding providers

Keep provider parsing in `app/data`, never in a route or component. Use server-side requests with timeouts and validate raw responses before caching them. Preserve source, issue time and validity separately from fetch time. Do not turn missing numbers into zero.

A new weather provider must normalize Celsius, km/h and centimeters, with explicit time windows for past snowfall versus forecast snowfall. If it cannot supply a metric, extend the shared type and UI to represent unavailable values; do not substitute a different metric. Add fixture tests for units, zero snow, invalid responses, expiry and outages before enabling it.

A resort operating-conditions adapter should return open/total lift and trail counts, official base depth, operating hours, source URL, issue time and expiry. Each resort/provider needs its own parser; unknown, closed and zero must remain distinct. No live operating feed is currently configured.

Avalanche parsing is separate from weather in `app/data/avalanche.ts`. The active US adapter uses documented Avalanche.org geographic polygons, requires exactly one covering forecast, handles source timezone timestamps, and discards expired/no-rating/invalid results. The UI expires displayed ratings. New centers must retain their official labels, source attribution and valid-time semantics; never derive danger from model weather.

## Maps and webcams

`ResortMap` dynamically loads Leaflet and uses OpenStreetMap tiles with attribution. Changing tile providers requires updating the tile URL, attribution and the image CSP in `app/entry.server.tsx`. Keep marker links locale-aware. No geocoding request runs as part of search; search uses the registry.

Webcams open official pages. Before adding an embed, record reuse permission, permitted URL/origin and source timestamp behavior, then add only that origin to CSP. Do not describe the link-verification date as the camera-image timestamp.

## Analytics and validation

`ResortAnalytics` publishes `custom_resort_view` with `resortSlug`. Gear links publish `custom_recommendation_click` with `resortSlug`, `collectionHandle` and title. Both respect Hydrogen's tracking consent. Connect a Hydrogen analytics subscriber for external reporting; custom events are not automatically a configured analytics destination.

Run browser tests against a running local Hydrogen server:

```sh
npm run dev -- --port 3001
RESORT_TEST_URL=http://localhost:3001 npx playwright test --config playwright.resorts-browser.config.ts
```

Install Playwright's compatible Chromium with `npx playwright install chromium` if needed. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` can select an existing compatible headless binary. Browser tests cover map filtering/clearing, marker links, detail metadata, weather fallback visibility, mobile layout, no-JavaScript search and missing resorts. They retain CSP and use the app's actual server loaders; deterministic outage/expiry tests run separately with mocked provider responses.

For completion and external dependencies, see [resort work status](resort-status.md).

## Open-Meteo setup

The demo adapter calls `https://api.open-meteo.com/v1/forecast` server-side; its current public endpoint requires no key. Coordinates come from the shared registry. The existing Oxygen `cache` is passed through loader context for validated weather storage. No browser API credential is required. Before a production commercial rollout, select the appropriate Open-Meteo service plan/endpoint and keep any credentials server-side.
