import { atom, getDefaultStore } from "jotai";
import db, { subscribeDB } from "../libs/db";
import { atomFamily, atomWithRefresh, atomWithStorage } from "jotai/utils";
import { startViewTransition } from "../libs/ui";
import { fetchAvailableModels } from "../libs/anthropic";
import type { ModelInfo } from "../libs/models";
import { atomWithStorageAndFetch } from "@/libs/jotai";

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
  }),
);

export const promptState = atomWithStorage("prompt", "");
export const generatedCodeState = atomWithStorage("generatedCode", "");

// Models state management using the reusable utility
const modelsState = atomWithStorageAndFetch<ModelInfo[]>(
  "availableModels",
  [],
  fetchAvailableModels,
);

export const modelsAtom = modelsState.atom;
export const availableModelsAtom = modelsState.storageAtom;
export const modelsRefreshAtom = modelsState.refreshAtom;

// Selected model atom - defaults to first available model
export const selectedModelAtom = atomWithStorage<string>("selectedModel", "");

// Computed atom that returns the current selected model or first available
export const currentSelectedModelAtom = atom(
  (get) => {
    const selectedId = get(selectedModelAtom);
    return selectedId;
  },
  (_get, set, newModelId: string) => {
    set(selectedModelAtom, newModelId);
  },
);
