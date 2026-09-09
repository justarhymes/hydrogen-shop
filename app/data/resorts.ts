export type Resort = {
  slug: string;
  name: string;
  region: string;
  area:
    | 'North America'
    | 'Europe'
    | 'Japan'
    | 'Australia/New Zealand'
    | 'South America';
  conditionsUrl: string;
  latitude: number;
  longitude: number;
  elevationM: number;
  officialUrl: string;
  avalancheUrl: string | null;
  webcamUrl: string;
};

export const resorts: Resort[] = [
  {
    slug: 'whistler-blackcomb',
    name: 'Whistler Blackcomb',
    region: 'British Columbia, Canada',
    area: 'North America',
    conditionsUrl:
      'https://www.whistlerblackcomb.com/the-mountain/mountain-conditions/terrain-and-lift-status.aspx',
    latitude: 50.1163,
    longitude: -122.9574,
    elevationM: 2181,
    officialUrl: 'https://www.whistlerblackcomb.com/',
    avalancheUrl: 'https://avalanche.ca/',
    webcamUrl:
      'https://www.whistlerblackcomb.com/the-mountain/mountain-conditions/mountain-cams.aspx',
  },
  {
    slug: 'park-city',
    name: 'Park City Mountain',
    region: 'Utah, United States',
    area: 'North America',
    conditionsUrl:
      'https://www.parkcitymountain.com/the-mountain/mountain-conditions/terrain-and-lift-status.aspx',
    latitude: 40.6514,
    longitude: -111.508,
    elevationM: 3056,
    officialUrl: 'https://www.parkcitymountain.com/',
    avalancheUrl: 'https://utahavalanchecenter.org/',
    webcamUrl:
      'https://www.parkcitymountain.com/the-mountain/mountain-conditions/mountain-cams.aspx',
  },
  {
    slug: 'chamonix',
    name: 'Chamonix-Mont-Blanc',
    region: 'Auvergne-Rhone-Alpes, France',
    area: 'Europe',
    conditionsUrl: 'https://www.chamonix.com/',
    latitude: 45.9237,
    longitude: 6.8694,
    elevationM: 3275,
    officialUrl: 'https://www.chamonix.com/',
    avalancheUrl:
      'https://www.chamonix.com/bulletin-avalanche/BRA_MONT-BLANC.pdf',
    webcamUrl: 'https://www.chamonix.com/webcams',
  },
  {
    slug: 'niseko-united',
    name: 'Niseko United',
    region: 'Hokkaido, Japan',
    area: 'Japan',
    latitude: 42.864,
    longitude: 140.704,
    elevationM: 1308,
    officialUrl: 'https://www.niseko.ne.jp/en/',
    conditionsUrl: 'https://www.niseko.ne.jp/en/niseko-lift-status/',
    avalancheUrl: 'https://www.niseko.ne.jp/en/niseko-avalanche-report/',
    webcamUrl: 'https://www.niseko.ne.jp/en/livecamera/',
  },
  {
    slug: 'thredbo',
    name: 'Thredbo',
    region: 'New South Wales, Australia',
    area: 'Australia/New Zealand',
    latitude: -36.505,
    longitude: 148.304,
    elevationM: 2037,
    officialUrl: 'https://www.thredbo.com.au/',
    conditionsUrl: 'https://www.thredbo.com.au/weather/',
    avalancheUrl: null,
    webcamUrl: 'https://www.thredbo.com.au/weather/snow-cams/',
  },
  {
    slug: 'coronet-peak',
    name: 'Coronet Peak',
    region: 'Otago, New Zealand',
    area: 'Australia/New Zealand',
    latitude: -44.927,
    longitude: 168.736,
    elevationM: 1649,
    officialUrl: 'https://www.coronetpeak.co.nz/',
    conditionsUrl: 'https://www.coronetpeak.co.nz/weather-report',
    avalancheUrl: 'https://www.avalanche.net.nz/region/queenstown',
    webcamUrl: 'https://www.coronetpeak.co.nz/weather-report',
  },
  {
    slug: 'portillo',
    name: 'Portillo',
    region: 'Valparaiso, Chile',
    area: 'South America',
    latitude: -32.836,
    longitude: -70.129,
    elevationM: 3310,
    officialUrl: 'https://skiportillo.com/en/',
    conditionsUrl:
      'https://skiportillo.com/en/our-mountain/portillo-snow-forecast-conditions/',
    avalancheUrl: null,
    webcamUrl:
      'https://skiportillo.com/en/our-mountain/portillo-snow-forecast-conditions/',
  },
];

export function getResort(slug: string) {
  return resorts.find((resort) => resort.slug === slug);
}

/** Shared directory search; URLs can preserve both filters across navigation. */
export function filterResorts(
  directory: Resort[],
  {
    query = '',
    region = '',
    area = '',
  }: {query?: string; region?: string; area?: string},
) {
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  return directory.filter((resort) => {
    const searchable = normalize(
      `${resort.name} ${resort.region} ${resort.area}`,
    );
    return (
      (!region || resort.region === region) &&
      (!area || resort.area === area) &&
      terms.every((term) => searchable.includes(term))
    );
  });
}
