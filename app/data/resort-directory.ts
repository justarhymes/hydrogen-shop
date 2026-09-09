import {filterResorts, resorts} from '~/data/resorts';
import {getResortWeather, type ResortWeather} from '~/data/weather';

export const snowFilters = ['new-snow', 'freezing', 'snow-depth'] as const;
export type SnowFilter = (typeof snowFilters)[number];

export function matchesSnowFilter(weather: ResortWeather, filter: string) {
  if (weather.status !== 'fresh') return false;
  if (filter === 'new-snow') return weather.summary.snowfall24hCm > 0;
  if (filter === 'freezing') return weather.summary.temperatureC <= 0;
  if (filter === 'snow-depth') return weather.summary.snowDepthCm > 0;
  return false;
}

export async function loadResortDirectory(
  request: Request,
  cache?: Pick<Cache, 'match' | 'put'>,
  weatherLoader = getResortWeather,
) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q')?.trim() ?? '';
  const region = url.searchParams.get('region') ?? '';
  const area = url.searchParams.get('area') ?? '';
  const snow = url.searchParams.get('snow') ?? '';
  const regions = [...new Set(resorts.map((resort) => resort.region))].sort();
  const areas = [...new Set(resorts.map((resort) => resort.area))].sort();
  const directory = filterResorts(resorts, {query, region, area});
  const result = {
    resorts: directory,
    query,
    region,
    area,
    areas,
    regions,
    snow,
    unavailable: 0,
  };
  if (!snow) return result;
  if (!snowFilters.includes(snow as SnowFilter))
    return {...result, resorts: []};
  // Only request weather after text/region filtering, and only for snow queries.
  const reports = await Promise.all(
    directory.map(async (resort) => ({
      resort,
      weather: await weatherLoader(resort, {cache}),
    })),
  );
  return {
    ...result,
    resorts: reports
      .filter(({weather}) => matchesSnowFilter(weather, snow))
      .map(({resort}) => resort),
    unavailable: reports.filter(({weather}) => weather.status !== 'fresh')
      .length,
  };
}
