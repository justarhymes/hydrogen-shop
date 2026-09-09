export type MountainEvent = {
  id: string;
  title: string;
  date: string;
  location: string;
  category: 'Competition' | 'Festival' | 'Demo day';
  sourceUrl: string;
};

// Curated seed data until an events feed is selected and its reuse terms are confirmed.
export const mountainEvents: MountainEvent[] = [
  {
    id: 'whistler-winter-opening',
    title: 'Whistler winter opening weekend',
    date: '2026-11-21',
    location: 'Whistler Blackcomb, Canada',
    category: 'Festival',
    sourceUrl: 'https://www.whistlerblackcomb.com/',
  },
  {
    id: 'park-city-demo-day',
    title: 'Park City gear demo day',
    date: '2026-12-12',
    location: 'Park City Mountain, United States',
    category: 'Demo day',
    sourceUrl: 'https://www.parkcitymountain.com/',
  },
  {
    id: 'chamonix-freeride-week',
    title: 'Chamonix freeride week',
    date: '2027-02-08',
    location: 'Chamonix-Mont-Blanc, France',
    category: 'Competition',
    sourceUrl: 'https://www.chamonix.com/',
  },
];
