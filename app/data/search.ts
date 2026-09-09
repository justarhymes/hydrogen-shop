import {mountainEvents} from '~/data/events';

export function searchEvents(query: string) {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return mountainEvents.filter((event) =>
    terms.every((term) =>
      `${event.title} ${event.location} ${event.category} ${event.date}`
        .toLowerCase()
        .includes(term),
    ),
  );
}

export type SearchSuggestions = {
  query: string;
  products: Array<{id: string; title: string; handle: string}>;
  unavailable: boolean;
};
