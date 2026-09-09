import {json, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';

import {EventList} from '~/components/EventList';
import {PageHeader, Section, Text} from '~/components/Text';
import {mountainEvents} from '~/data/events';
import {routeHeaders} from '~/data/cache';

export const headers = routeHeaders;

export async function loader({request}: LoaderFunctionArgs) {
  return json({events: mountainEvents, url: request.url});
}

export const meta = () => [
  {title: 'Mountain Events | Hydrogen Demo Store'},
  {
    name: 'description',
    content: 'Ski and snowboard events, festivals, and demo days.',
  },
];

export default function Events() {
  const {events} = useLoaderData<typeof loader>();

  return (
    <>
      <PageHeader heading="Mountain events" />
      <Section className="grid gap-6">
        <Text width="narrow">
          A starting events directory with official links. The data adapter is
          intentionally separate from the list so it can later consume a
          permitted resort or events feed.
        </Text>
        <EventList events={events} />
      </Section>
    </>
  );
}
