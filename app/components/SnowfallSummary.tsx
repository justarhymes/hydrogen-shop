import type {SnowfallSummary as SnowfallSummaryData} from '~/data/weather';

export function SnowfallSummary({
  summary,
  compact = false,
  stale = false,
}: {
  summary: SnowfallSummaryData;
  compact?: boolean;
  stale?: boolean;
}) {
  const metrics = [
    ['New snow', `${summary.snowfall24hCm.toFixed(1)} cm`, '24 hours'],
    ['7-day snow', `${summary.snowfall7dCm.toFixed(1)} cm`, 'forecast'],
    ['Snow depth', `${summary.snowDepthCm.toFixed(0)} cm`, 'modeled'],
    ['Wind', `${summary.windKph.toFixed(0)} km/h`, 'current'],
  ];

  return (
    <section className="grid gap-4" aria-label="Snowfall summary">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-fine uppercase tracking-[0.12em] opacity-60">
            Mountain conditions
          </p>
          <p className="text-lead font-medium">
            {summary.temperatureC.toFixed(0)}°C at the resort
          </p>
        </div>
        <span className="text-fine opacity-50">
          {compact ? 'Forecast snapshot' : 'Open-Meteo forecast'}
        </span>
      </div>
      {stale && (
        <p
          role="status"
          className="rounded border border-primary/20 p-3 text-sm"
        >
          The weather provider is unavailable. Showing the last saved forecast;
          conditions may have changed.
        </p>
      )}
      <p className="text-fine opacity-60">
        Last updated{' '}
        <time dateTime={summary.fetchedAt}>
          {new Date(summary.fetchedAt)
            .toISOString()
            .slice(0, 16)
            .replace('T', ' ')}{' '}
          UTC
        </time>
      </p>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded border border-primary/10 bg-primary/10 sm:grid-cols-4">
        {metrics.map(([label, value, note]) => (
          <div key={label} className="grid gap-1 bg-contrast p-4">
            <dt className="text-fine opacity-60">{label}</dt>
            <dd className="text-lead font-medium">{value}</dd>
            <span className="text-fine opacity-50">{note}</span>
          </div>
        ))}
      </dl>
    </section>
  );
}
