import type {HomepageFeaturedProductsQuery} from 'storefrontapi.generated';
import {Section} from '~/components/Text';
import {ProductCard} from '~/components/ProductCard';

const mockProducts = {
  nodes: new Array(12).fill(''),
};

type ProductSwimlaneProps = HomepageFeaturedProductsQuery & {
  title?: string;
  count?: number;
};

export function ProductSwimlane({
  title = 'Featured Products',
  products = mockProducts,
  count = 12,
  ...props
}: ProductSwimlaneProps) {
  return (
    <Section heading={title} padding="y" {...props}>
      <div className="product-grid grid grid-cols-2 px-6 md:grid-cols-3 md:px-8 lg:grid-cols-4 lg:px-12">
        {products.nodes.slice(0, count).map((product) => (
          <ProductCard product={product} key={product.id} />
        ))}
      </div>
    </Section>
  );
}
