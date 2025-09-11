import { getDefaultStore, atom } from "jotai";
import { atomWithStorage, atomWithRefresh } from "jotai/utils";

// Reusable utility for atoms that combine storage and fetching
export function atomWithStorageAndFetch<T>(
  storageKey: string,
  defaultValue: T,
  fetchFn: () => Promise<T>,
) {
  const store = getDefaultStore();

  // Storage atom for caching
  const storageAtom = atomWithStorage<T>(storageKey, defaultValue);

  // Refresh atom that fetches data and updates cache
  const refreshAtom = atomWithRefresh(async (get) => {
    try {
      const data = await fetchFn();
      // Update the cached data
      store.set(storageAtom, data);
      return data;
    } catch (error) {
      console.error(`Failed to fetch data for ${storageKey}:`, error);
      // Return cached data if fetch fails
      return get(storageAtom);
    }
  });

  // Main atom that returns cached data or triggers refresh if needed
  const mainAtom = atom(
    async (get) => {
      const cached = get(storageAtom);
      // Check if we need to refresh (customize this logic as needed)
      const shouldRefresh = Array.isArray(cached)
        ? cached.length === 0
        : !cached;

      if (shouldRefresh) {
        return await get(refreshAtom);
      }
      return cached;
    },
    (_get, set) => {
      // Trigger refresh when this atom is called as a setter
      set(refreshAtom);
    },
  );

  return {
    atom: mainAtom,
    storageAtom,
    refreshAtom,
  };
}
