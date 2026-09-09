import {test, expect} from '@playwright/test';

import {
  getResortWeather,
  getSnowfallSummary,
  WEATHER_FRESH_MS,
  WEATHER_MAX_AGE_MS,
} from '../../app/data/weather';
import {resorts} from '../../app/data/resorts';

const timestamp = Date.parse('2026-09-09T12:00:00Z');
const now = () => timestamp;
const summary = {
  temperatureC: -5,
  snowfall24hCm: 24,
  snowfall7dCm: 14,
  snowDepthCm: 150,
  windKph: 12,
  fetchedAt: new Date(timestamp).toISOString(),
};
function payload() {
  return {
    current: {
      time: timestamp / 1000,
      temperature_2m: -5,
      wind_speed_10m: 12,
      snow_depth: 1.5,
    },
    hourly: {
      time: Array.from(
        {length: 25},
        (_, i) => timestamp / 1000 - (24 - i) * 3600,
      ),
      snowfall: [999, ...Array<number>(24).fill(1)],
    },
    daily: {snowfall_sum: [999, 2, 2, 2, 2, 2, 2, 2]},
  };
}
const success: typeof fetch = async () => Response.json(payload());
const failure: typeof fetch = async () => {
  throw new Error('offline');
};
function memoryCache(value?: unknown) {
  const values = new Map<string, Response>();
  const keys: string[] = [];
  return {
    keys,
    match: async (request: RequestInfo | URL) => {
      const key = request instanceof Request ? request.url : String(request);
      keys.push(key);
      return (
        values.get(key)?.clone() ?? (value ? Response.json(value) : undefined)
      );
    },
    put: async (request: RequestInfo | URL, response: Response) => {
      const key = request instanceof Request ? request.url : String(request);
      values.set(key, response.clone());
    },
  };
}

test('normalizes meters and past 24 full hours, excluding yesterday from the forecast', async () => {
  expect(await getSnowfallSummary(resorts[0], {fetcher: success, now})).toEqual(
    summary,
  );
});

test('zero snow remains valid data', async () => {
  const data = payload();
  data.current.snow_depth = 0;
  data.hourly.snowfall.fill(0);
  data.daily.snowfall_sum.fill(0);
  const result = await getResortWeather(resorts[0], {
    now,
    fetcher: async () => Response.json(data),
  });
  expect(result.status).toBe('fresh');
  expect(result.summary).toMatchObject({
    snowfall24hCm: 0,
    snowfall7dCm: 0,
    snowDepthCm: 0,
  });
});

test('fresh cached weather skips the provider', async () => {
  let calls = 0;
  const cache = memoryCache();
  const fetcher: typeof fetch = async () => {
    calls++;
    return Response.json(payload());
  };
  await getResortWeather(resorts[0], {now, cache, fetcher});
  const result = await getResortWeather(resorts[0], {
    now: () => timestamp + WEATHER_FRESH_MS - 1,
    cache,
    fetcher,
  });
  expect(result.status).toBe('fresh');
  expect(calls).toBe(1);
});

test('expired freshness triggers refresh and replaces the saved data', async () => {
  const cache = memoryCache({
    ...summary,
    fetchedAt: new Date(timestamp - WEATHER_FRESH_MS).toISOString(),
  });
  const result = await getResortWeather(resorts[0], {
    now,
    cache,
    fetcher: success,
  });
  expect(result).toEqual({status: 'fresh', summary});
  expect(
    await getResortWeather(resorts[0], {now, cache, fetcher: failure}),
  ).toEqual(result);
});

for (const [name, fetcher] of [
  ['network failure', failure],
  ['HTTP failure', async () => new Response('', {status: 503})],
  ['invalid JSON', async () => new Response('{')],
  ['missing metrics', async () => Response.json({})],
  [
    'null metrics',
    async () => Response.json({...payload(), current: {temperature_2m: null}}),
  ],
] as const) {
  test(`${name} returns labeled stale weather without changing its timestamp`, async () => {
    const saved = {
      ...summary,
      fetchedAt: new Date(timestamp - WEATHER_FRESH_MS).toISOString(),
    };
    expect(
      await getResortWeather(resorts[0], {
        now,
        cache: memoryCache(saved),
        fetcher,
      }),
    ).toEqual({status: 'stale', summary: saved});
  });
}

test('timeout aborts the provider and uses cached weather', async () => {
  const fetcher: typeof fetch = async (_url, init) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener(
        'abort',
        () => reject(new Error('aborted')),
        {once: true},
      );
    });
  const cache = memoryCache({
    ...summary,
    fetchedAt: new Date(timestamp - WEATHER_FRESH_MS).toISOString(),
  });
  expect(
    (await getResortWeather(resorts[0], {now, cache, fetcher, timeoutMs: 10}))
      .status,
  ).toBe('stale');
});

for (const [name, value] of [
  ['no cached data', undefined],
  [
    'too-old data',
    {
      ...summary,
      fetchedAt: new Date(timestamp - WEATHER_MAX_AGE_MS).toISOString(),
    },
  ],
  [
    'future timestamp',
    {...summary, fetchedAt: new Date(timestamp + 1000).toISOString()},
  ],
  ['corrupt data', {...summary, snowfall24hCm: null}],
] as const) {
  test(`${name} produces an unavailable state during provider failure`, async () => {
    expect(
      await getResortWeather(resorts[0], {
        now,
        cache: memoryCache(value),
        fetcher: failure,
      }),
    ).toEqual({status: 'unavailable', summary: null});
  });
}

test('cache failures do not discard a successful provider response', async () => {
  const cache = {
    match: async () => {
      throw new Error('cache failed');
    },
    put: async () => {
      throw new Error('cache failed');
    },
  };
  expect(
    await getResortWeather(resorts[0], {now, cache, fetcher: success}),
  ).toEqual({status: 'fresh', summary});
});

test('cache is isolated by resort coordinates', async () => {
  const cache = memoryCache();
  await getResortWeather(resorts[0], {now, cache, fetcher: success});
  expect(
    (await getResortWeather(resorts[1], {now, cache, fetcher: failure})).status,
  ).toBe('unavailable');
  expect(
    (
      await getResortWeather(
        {...resorts[0], latitude: 1},
        {now, cache, fetcher: failure},
      )
    ).status,
  ).toBe('unavailable');
  expect(new Set(cache.keys).size).toBe(3);
});

test('incomplete or negative snowfall is not treated as zero', async () => {
  for (const invalid of [null, -1]) {
    const data = payload();
    const fetcher: typeof fetch = async () =>
      Response.json({
        ...data,
        hourly: {
          ...data.hourly,
          snowfall: [999, invalid, ...Array(23).fill(0)],
        },
      });
    expect((await getResortWeather(resorts[0], {now, fetcher})).status).toBe(
      'unavailable',
    );
  }
});
