# Shop search and palette

`/search?q=...` searches Shopify products and preserves product pagination. The `type` parameter selects `products`, `journal`, or `events`.

- Product suggestions use Shopify Storefront `predictiveSearch` through `/api/search?q=...` (locale-prefixed when applicable). Inputs debounce for 250 ms, require two characters, and cap queries at 200 characters. Obsolete browser requests are aborted; mismatched responses are not shown. Up/down selects a suggestion, Enter opens it, Escape dismisses it. Go runs full search even when suggestions are unavailable.
- Desktop/tablet headers use the same search form as the search page. Small screens link to the full search page.
- Journal search uses Shopify's article search, only linking articles in the existing `journal` blog. Additional pages are reached with the “More journal results” link. Results use the existing article route.
- Event search matches all entered words across event title, location, category and date. Events remain explicitly labeled sample data. The GET form works without JavaScript.
- Shopify errors display unavailable states; an empty result is distinct from an error.

Theme tokens in `app/styles/app.css` follow the supplied palette: primary `#262626`, secondary `#c4b5fd`, accent `#dcfce7`, info `#6b7280`, base/contrast `#f3f4f6`. Tailwind exposes the corresponding colors. Search actions and selected tabs use lavender; suggestions and sale badges use mint with charcoal text. The base palette no longer switches automatically with the operating-system color preference.

Run browser verification against a local server:

```sh
RESORT_TEST_URL=http://localhost:3002 npx playwright test --config playwright.shop-search.config.ts
```

`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` can select an existing compatible Chromium binary. The suite covers live Shopify predictions, keyboard selection, dismissal/clearing, suggestion failure, journal and sample-event results, palette/mobile layout, and form submission without JavaScript.
