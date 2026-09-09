import {json, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Form, useLoaderData, useNavigation} from '@remix-run/react';

import {Link} from '~/components/Link';
import {ResortMap} from '~/components/ResortMap';
import {PageHeader, Section, Text} from '~/components/Text';
import {loadResortDirectory} from '~/data/resort-directory';
import {routeHeaders, CACHE_NONE} from '~/data/cache';

export const headers = routeHeaders;

export async function loader({request, context}: LoaderFunctionArgs) {
  return json(await loadResortDirectory(request, context.cache), {
    headers: {'Cache-Control': CACHE_NONE},
  });
}

export const meta = () => [
  {title: 'Resorts | Hydrogen Demo Store'},
  {
    name: 'description',
    content: 'Explore resort locations and mountain conditions.',
  },
];

export default function Resorts() {
  const {
    resorts: resortDirectory,
    query,
    region,
    regions,
    area,
    areas,
    snow,
    unavailable,
  } = useLoaderData<typeof loader>();

  const navigation = useNavigation();

  return (
    <>
      <PageHeader heading="Find your mountain" />
      <Section className="grid gap-6">
        <Text width="narrow">
          Find a resort by name or location, then explore its weather forecast,
          map, and official mountain links.
        </Text>
        <Form
          method="get"
          aria-label="Resort filters"
          className="grid grid-cols-3 gap-2 md:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))_auto]"
          key={`${query}:${region}:${area}:${snow}`}
        >
          <label className="col-span-2 min-w-0 md:col-span-1">
            <span className="sr-only">Resort or location</span>
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Resort or location"
              className="h-11 w-full min-w-0 truncate rounded border-primary/20 bg-contrast text-sm"
            />
          </label>
          <label className="min-w-0">
            <span id="region-label" className="sr-only">
              Region
            </span>
            <select
              name="region"
              aria-labelledby="region-label"
              defaultValue={region}
              className="h-11 w-full min-w-0 truncate rounded border-primary/20 bg-contrast text-sm"
            >
              <option value="">Region</option>
              {region && !regions.includes(region) && (
                <option value={region}>{region}</option>
              )}
              {regions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-0">
            <span id="area-label" className="sr-only">
              World region
            </span>
            <select
              name="area"
              aria-labelledby="area-label"
              defaultValue={area}
              className="h-11 w-full min-w-0 truncate rounded border-primary/20 bg-contrast text-sm"
            >
              <option value="">Area</option>
              {area && !areas.includes(area as (typeof areas)[number]) && (
                <option value={area}>{area}</option>
              )}
              {areas.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-0">
            <span id="snow-label" className="sr-only">
              Snow conditions
            </span>
            <select
              name="snow"
              aria-labelledby="snow-label"
              defaultValue={snow}
              className="h-11 w-full min-w-0 truncate rounded border-primary/20 bg-contrast text-sm"
            >
              <option value="">Snow</option>
              <option value="new-snow">Snow in the past 24 hours</option>
              <option value="freezing">At or below freezing</option>
              <option value="snow-depth">Modeled snow on the ground</option>
              {snow &&
                !['new-snow', 'freezing', 'snow-depth'].includes(snow) && (
                  <option value={snow}>{snow}</option>
                )}
            </select>
          </label>
          <button
            type="submit"
            aria-label="Search resorts"
            className="col-start-3 row-start-1 h-11 rounded bg-primary px-4 text-sm text-contrast md:col-start-5"
          >
            Search
          </button>
        </Form>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p role="status">
            {navigation.state !== 'idle'
              ? 'Updating resorts…'
              : `${resortDirectory.length} ${
                  resortDirectory.length === 1 ? 'resort' : 'resorts'
                } found`}
          </p>
          {(query || region || area || snow) && (
            <Link to="/resorts" className="underline">
              Clear filters
            </Link>
          )}
        </div>
        {snow && (
          <p className="text-fine opacity-70">
            Filters use recent modeled weather, not official piste conditions.
            {unavailable > 0 &&
              ` ${unavailable} resorts could not be checked and are excluded.`}
          </p>
        )}
        {resortDirectory.length ? (
          <ResortMap resorts={resortDirectory} />
        ) : (
          <p className="border border-primary/10 p-6">
            No resorts match these filters. Try another name or choose all
            regions.
          </p>
        )}
      </Section>
    </>
  );
}
