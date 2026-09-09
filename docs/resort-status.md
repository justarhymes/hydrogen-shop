# Resort work status

The storefront homepage stays shop-focused. This checklist covers the resort work requested in this conversation.

## Implemented

- Weather timeout, validation, 15-minute cache, six-hour maximum stale fallback, loading/error states, update timestamp, and zero-snow handling.
- Seven-resort registry covering North America, Europe, Japan, Australia/New Zealand, and South America.
- Name/location search, local region and world-region filters, and fresh-weather filters (past snowfall, freezing temperature, modeled snow depth). Filters are shareable GET URLs.
- Map refresh after filtering, single-result zoom limit, readable resort cards without JavaScript, locale-aware popup links, and map-library failure fallback.
- Official webcam page links. No webcam images have been copied or embedded.
- Official conditions links, including lift/terrain pages where identified. These links do not supply live operating counts inside this app.
- Avalanche.org adapter for Park City: exact coordinate coverage, source/region/danger/issue/expiry display, no expired-rating fallback, no interpretation of weather as avalanche danger. Other resorts link to official regional sources where verified.
- Resort-specific title/description/canonical URL, SkiResort structured data, and locale-aware breadcrumbs.
- Consent-gated Hydrogen custom resort-view and recommendation-click events. These are published to Hydrogen's event bus; a destination/subscriber is still required for external reporting.
- 13 passing adapter/search/metadata tests and five passing local Chromium browser tests (see ski-features.md for commands). Production build, TypeScript and targeted ESLint checks pass.

## Not complete — external dependencies

| Item                                                        | Current state                             | Needed to finish                                                                                                                                                          |
| ----------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live lifts, trails, official base depth and operating hours | Official report links; no in-app feed     | An official documented feed with reuse authorization, schema and access details. Do not scrape undocumented website endpoints or present fixture counts as live data.     |
| Webcam embeds and image timestamps                          | Official webcam links only                | Resort/provider embed or image-reuse permission and a timestamped supported source. A publicly viewable camera page is not proof of third-party reuse rights.             |
| Independent backup weather provider                         | Validated cached Open-Meteo fallback only | Select a provider with the required coverage/fields and commercial terms; configure credentials if required. A different Open-Meteo model is not an independent provider. |
| More avalanche-center integrations                          | US public adapter plus official links     | Confirm each center's API access, terms, valid-time semantics and geographic coverage. Météo-France's public-data page routes API users through authentication.           |
| Analytics reporting destination                             | Events published with tracking consent    | Connect an analytics subscriber/destination selected for the shop.                                                                                                        |

The user confirmed there are no existing feed accounts or webcam reuse permissions. These rows must not be marked complete merely because links or integration interfaces exist.

## Source register

Checked during implementation on 2026-09-09. Coordinates are approximate resort/mountain locations for map discovery and model-weather sampling, not route-navigation points. Elevations refer to the listed mountain/ski-area high point and are not used as weather station measurements.

| Resort             | Official source pages                                                                                                                                                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Whistler Blackcomb | [Mountain cameras](https://www.whistlerblackcomb.com/the-mountain/mountain-conditions/mountain-cams.aspx), [lift and terrain status](https://www.whistlerblackcomb.com/the-mountain/mountain-conditions/terrain-and-lift-status.aspx)                                  |
| Park City          | [Mountain cameras](https://www.parkcitymountain.com/the-mountain/mountain-conditions/mountain-cams.aspx), [lift and terrain status](https://www.parkcitymountain.com/the-mountain/mountain-conditions/terrain-and-lift-status.aspx)                                    |
| Chamonix           | [Tourism office](https://www.chamonix.com/), [Mont-Blanc avalanche bulletin](https://www.chamonix.com/bulletin-avalanche/BRA_MONT-BLANC.pdf)                                                                                                                           |
| Niseko United      | [Official lift status](https://www.niseko.ne.jp/en/niseko-lift-status/), [cameras](https://www.niseko.ne.jp/en/livecamera/), [avalanche information](https://www.niseko.ne.jp/en/niseko-avalanche-report/), [Annupuri mountain information](https://annupuri.info/en/) |
| Thredbo            | [Cameras](https://www.thredbo.com.au/weather/snow-cams/), [official trail map with elevation](https://www.thredbo.com.au/wp-content/uploads/2024/05/Thredbo-Winter-2024-Trail-Map.pdf)                                                                                 |
| Coronet Peak       | [Official weather report and webcams](https://www.coronetpeak.co.nz/weather-report), [mountain information](https://www.coronetpeak.co.nz/summer/mountain-info-maps), [Queenstown avalanche advisory](https://www.avalanche.net.nz/region/queenstown)                  |
| Portillo           | [Official report and camera](https://skiportillo.com/en/our-mountain/portillo-snow-forecast-conditions/), [mountain statistics](https://skiportillo.com/en/portillo-trail-map-complete-guide-to-understanding-the-mountain/)                                           |

No verified regional avalanche link is configured for Thredbo or Portillo. Their pages say so rather than linking an unrelated forecast.

## Provider references

- [Avalanche.org public API documentation](https://github.com/NationalAvalancheCenter/Avalanche.org-Public-API-Docs): geographic coverage, ratings, source links, dates and expiry requirements. Its danger rating is a regional backcountry forecast, not a piste safety rating.
- [Avalanche Canada data-sharing policy](https://avalanche.ca/data-sharing-policy): source-specific access and use requirements must be checked when adding that integration.
- [Météo-France public avalanche data](https://donneespubliques.meteofrance.fr/?fond=produit&id_produit=265&id_rubrique=50): authenticated API access.
- [Open-Meteo documentation](https://open-meteo.com/en/docs): field definitions and units; check applicable commercial service terms when moving beyond the demo.
