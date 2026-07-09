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
  // React Native's built-in URLSearchParams polyfill only implements
  // append()/toString() on RN <= 0.79 - set() throws. append() is equivalent
  // here since each key is added once on a fresh instance.
  const params = new URLSearchParams();
  if (bundleId) params.append('bundleId', bundleId);
  if (country) params.append('country', country);

  const response = await fetch(`${ITUNES_LOOKUP_URL}?${params.toString()}`, {
    headers: { 'Cache-Control': 'no-cache' },
  });

  if (!response.ok) {
    throw new Error(`iTunes lookup failed with status ${response.status}`);
  }

  const json = await response.json();
  return json?.results?.[0];
};
