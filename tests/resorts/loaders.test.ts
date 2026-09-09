import {test, expect} from '@playwright/test';

import {
  loadResortDirectory,
  matchesSnowFilter,
} from '../../app/data/resort-directory';
import {resortSeo} from '../../app/lib/resort-seo';
import {resorts} from '../../app/data/resorts';
import type {ResortWeather} from '../../app/data/weather';

const weather: ResortWeather = {
  status: 'fresh',
  summary: {
    temperatureC: 0,
    snowfall24hCm: 0,
    snowfall7dCm: 0,
    snowDepthCm: 0,
    windKph: 0,
    fetchedAt: '2026-09-09T00:00:00Z',
  },
};

test('plain directory browsing does not call weather', async () => {
  let calls = 0;
  const data = await loadResortDirectory(
    new Request('https://shop.test/resorts?area=Japan'),
    undefined,
    async () => {
      calls++;
      return weather;
    },
  );
  expect(data.resorts.map((item) => item.slug)).toEqual(['niseko-united']);
  expect(calls).toBe(0);
});

test('snow search excludes unavailable and stale results', async () => {
  const data = await loadResortDirectory(
    new Request('https://shop.test/resorts?q=Whistler&snow=new-snow'),
    undefined,
    async () => ({status: 'stale', summary: weather.summary}),
  );
  expect(data.unavailable).toBe(1);
  expect(data.resorts).toEqual([]);
  expect(matchesSnowFilter(weather, 'freezing')).toBe(true);
  expect(matchesSnowFilter(weather, 'new-snow')).toBe(false);
  expect(matchesSnowFilter(weather, 'snow-depth')).toBe(false);
});

test('metadata preserves locale and strips query parameters', () => {
  const meta = resortSeo(
    resorts[0],
    'https://shop.test/fr-ca/resorts/whistler-blackcomb?test=1',
  );
  expect(meta.find((entry) => 'href' in entry)?.href).toBe(
    'https://shop.test/fr-ca/resorts/whistler-blackcomb',
  );
  expect(JSON.stringify(meta)).toContain('https://shop.test/fr-ca/resorts');
  expect(JSON.stringify(meta)).not.toContain('test=1');
});

test('registry has unique routes and every requested world region', () => {
  expect(new Set(resorts.map((item) => item.slug)).size).toBe(resorts.length);
  expect(new Set(resorts.map((item) => item.area)).size).toBe(5);
  for (const resort of resorts) {
    expect(Math.abs(resort.latitude)).toBeLessThanOrEqual(90);
    expect(Math.abs(resort.longitude)).toBeLessThanOrEqual(180);
    expect(new URL(resort.webcamUrl).protocol).toBe('https:');
  }
});
