import { atom, getDefaultStore } from "jotai";
import db, { subscribeDB } from "../libs/db";
import { atomFamily, atomWithRefresh, atomWithStorage } from "jotai/utils";
import { startViewTransition } from "../libs/ui";
import { fetchAvailableModels } from "../libs/anthropic";
import type { ModelInfo } from "../libs/models";
import { atomWithStorageAndFetch } from "@/libs/jotai";
import CONFIG from "@/config";
import type { AppProject } from "@/types/app-project";

// Server API types
interface ServerResponse<T> {
  data: T;
  meta?: {
    count: number;
    limit: number;
    offset: number;
  };
  links: {
    self: string;
    collections?: string;
  };
}

interface ProjectData {
  id: string;
  name: string;
  description: string;
  prompt: string;
  source_code?: string;
  model?: string;
  icon: string;
  version: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

interface ServerProject {
  id: string; // Database document ID
  collection: string;
  data: ProjectData;
  created_at: string;
  updated_at: string;
}

type ProjectsResponse = ServerResponse<ServerProject[]>;

// Mapping function to convert ServerProject to AppProject
function mapServerProjectToAppProject(serverProject: ServerProject): AppProject {
  const { data } = serverProject;
  
  // Safe date parsing with fallback
  const parseDate = (dateString: string): Date => {
    if (!dateString) return new Date();
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };
  
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    icon: data.icon,
    price: 0, // Default price, could be added to server schema later
    version: data.version,
    sourceCode: data.source_code || "",
    createdAt: parseDate(data.created_at),
    updatedAt: parseDate(data.updated_at),
    status: data.status,
    model: data.model,
    originalPrompt: data.prompt,
    currentVersion: 1, // Default to version 1
    versions: [], // Empty versions array for now
  };
}

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

// Server-side projects data management
export const projectsAtom = atomWithRefresh(async (): Promise<AppProject[]> => {
  try {
    const response = await fetch(`${CONFIG.API.BASE_URL}/api/db/apps`);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.status}`);
    }
    const result: ProjectsResponse = await response.json();
    const serverProjects = result.data || [];
    return serverProjects.map(mapServerProjectToAppProject);
  } catch (error) {
    console.error("Failed to load projects from server:", error);
    return [];
  }
});

export const projectByIdAtom = atomFamily((projectId: string) =>
  atom(async (get): Promise<AppProject | null> => {
    const projects = await get(projectsAtom);
    return projects.find((project) => project.id === projectId) || null;
  }),
);

// Export types for use in components
export type { ServerProject, ProjectData, ProjectsResponse };
