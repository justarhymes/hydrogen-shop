import {useEffect, useRef} from 'react';
import {useAnalytics} from '@shopify/hydrogen';

export function ResortAnalytics({slug}: {slug: string}) {
  const {publish, canTrack} = useAnalytics();
  const lastPublished = useRef<string>();
  useEffect(() => {
    if (canTrack() && lastPublished.current !== slug) {
      publish('custom_resort_view', {resortSlug: slug});
      lastPublished.current = slug;
    }
  }, [slug, publish, canTrack]);
  return null;
}
