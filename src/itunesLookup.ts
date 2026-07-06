import type { IosITunesResponse } from './types';

const ITUNES_LOOKUP_URL = 'https://itunes.apple.com/lookup';

/**
 * Looks up an app's App Store listing via the iTunes Search API.
 * Returns the raw iTunes entry (or undefined if the app isn't found), matching
 * the same response shape react-native-siren already exposed via `other`.
 */
export const fetchItunesLookup = async (
  bundleId?: string,
  country?: string
): Promise<IosITunesResponse | undefined> => {
  const params = new URLSearchParams();
  if (bundleId) params.set('bundleId', bundleId);
  if (country) params.set('country', country);
  // busts aggressive CDN/proxy caching of the lookup response
  params.set('_', `${Date.now()}`);

  const response = await fetch(`${ITUNES_LOOKUP_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`iTunes lookup failed with status ${response.status}`);
  }

  const json = await response.json();
  return json?.results?.[0];
};
