import type {Resort} from '~/data/resorts';

export type SnowfallSummary = {
  temperatureC: number;
  snowfall24hCm: number;
  snowfall7dCm: number;
  snowDepthCm: number;
  windKph: number;
  fetchedAt: string;
};

export type ResortWeather =
  | {status: 'fresh' | 'stale'; summary: SnowfallSummary}
  | {status: 'unavailable'; summary: null};

export const WEATHER_FRESH_MS = 15 * 60 * 1000;
export const WEATHER_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const WEATHER_TIMEOUT_MS = 5000;

type WeatherOptions = {
  cache?: Pick<Cache, 'match' | 'put'>;
  fetcher?: typeof fetch;
  now?: () => number;
  timeoutMs?: number;
};

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isSummary(value: unknown): value is SnowfallSummary {
  if (!value || typeof value !== 'object') return false;
  const data = value as SnowfallSummary;
  return (
    isNumber(data.temperatureC) &&
    [
      data.snowfall24hCm,
      data.snowfall7dCm,
      data.snowDepthCm,
      data.windKph,
    ].every((metric) => isNumber(metric) && metric >= 0) &&
    typeof data.fetchedAt === 'string' &&
    Number.isFinite(Date.parse(data.fetchedAt))
  );
}

export async function getSnowfallSummary(
  resort: Resort,
  {
    fetcher = fetch,
    now = Date.now,
    timeoutMs = WEATHER_TIMEOUT_MS,
  }: WeatherOptions = {},
): Promise<SnowfallSummary> {
  const params = new URLSearchParams({
    latitude: String(resort.latitude),
    longitude: String(resort.longitude),
    current: 'temperature_2m,wind_speed_10m,snow_depth',
    hourly: 'snowfall',
    daily: 'snowfall_sum',
    forecast_days: '7',
    past_days: '1',
    timezone: 'auto',
    timeformat: 'unixtime',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(
      `https://api.open-meteo.com/v1/forecast?${params}`,
      {
        headers: {accept: 'application/json'},
        signal: controller.signal,
      },
    );
    if (!response.ok) throw new Error('Snow conditions unavailable');

    const data = (await response.json()) as {
      current?: {
        time?: number;
        temperature_2m?: number;
        wind_speed_10m?: number;
        snow_depth?: number;
      };
      hourly?: {time?: number[]; snowfall?: number[]};
      daily?: {snowfall_sum?: number[]};
    } | null;
    const current = data?.current;
    const times = data?.hourly?.time;
    const hourlySnow = data?.hourly?.snowfall;
    const dailySnow = data?.daily?.snowfall_sum;
    if (
      !isNumber(current?.time) ||
      !isNumber(current?.temperature_2m) ||
      !isNumber(current?.wind_speed_10m) ||
      !isNumber(current?.snow_depth) ||
      !Array.isArray(times) ||
      !Array.isArray(hourlySnow) ||
      times.length !== hourlySnow.length ||
      !times.every(isNumber) ||
      !Array.isArray(dailySnow) ||
      dailySnow.length !== 8 ||
      !dailySnow.every((value) => isNumber(value) && value >= 0)
    )
      throw new Error('Invalid weather response');

    // Hourly snowfall is the preceding hour's total. End at the latest full hour.
    const end = Math.floor(current.time / 3600) * 3600;
    const recentSnow = times.flatMap((time, index) =>
      time > end - 86400 && time <= end ? [hourlySnow[index]] : [],
    );
    const recentTimes = times.filter(
      (time) => time > end - 86400 && time <= end,
    );
    if (
      recentSnow.length !== 24 ||
      new Set(recentTimes).size !== 24 ||
      !recentSnow.every((value) => isNumber(value) && value >= 0)
    ) {
      throw new Error('Incomplete snowfall history');
    }
    const summary = {
      temperatureC: current.temperature_2m,
      snowfall24hCm: recentSnow.reduce((total, value) => total + value, 0),
      snowfall7dCm: dailySnow
        .slice(1)
        .reduce((total, value) => total + value, 0),
      snowDepthCm: current.snow_depth * 100,
      windKph: current.wind_speed_10m,
      fetchedAt: new Date(now()).toISOString(),
    };
    if (!isSummary(summary)) throw new Error('Invalid weather metrics');
    return summary;
  } finally {
    clearTimeout(timer);
  }
}

export async function getResortWeather(
  resort: Resort,
  options: WeatherOptions = {},
): Promise<ResortWeather> {
  const {cache, now = Date.now} = options;
  // Versioned and coordinate-specific: incompatible or relocated entries are not reused.
  const key = new Request(
    `https://weather-cache.internal/v2/${resort.slug}?lat=${resort.latitude}&lon=${resort.longitude}`,
  );
  let cached: SnowfallSummary | undefined;
  try {
    const response = await cache?.match(key);
    const value: unknown = response ? await response.json() : null;
    if (isSummary(value)) cached = value;
  } catch {
    // A cache outage must not prevent fetching the provider.
  }
  const age = () => (cached ? now() - Date.parse(cached.fetchedAt) : Infinity);
  if (cached && age() >= 0 && age() < WEATHER_FRESH_MS) {
    return {status: 'fresh', summary: cached};
  }
  try {
    const summary = await getSnowfallSummary(resort, options);
    try {
      await cache?.put(
        key,
        new Response(JSON.stringify(summary), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': `public, max-age=${WEATHER_MAX_AGE_MS / 1000}`,
          },
        }),
      );
    } catch {
      // Fresh weather is still usable if persistence fails.
    }
    return {status: 'fresh', summary};
  } catch {
    if (cached && age() >= 0 && age() < WEATHER_MAX_AGE_MS) {
      return {status: 'stale', summary: cached};
    }
    return {status: 'unavailable', summary: null};
  }
}
