import {json, type LoaderFunctionArgs} from '@shopify/remix-oxygen';

export async function loader({request, context}: LoaderFunctionArgs) {
  const query = (new URL(request.url).searchParams.get('q') ?? '')
    .trim()
    .slice(0, 200);
  if (query.length < 2) return json({query, products: [], unavailable: false});
  try {
    const data = await context.storefront.query(PREDICTIVE_SEARCH_QUERY, {
      variables: {query},
    });
    return json({
      query,
      products: data.predictiveSearch?.products ?? [],
      unavailable: false,
    });
  } catch {
    return json({query, products: [], unavailable: true});
  }
}

const PREDICTIVE_SEARCH_QUERY = `#graphql
  query ShopPredictiveSearch($query: String!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    predictiveSearch(query: $query, types: [PRODUCT], limit: 5) {
      products { id title handle }
    }
  }
` as const;
