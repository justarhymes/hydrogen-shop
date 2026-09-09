import {useAnalytics} from '@shopify/hydrogen';

import {Link} from '~/components/Link';
import type {GearRecommendation} from '~/data/recommendations';

export function GearRecommendations({
  recommendations,
  resortSlug,
}: {
  recommendations: GearRecommendation[];
  resortSlug?: string;
}) {
  const {publish, canTrack} = useAnalytics();
  return (
    <section className="grid gap-4" aria-label="Gear recommendations">
      <div>
        <p className="text-fine uppercase tracking-[0.12em] opacity-60">
          Shop the conditions
        </p>
        <h2 className="text-heading font-medium">What to bring</h2>
      </div>
      <div className="grid gap-px border border-primary/10 bg-primary/10 md:grid-cols-3">
        {recommendations.map((recommendation) => (
          <Link
            key={recommendation.title}
            to="/products"
            onClick={() => {
              if (canTrack())
                publish('custom_recommendation_click', {
                  resortSlug,
                  collectionHandle: recommendation.collectionHandle,
                  title: recommendation.title,
                });
            }}
            className="grid gap-3 bg-contrast p-5 transition-colors hover:bg-primary hover:text-contrast"
          >
            <span className="text-lead font-medium">
              {recommendation.title}
            </span>
            <span className="text-sm opacity-70">{recommendation.reason}</span>
            <span className="text-fine underline">Explore gear</span>
          </Link>
        ))}
      </div>
      <p className="text-fine opacity-50">
        Shopping guidance only. Check official mountain and avalanche reports
        before riding.
      </p>
    </section>
  );
}
