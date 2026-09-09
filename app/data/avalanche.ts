import type {Resort} from '~/data/resorts';

export type AvalancheForecast = {
  region: string;
  center: string;
  sourceUrl: string;
  danger: string;
  issuedAt: string;
  expiresAt: string;
};

// This adapter uses the documented Avalanche.org US map layer. It does not
// infer danger from weather and never falls back to an expired danger rating.
function inRing(point: number[], ring: number[][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (
      yi > point[1] !== yj > point[1] &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi
    )
      inside = !inside;
  }
  return inside;
}

function inPolygon(point: number[], polygon: number[][][]) {
  return (
    polygon.length > 0 &&
    inRing(point, polygon[0]) &&
    !polygon.slice(1).some((ring) => inRing(point, ring))
  );
}

// The API permits local ISO dates without an offset; interpret those in its
// declared IANA timezone, never in the server's timezone.
function forecastDate(value: unknown, timezone: string): number {
  if (typeof value !== 'string') return NaN;
  if (/(Z|[+-]\d{2}:\d{2})$/.test(value)) return Date.parse(value);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) return NaN;
  const wall = Date.parse(`${value}Z`);
  let estimate = wall;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'longOffset',
  });
  for (let i = 0; i < 3; i++) {
    const offset =
      formatter
        .formatToParts(new Date(estimate))
        .find((part) => part.type === 'timeZoneName')?.value ?? '';
    const match = /^GMT([+-])(\d{2}):(\d{2})$/.exec(offset);
    if (!match && offset !== 'GMT') return NaN;
    const minutes = match
      ? (Number(match[2]) * 60 + Number(match[3])) * (match[1] === '+' ? 1 : -1)
      : 0;
    estimate = wall - minutes * 60000;
  }
  return estimate;
}

type Feature = {
  properties: {
    name: string;
    center: string;
    center_id: string;
    link: string;
    danger_level: number;
    start_date: string | null;
    end_date: string | null;
    timezone: string;
  };
  geometry: {type: string; coordinates: number[][][] | number[][][][]};
};

export function parseAvalancheForecast(
  data: unknown,
  resort: Resort,
  now = Date.now(),
): AvalancheForecast | null {
  try {
    const features = (data as {features: Feature[]}).features;
    const matches = features.filter(({geometry}) => {
      const point = [resort.longitude, resort.latitude];
      if (geometry.type === 'Polygon')
        return inPolygon(point, geometry.coordinates as number[][][]);
      if (geometry.type === 'MultiPolygon')
        return (geometry.coordinates as number[][][][]).some((polygon) =>
          inPolygon(point, polygon),
        );
      return false;
    });
    // Do not choose between overlapping forecasts or nearby uncovered zones.
    if (matches.length !== 1) return null;
    const p = matches[0].properties;
    if (
      p.center_id !== 'UAC' ||
      typeof p.name !== 'string' ||
      typeof p.center !== 'string'
    )
      return null;
    const issued = forecastDate(p.start_date, p.timezone);
    const expires = forecastDate(p.end_date, p.timezone);
    if (!(issued <= now && now < expires && expires - issued <= 48 * 3600000))
      return null;
    const ratings = ['', 'Low', 'Moderate', 'Considerable', 'High', 'Extreme'];
    if (
      !Number.isInteger(p.danger_level) ||
      p.danger_level < 1 ||
      p.danger_level > 5
    )
      return null;
    const link = new URL(p.link);
    if (
      link.protocol !== 'https:' ||
      link.hostname !== 'utahavalanchecenter.org'
    )
      return null;
    return {
      region: p.name,
      center: p.center,
      sourceUrl: link.href,
      danger: ratings[p.danger_level],
      issuedAt: new Date(issued).toISOString(),
      expiresAt: new Date(expires).toISOString(),
    };
  } catch {
    return null;
  }
}

export async function getAvalancheForecast(
  resort: Resort,
  fetcher: typeof fetch = fetch,
): Promise<AvalancheForecast | null> {
  if (resort.slug !== 'park-city') return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetcher(
      'https://api.avalanche.org/v2/public/products/map-layer/UAC',
      {signal: controller.signal},
    );
    if (!response.ok) return null;
    return parseAvalancheForecast(await response.json(), resort);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
