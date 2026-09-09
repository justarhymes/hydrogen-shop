import {useEffect, useRef, useState} from 'react';
import {useRouteLoaderData} from '@remix-run/react';
import type {Map as LeafletMap} from 'leaflet';

import type {RootLoader} from '~/root';
import 'leaflet/dist/leaflet.css';
import {Link} from '~/components/Link';
import type {Resort} from '~/data/resorts';

type ResortMapProps = {
  resorts: Resort[];
  activeSlug?: string;
};

export function ResortMap({resorts, activeSlug}: ResortMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState(false);
  const rootData = useRouteLoaderData<RootLoader>('root');
  const pathPrefix = rootData?.selectedLocale?.pathPrefix ?? '';

  useEffect(() => {
    const container = mapRef.current;
    if (!container || !resorts.length) return;
    setMapError(false);
    let cancelled = false;
    let map: LeafletMap | undefined;

    import('leaflet')
      .then((L) => {
        if (cancelled) {
          return;
        }

        map = L.map(container, {
          scrollWheelZoom: false,
          zoomControl: true,
        }).fitBounds(
          resorts.map(
            (resort) => [resort.latitude, resort.longitude] as [number, number],
          ),
          {padding: [32, 32], maxZoom: 11},
        );

        const currentMap = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(currentMap);

        resorts.forEach((resort) => {
          const marker = L.circleMarker([resort.latitude, resort.longitude], {
            radius: activeSlug === resort.slug ? 9 : 7,
            color: '#ffffff',
            weight: 2,
            fillColor: activeSlug === resort.slug ? '#c85b3a' : '#263d39',
            fillOpacity: 1,
          }).addTo(currentMap);

          const popup = document.createElement('div');
          const title = document.createElement('strong');
          title.textContent = resort.name;
          const link = document.createElement('a');
          link.href = `${pathPrefix}/resorts/${resort.slug}`;
          link.textContent = 'View resort';
          popup.append(title, document.createElement('br'), link);
          marker.bindPopup(popup);
        });
      })
      .catch(() => {
        if (!cancelled) setMapError(true);
      });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [activeSlug, resorts, pathPrefix]);

  return (
    <section className="grid gap-6" aria-label="Resort directory map">
      {mapError && (
        <p role="status">
          The map is unavailable. You can still browse the resort links below.
        </p>
      )}
      <div
        role="region"
        aria-label="Interactive resort map"
        ref={mapRef}
        className="relative isolate z-0 h-80 overflow-hidden rounded border border-primary/10"
      />
      <div className="grid gap-3 md:grid-cols-3">
        {resorts.map((resort) => (
          <Link
            key={resort.slug}
            to={`/resorts/${resort.slug}`}
            className={`grid gap-1 border p-4 transition-colors hover:bg-primary hover:text-contrast ${
              activeSlug === resort.slug
                ? 'border-primary bg-primary text-contrast'
                : 'border-primary/10'
            }`}
          >
            <span className="text-lead font-medium">{resort.name}</span>
            <span className="text-fine opacity-70">{resort.region}</span>
            <span className="text-fine opacity-70">
              {resort.elevationM.toLocaleString()} m summit elevation
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
