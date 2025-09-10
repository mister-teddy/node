import { atom, getDefaultStore } from "jotai";
import db, { subscribeDB } from "../libs/db";
import { atomFamily, atomWithRefresh, atomWithStorage } from "jotai/utils";
import { startViewTransition } from "../libs/ui";

// Jotai store for external updates
const store = getDefaultStore();
subscribeDB("appsChanged", () => {
  startViewTransition(() => {
    store.set(appsAtom);
  });
});

export const appsAtom = atomWithRefresh(async () => {
  try {
    const apps = await db.getAllApps();
    return apps;
  } catch (error) {
    console.warn("Handled error: ", error);
    return [];
  }
});

export const installedAppsAtom = atom(async (get) => {
  const apps = await get(appsAtom);
  return apps.filter((app) => app.installed);
});

export const storeAppsAtom = atom(async (get) => {
  const apps = await get(appsAtom);
  return apps.filter((app) => !app.installed);
});

export const appByIdAtom = atomFamily((id: string) =>
  atom(async () => {
    try {
      const result = await db.getAppById(id);
      return result;
    } catch (error) {
      console.error(`Failed to get app ${id}:`, error);
      return undefined;
    }
  })
);

export const promptState = atomWithStorage("prompt", "");
export const generatedCodeState = atomWithStorage("generatedCode", "");
