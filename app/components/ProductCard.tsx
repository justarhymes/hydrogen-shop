import clsx from 'clsx';
import {flattenConnection, Image, Money} from '@shopify/hydrogen';
import type {MoneyV2, Product} from '@shopify/hydrogen/storefront-api-types';

import type {ProductCardFragment} from 'storefrontapi.generated';
import {Text} from '~/components/Text';
import {Link} from '~/components/Link';
import {Button} from '~/components/Button';
import {AddToCartButton} from '~/components/AddToCartButton';
import {isDiscounted, isNewArrival} from '~/lib/utils';
import {getProductPlaceholder} from '~/lib/placeholders';

export function ProductCard({
  product,
  label,
  className,
  loading,
  onClick,
  quickAdd,
}: {
  product: ProductCardFragment;
  label?: string;
  className?: string;
  loading?: HTMLImageElement['loading'];
  onClick?: () => void;
  quickAdd?: boolean;
}) {
  let cardLabel;

  const cardProduct: Product = product?.variants
    ? (product as Product)
    : getProductPlaceholder();
  if (!cardProduct?.variants?.nodes?.length) return null;

  const firstVariant = flattenConnection(cardProduct.variants)[0];

  if (!firstVariant) return null;
  const {image, price, compareAtPrice} = firstVariant;

  const discounted = isDiscounted(price as MoneyV2, compareAtPrice as MoneyV2);
  const alternateImage = product?.images?.nodes.find(
    (candidate) => candidate.url !== image?.url,
  );

  if (label?.trim()) {
    cardLabel = label.trim();
  } else if (isDiscounted(price as MoneyV2, compareAtPrice as MoneyV2)) {
    cardLabel = 'Sale';
  } else if (isNewArrival(product.publishedAt)) {
    cardLabel = 'New';
  }

  return (
    <div className="product-card flex min-w-0 flex-col gap-2">
      <Link
        onClick={onClick}
        to={`/products/${product.handle}`}
        prefetch="viewport"
      >
        <div className={clsx('product-card-content', className)}>
          <div className="product-card-image aspect-[4/5]">
            {image && (
              <Image
                className="product-card-primary"
                sizes="(min-width: 64em) 25vw, (min-width: 48em) 30vw, 45vw"
                aspectRatio="4/5"
                data={image}
                alt={image.altText || `Picture of ${product.title}`}
                loading={loading}
              />
            )}
            {image && alternateImage && (
              <Image
                className="product-card-alternate"
                sizes="(min-width: 64em) 25vw, (min-width: 48em) 30vw, 45vw"
                aspectRatio="4/5"
                data={alternateImage}
                alt=""
                aria-hidden="true"
                loading="lazy"
              />
            )}
            {cardLabel && (
              <span className="product-card-label">{cardLabel}</span>
            )}
          </div>
          <div className="product-card-details">
            <h3 className="product-card-title">{product.title}</h3>
            <div className="product-card-prices">
              <Money
                className={clsx(
                  'product-card-price',
                  discounted && 'text-secondary',
                )}
                withoutTrailingZeros
                data={price!}
              />
              {discounted && (
                <s className="product-card-compare text-info">
                  <span className="sr-only">Original price: </span>
                  <Money withoutTrailingZeros data={compareAtPrice!} />
                </s>
              )}
            </div>
          </div>
        </div>
      </Link>
      {quickAdd && firstVariant.availableForSale && (
        <AddToCartButton
          lines={[
            {
              quantity: 1,
              merchandiseId: firstVariant.id,
            },
          ]}
          variant="secondary"
          className="mt-2"
        >
          <Text as="span" className="flex items-center justify-center gap-2">
            Add to Cart
          </Text>
        </AddToCartButton>
      )}
      {quickAdd && !firstVariant.availableForSale && (
        <Button variant="secondary" className="mt-2" disabled>
          <Text as="span" className="flex items-center justify-center gap-2">
            Sold out
          </Text>
        </Button>
      )}
    </div>
  );
}
