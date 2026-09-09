import {test, expect} from '@playwright/test';

import {
  parseAvalancheForecast,
  getAvalancheForecast,
} from '../../app/data/avalanche';
import {resorts} from '../../app/data/resorts';

const resort = resorts[1];
const now = Date.parse('2026-01-10T17:00:00Z');
function payload() {
  return {
    features: [
      {
        properties: {
          name: 'Salt Lake',
          center: 'Utah Avalanche Center',
          center_id: 'UAC',
          link: 'https://utahavalanchecenter.org/forecast/salt-lake',
          danger_level: 3,
          start_date: '2026-01-10T08:00:00',
          end_date: '2026-01-11T06:00:00',
          timezone: 'America/Denver',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-112, 40],
              [-111, 40],
              [-111, 41],
              [-112, 41],
              [-112, 40],
            ],
          ],
        },
      },
    ],
  };
}

test('uses official region and converts local issue and expiry times', () => {
  expect(parseAvalancheForecast(payload(), resort, now)).toMatchObject({
    region: 'Salt Lake',
    danger: 'Considerable',
    issuedAt: '2026-01-10T15:00:00.000Z',
    expiresAt: '2026-01-11T13:00:00.000Z',
  });
});

test('expired, future, missing and no-rating bulletins never display a rating', () => {
  expect(
    parseAvalancheForecast(
      payload(),
      resort,
      Date.parse('2026-01-11T13:00:00Z'),
    ),
  ).toBeNull();
  expect(
    parseAvalancheForecast(
      payload(),
      resort,
      Date.parse('2026-01-09T13:00:00Z'),
    ),
  ).toBeNull();
  const data = payload();
  data.features[0].properties.danger_level = -1;
  expect(parseAvalancheForecast(data, resort, now)).toBeNull();
  expect(parseAvalancheForecast({}, resort, now)).toBeNull();
});

test('does not guess a zone for uncovered or overlapping coordinates', () => {
  expect(parseAvalancheForecast(payload(), resorts[0], now)).toBeNull();
  const data = payload();
  data.features.push(data.features[0]);
  expect(parseAvalancheForecast(data, resort, now)).toBeNull();
});

test('rejects offsite forecast URLs and malformed dates', () => {
  const data = payload();
  data.features[0].properties.link = 'https://example.com';
  expect(parseAvalancheForecast(data, resort, now)).toBeNull();
  data.features[0].properties.link =
    'https://utahavalanchecenter.org/forecast/salt-lake';
  data.features[0].properties.end_date = 'not a date';
  expect(parseAvalancheForecast(data, resort, now)).toBeNull();
});

test('provider failures return no rating, and unsupported resorts skip the API', async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => {
    calls++;
    throw new Error('offline');
  };
  expect(await getAvalancheForecast(resorts[0], fetcher)).toBeNull();
  expect(calls).toBe(0);
  expect(await getAvalancheForecast(resort, fetcher)).toBeNull();
  expect(calls).toBe(1);
});
