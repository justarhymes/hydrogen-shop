import type {Resort} from '~/data/resorts';

export function resortSeo(resort: Resort, requestUrl: string) {
  const url = new URL(requestUrl);
  url.search = '';
  const directoryUrl = new URL('./', url).href.replace(/\/$/, '');
  const description = `Weather, snowfall, webcams and official mountain reports for ${resort.name} in ${resort.region}.`;
  return [
    {title: `${resort.name} weather & resort guide | Hydrogen Demo Store`},
    {name: 'description', content: description},
    {tagName: 'link' as const, rel: 'canonical', href: url.href},
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'SkiResort',
        name: resort.name,
        description,
        url: url.href,
        sameAs: resort.officialUrl,
        geo: {
          '@type': 'GeoCoordinates',
          latitude: resort.latitude,
          longitude: resort.longitude,
        },
      },
    },
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Resorts',
            item: directoryUrl,
          },
          {'@type': 'ListItem', position: 2, name: resort.name, item: url.href},
        ],
      },
    },
  ];
}
