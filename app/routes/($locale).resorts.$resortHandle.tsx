import {
  defer,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {Suspense} from 'react';
import {Await, useLoaderData} from '@remix-run/react';

import {getAvalancheForecast} from '~/data/avalanche';
import {AvalancheReport} from '~/components/AvalancheReport';
import {resortSeo} from '~/lib/resort-seo';
import {ResortAnalytics} from '~/components/ResortAnalytics';
import {ResortMap} from '~/components/ResortMap';
import {SnowfallSummary} from '~/components/SnowfallSummary';
import {GearRecommendations} from '~/components/GearRecommendations';
import {Heading, PageHeader, Section, Text} from '~/components/Text';
import {Link} from '~/components/Link';
import {getResort, resorts} from '~/data/resorts';
import {getResortWeather} from '~/data/weather';
import {getGearRecommendations} from '~/data/recommendations';
import {routeHeaders, CACHE_NONE} from '~/data/cache';

export const headers = routeHeaders;

export function loader({params, context, request}: LoaderFunctionArgs) {
  const resort = getResort(params.resortHandle ?? '');
  if (!resort) throw new Response('Resort not found', {status: 404});

  const weather = getResortWeather(resort, {cache: context.cache});
  return defer(
    {
      resort,
      weather,
      avalanche: getAvalancheForecast(resort),
      url: request.url,
    },
    {headers: {'Cache-Control': CACHE_NONE}},
  );
}

export const meta = ({data}: MetaArgs<typeof loader>) =>
  data ? resortSeo(data.resort, data.url) : [{title: 'Resort not found'}];

export default function ResortDetail() {
  const {resort, weather, avalanche} = useLoaderData<typeof loader>();

  return (
    <>
      <ResortAnalytics slug={resort.slug} />
      <nav aria-label="Breadcrumb" className="px-6 pt-6 md:px-8 lg:px-12">
        <Link to="/resorts" className="underline">
          Resorts
        </Link>{' '}
        / <span aria-current="page">{resort.name}</span>
      </nav>
      <PageHeader heading={resort.name}>
        <Text>{resort.region}</Text>
      </PageHeader>
      <Section className="grid gap-10">
        <Suspense
          fallback={
            <p role="status" className="border border-primary/10 p-5">
              Loading mountain conditions…
            </p>
          }
        >
          <Await resolve={weather} errorElement={<WeatherUnavailable />}>
            {(result) =>
              result.summary ? (
                <div className="grid gap-8">
                  <SnowfallSummary
                    summary={result.summary}
                    stale={result.status === 'stale'}
                  />
                  {result.status === 'fresh' && (
                    <GearRecommendations
                      resortSlug={resort.slug}
                      recommendations={getGearRecommendations(result.summary)}
                    />
                  )}
                </div>
              ) : (
                <WeatherUnavailable />
              )
            }
          </Await>
        </Suspense>
        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr] md:items-start">
          <div className="grid gap-4">
            <Heading as="h2" size="lead">
              About this resort
            </Heading>
            <Text>
              Summit elevation: {resort.elevationM.toLocaleString()} metres.
              Mountain conditions are fetched server-side and should be paired
              with the resort&apos;s official report before planning a trip.
            </Text>
            <a href={resort.conditionsUrl} target="_blank" rel="noreferrer">
              Official resort conditions ↗
            </a>
          </div>
          <div className="grid gap-4 border border-primary/10 p-5">
            <p className="text-fine uppercase tracking-[0.12em] opacity-60">
              Mountain links
            </p>
            {resort.avalancheUrl ? (
              <a href={resort.avalancheUrl} target="_blank" rel="noreferrer">
                Official avalanche information ↗
              </a>
            ) : (
              <p className="text-sm">
                No regional avalanche source is listed. Ask the resort for local
                information.
              </p>
            )}
            <a href={resort.webcamUrl} target="_blank" rel="noreferrer">
              Resort webcams ↗
            </a>
          </div>
        </div>
        {resort.slug === 'park-city' && (
          <Suspense
            fallback={
              <p role="status">Loading the regional avalanche bulletin…</p>
            }
          >
            <Await resolve={avalanche}>
              {(forecast) => <AvalancheReport forecast={forecast} />}
            </Await>
          </Suspense>
        )}
        <ResortMap
          resorts={resorts.filter((item) => item.area === resort.area)}
          activeSlug={resort.slug}
        />
      </Section>
    </>
  );
}

function WeatherUnavailable() {
  return (
    <div role="status" className="grid gap-2 border border-primary/10 p-5">
      <h2 className="text-lead font-medium">Weather temporarily unavailable</h2>
      <p>
        We couldn&apos;t retrieve a recent forecast. Try reloading shortly, or
        use the official resort conditions link below.
      </p>
    </div>
  );
}
