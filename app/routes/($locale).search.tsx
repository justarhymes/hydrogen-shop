import {
  defer,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {Await, useLoaderData} from '@remix-run/react';
import {Suspense} from 'react';
import {
  Pagination,
  getPaginationVariables,
  Analytics,
  getSeoMeta,
} from '@shopify/hydrogen';

import {Heading, PageHeader, Section, Text} from '~/components/Text';
import {SearchForm} from '~/components/SearchForm';
import {Link} from '~/components/Link';
import {EventList} from '~/components/EventList';
import {searchEvents} from '~/data/search';
import {Grid} from '~/components/Grid';
import {ProductCard} from '~/components/ProductCard';
import {ProductSwimlane} from '~/components/ProductSwimlane';
import {FeaturedCollections} from '~/components/FeaturedCollections';
import {PRODUCT_CARD_FRAGMENT} from '~/data/fragments';
import {getImageLoadingPriority, PAGINATION_SIZE} from '~/lib/const';
import {seoPayload} from '~/lib/seo.server';

import {
  getFeaturedData,
  type FeaturedData,
} from './($locale).featured-products';

export async function loader({
  request,
  context: {storefront},
}: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams;
  const searchTerm = (searchParams.get('q') ?? '').trim().slice(0, 200);
  const category = ['journal', 'events'].includes(
    searchParams.get('type') ?? '',
  )
    ? searchParams.get('type')!
    : 'products';
  let productError = false;
  const variables = getPaginationVariables(request, {pageBy: 8});

  const {products} =
    searchTerm && category === 'products'
      ? await storefront
          .query(SEARCH_QUERY, {
            variables: {
              searchTerm,
              ...variables,
              country: storefront.i18n.country,
              language: storefront.i18n.language,
            },
          })
          .catch(() => {
            productError = true;
            return {products: emptyProducts};
          })
      : {products: emptyProducts};
  const journal =
    category === 'journal' && searchTerm
      ? storefront
          .query(JOURNAL_SEARCH_QUERY, {
            variables: {query: searchTerm, cursor: searchParams.get('cursor')},
          })
          .catch(() => null)
      : Promise.resolve(null);

  const shouldGetRecommendations = !searchTerm || products?.nodes?.length === 0;

  const seo = seoPayload.collection({
    url: request.url,
    collection: {
      id: 'search',
      title: 'Search',
      handle: 'search',
      descriptionHtml: 'Search results',
      description: 'Search results',
      seo: {
        title: 'Search',
        description: `Search ${category} for "${searchTerm}"`,
      },
      metafields: [],
      products,
      updatedAt: new Date().toISOString(),
    },
  });

  return defer({
    seo,
    category,
    journal,
    events: category === 'events' ? searchEvents(searchTerm) : [],
    productError,
    searchTerm,
    products,
    noResultRecommendations:
      category === 'products' && shouldGetRecommendations
        ? getNoResultRecommendations(storefront)
        : Promise.resolve(null),
  });
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export default function Search() {
  const {
    searchTerm,
    products,
    noResultRecommendations,
    category,
    journal,
    events,
    productError,
  } = useLoaderData<typeof loader>();
  const noResults = products?.nodes?.length === 0;

  return (
    <>
      <PageHeader>
        <Heading as="h1" size="copy">
          Search
        </Heading>
        <SearchForm
          key={`${searchTerm}:${category}`}
          initialQuery={searchTerm}
          category={category}
        />
        <nav aria-label="Search categories" className="mt-4 flex gap-2 text-sm">
          {['products', 'journal', 'events'].map((type) => (
            <Link
              key={type}
              to={`/search?q=${encodeURIComponent(searchTerm)}&type=${type}`}
              aria-current={category === type ? 'page' : undefined}
              className={`rounded px-4 py-2 capitalize ${
                category === type
                  ? 'bg-secondary text-primary'
                  : 'border border-primary/20'
              }`}
            >
              {type}
            </Link>
          ))}
        </nav>
      </PageHeader>
      {category === 'journal' ? (
        <Section>
          {!searchTerm ? (
            <p>Enter a term to search the journal.</p>
          ) : (
            <Suspense fallback={<p role="status">Searching journal…</p>}>
              <Await resolve={journal}>
                {(data) => {
                  const articles = data?.search.nodes.filter(
                    (node) =>
                      node.__typename === 'Article' &&
                      node.blog.handle.toLowerCase() === 'journal',
                  );
                  return !data ? (
                    <p>Journal search is temporarily unavailable.</p>
                  ) : (
                    <>
                      {articles?.length ? (
                        <ul className="grid gap-4 md:grid-cols-2">
                          {articles.map(
                            (article) =>
                              article.__typename === 'Article' && (
                                <li
                                  key={article.id}
                                  className="rounded border border-primary/10 p-5"
                                >
                                  <Link
                                    to={`/journal/${article.handle}`}
                                    className="text-lead font-medium underline"
                                  >
                                    {article.title}
                                  </Link>
                                </li>
                              ),
                          )}
                        </ul>
                      ) : (
                        <p>No journal articles match on this page.</p>
                      )}
                      {data.search.pageInfo.hasNextPage && (
                        <Link
                          className="mt-6 inline-block rounded bg-secondary px-4 py-2"
                          to={`/search?type=journal&q=${encodeURIComponent(
                            searchTerm,
                          )}&cursor=${encodeURIComponent(
                            data.search.pageInfo.endCursor ?? '',
                          )}`}
                        >
                          More journal results
                        </Link>
                      )}
                    </>
                  );
                }}
              </Await>
            </Suspense>
          )}
        </Section>
      ) : category === 'events' ? (
        <Section>
          <p className="mb-4 text-sm">
            Sample events — confirm details with the official source.
          </p>
          {events.length ? (
            <EventList events={events} />
          ) : (
            <p>
              {searchTerm
                ? 'No events match your search.'
                : 'Search events by name, location, category or date.'}
            </p>
          )}
        </Section>
      ) : productError ? (
        <Section>
          <p>Product search is temporarily unavailable. Please try again.</p>
        </Section>
      ) : !searchTerm || noResults ? (
        <NoResults
          noResults={Boolean(searchTerm) && noResults}
          recommendations={noResultRecommendations}
        />
      ) : (
        <Section>
          <Pagination connection={products}>
            {({nodes, isLoading, NextLink, PreviousLink}) => {
              const itemsMarkup = nodes.map(
                (product, i) =>
                  product && (
                    <ProductCard
                      key={product.id}
                      product={product}
                      loading={getImageLoadingPriority(i)}
                    />
                  ),
              );

              return (
                <>
                  <div className="flex items-center justify-center mt-6">
                    <PreviousLink className="inline-block rounded font-medium text-center py-3 px-6 border border-primary/10 bg-contrast text-primary w-full">
                      {isLoading ? 'Loading...' : 'Previous'}
                    </PreviousLink>
                  </div>
                  <Grid data-test="product-grid">{itemsMarkup}</Grid>
                  <div className="flex items-center justify-center mt-6">
                    <NextLink className="inline-block rounded font-medium text-center py-3 px-6 border border-primary/10 bg-contrast text-primary w-full">
                      {isLoading ? 'Loading...' : 'Next'}
                    </NextLink>
                  </div>
                </>
              );
            }}
          </Pagination>
        </Section>
      )}
      {category === 'products' && (
        <Analytics.SearchView data={{searchTerm, searchResults: products}} />
      )}
    </>
  );
}

function NoResults({
  noResults,
  recommendations,
}: {
  noResults: boolean;
  recommendations: Promise<null | FeaturedData>;
}) {
  return (
    <>
      {noResults && (
        <Section padding="x">
          <Text className="opacity-50">
            No results, try a different search.
          </Text>
        </Section>
      )}
      <Suspense>
        <Await
          errorElement="There was a problem loading related products"
          resolve={recommendations}
        >
          {(result) => {
            if (!result) return null;
            const {featuredCollections, featuredProducts} = result;

            return (
              <>
                <FeaturedCollections
                  title="Trending Collections"
                  collections={featuredCollections}
                />
                <ProductSwimlane
                  title="Trending Products"
                  products={featuredProducts}
                />
              </>
            );
          }}
        </Await>
      </Suspense>
    </>
  );
}

export function getNoResultRecommendations(
  storefront: LoaderFunctionArgs['context']['storefront'],
) {
  return getFeaturedData(storefront, {pageBy: PAGINATION_SIZE});
}

const SEARCH_QUERY = `#graphql
  query PaginatedProductsSearch(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $searchTerm: String
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    products(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor,
      sortKey: RELEVANCE,
      query: $searchTerm
    ) {
      nodes {
        ...ProductCard
      }
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
    }
  }

  ${PRODUCT_CARD_FRAGMENT}
` as const;

const emptyProducts = {
  nodes: [],
  pageInfo: {
    startCursor: null,
    endCursor: null,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

const JOURNAL_SEARCH_QUERY = `#graphql
  query ShopJournalSearch($query: String!, $cursor: String, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    search(query: $query, types: [ARTICLE], first: 20, after: $cursor) {
      nodes { __typename ... on Article { id title handle blog { handle } } }
      pageInfo { hasNextPage endCursor }
    }
  }
` as const;
