import {test, expect} from '@playwright/test';

import {filterResorts, resorts} from '../../app/data/resorts';

test('empty search preserves all resorts and their ordering', () => {
  expect(filterResorts(resorts, {})).toEqual(resorts);
  expect(filterResorts(resorts, {query: '   '})).toEqual(resorts);
});

test('search matches names and locations without case or accent sensitivity', () => {
  expect(
    filterResorts(resorts, {query: 'WHISTLER canada'}).map(
      (resort) => resort.slug,
    ),
  ).toEqual(['whistler-blackcomb']);
  expect(
    filterResorts(resorts, {query: 'Rhône'}).map((resort) => resort.slug),
  ).toEqual(['chamonix']);
});

test('search and region filters intersect', () => {
  expect(
    filterResorts(resorts, {
      query: 'mountain',
      region: 'Utah, United States',
    }).map((resort) => resort.slug),
  ).toEqual(['park-city']);
  expect(
    filterResorts(resorts, {query: 'Canada', region: 'Utah, United States'}),
  ).toEqual([]);
});

test('unknown regions and unmatched searches produce empty results', () => {
  expect(filterResorts(resorts, {region: 'unknown'})).toEqual([]);
  expect(filterResorts(resorts, {query: 'not a resort'})).toEqual([]);
});
