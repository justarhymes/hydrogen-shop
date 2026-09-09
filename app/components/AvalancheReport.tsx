import {useEffect, useState} from 'react';

import type {AvalancheForecast} from '~/data/avalanche';

export function AvalancheReport({
  forecast,
}: {
  forecast: AvalancheForecast | null;
}) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!forecast) return;
    const timeout = setTimeout(
      () => setNow(Date.now()),
      Math.max(0, Date.parse(forecast.expiresAt) - Date.now()) + 1,
    );
    return () => clearTimeout(timeout);
  }, [forecast]);
  if (!forecast || now >= Date.parse(forecast.expiresAt)) {
    return (
      <p>
        No current avalanche rating is available here. Use the official
        avalanche link for the full regional bulletin.
      </p>
    );
  }
  return (
    <section
      className="grid gap-3 border border-primary/10 p-5"
      aria-label="Regional avalanche forecast"
    >
      <h2 className="text-lead font-medium">
        {forecast.region}: {forecast.danger}
      </h2>
      <p>
        Regional backcountry forecast from {forecast.center}, via Avalanche.org.
        This is not a rating of open resort pistes.
      </p>
      <p className="text-fine">
        Issued{' '}
        <time dateTime={forecast.issuedAt}>
          {forecast.issuedAt.replace('T', ' ').replace('.000Z', ' UTC')}
        </time>
        . Expires{' '}
        <time dateTime={forecast.expiresAt}>
          {forecast.expiresAt.replace('T', ' ').replace('.000Z', ' UTC')}
        </time>
        .
      </p>
      <a
        href={forecast.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="underline"
      >
        Read the full official forecast ↗
      </a>
    </section>
  );
}
