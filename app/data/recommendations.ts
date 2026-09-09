import type {SnowfallSummary} from '~/data/weather';

export type GearRecommendation = {
  title: string;
  reason: string;
  collectionHandle: string;
};

export function getGearRecommendations(
  summary: SnowfallSummary,
): GearRecommendation[] {
  const recommendations: GearRecommendation[] = [];

  if (summary.snowfall24hCm >= 5) {
    recommendations.push({
      title: 'Storm-day layers',
      reason: 'Fresh snow calls for a waterproof shell and warm mid-layer.',
      collectionHandle: 'outerwear',
    });
  }

  if (summary.windKph >= 25) {
    recommendations.push({
      title: 'Wind protection',
      reason: 'Strong wind makes face coverage and insulated gloves useful.',
      collectionHandle: 'accessories',
    });
  }

  if (summary.temperatureC <= -8) {
    recommendations.push({
      title: 'Cold-weather essentials',
      reason: 'Sub-zero temperatures call for a warmer base layer system.',
      collectionHandle: 'base-layers',
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: 'Everyday mountain kit',
      reason: 'Build a flexible setup for changing conditions on the hill.',
      collectionHandle: 'ski-essentials',
    });
  }

  return recommendations.slice(0, 3);
}
