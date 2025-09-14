import { atom, getDefaultStore } from "jotai";
import db, { subscribeDB } from "../libs/db";
import { atomFamily, atomWithRefresh, atomWithStorage } from "jotai/utils";
import { startViewTransition } from "../libs/ui";
import { fetchAvailableModels } from "../libs/anthropic";
import type { ModelInfo } from "../libs/models";
import { atomWithStorageAndFetch } from "@/libs/jotai";
import CONFIG from "@/config";
import type { AppProject, AppProjectVersion } from "@/types/app-project";
import type { ServerResponse, ServerProject, ServerVersion } from "@/types";

type ProjectsResponse = ServerResponse<ServerProject[]>;

// Helper function to convert ServerVersion to AppProjectVersion
function mapServerVersionToAppVersion(
  serverVersion: ServerVersion,
): AppProjectVersion {
  const { data } = serverVersion;

  const parseDate = (dateString: string): Date => {
    if (!dateString) return new Date();
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  return {
    id: data.id,
    versionNumber: data.version_number,
    prompt: data.prompt,
    sourceCode: data.source_code,
    model: data.model,
    createdAt: parseDate(data.created_at),
  };
}

// Mapping function to convert ServerProject to AppProject
function mapServerProjectToAppProject(
  serverProject: ServerProject,
): AppProject {
  const { data } = serverProject;

  // Safe date parsing with fallback
  const parseDate = (dateString: string): Date => {
    if (!dateString) return new Date();
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  // Map versions
  const versions = (data.versions || []).map(mapServerVersionToAppVersion);

  // Get current version data
  const currentVersionData = versions.find(
    (v) => v.versionNumber === data.current_version,
  );

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    icon: data.icon,
    price: 0, // Default price, could be added to server schema later
    createdAt: parseDate(data.created_at),
    updatedAt: parseDate(data.updated_at),
    status: data.status,
    model: currentVersionData?.model || data.initial_model,
    originalPrompt: currentVersionData?.prompt || data.initial_prompt || "",
    currentVersion: data.current_version,
    versions: versions,
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
    const response = await fetch(`${CONFIG.API.BASE_URL}/api/projects`);
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

export const projectByIdAtom = atomFamily((projectId?: string) =>
  atom(async (): Promise<AppProject | null> => {
    if (!projectId) return null;
    try {
      const response = await fetch(
        `${CONFIG.API.BASE_URL}/api/projects/${projectId}`,
      );
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch project: ${response.status}`);
      }
      const result: { data: ServerProject } = await response.json();
      return mapServerProjectToAppProject(result.data);
    } catch (error) {
      console.error(`Failed to load project ${projectId} from server:`, error);
      return null;
    }
  }),
);

// Project versions atoms - for version control functionality
export interface ProjectVersionData {
  id: string;
  project_id: string;
  version_number: number;
  prompt: string;
  source_code: string;
  model?: string;
  created_at: string;
}

export const projectVersionsAtom = atomFamily((projectId: string) =>
  atomWithRefresh(async (): Promise<ProjectVersionData[]> => {
    try {
      const response = await fetch(
        `${CONFIG.API.BASE_URL}/api/projects/${projectId}/versions`,
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch versions: ${response.status}`);
      }
      const result: { data: ProjectVersionData[] } = await response.json();
      return (result.data || []).sort(
        (a, b) => b.version_number - a.version_number,
      );
    } catch (error) {
      console.error(`Failed to load versions for project ${projectId}:`, error);
      return [];
    }
  }),
);

// Create version mutation atom
export const createVersionAtom = atom(
  null,
  async (
    _get,
    set,
    {
      projectId,
      versionData,
    }: {
      projectId: string;
      versionData: { prompt: string; source_code: string; model?: string };
    },
  ) => {
    try {
      const response = await fetch(
        `${CONFIG.API.BASE_URL}/api/projects/${projectId}/versions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(versionData),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to create version: ${response.status}`);
      }

      const result = await response.json();

      // Refresh the versions atom for this project
      const versionsAtom = projectVersionsAtom(projectId);
      set(versionsAtom);

      return result.data;
    } catch (error) {
      console.error("Failed to create version:", error);
      throw error;
    }
  },
);

// Convert to app mutation atom
export const convertToAppAtom = atom(
  null,
  async (
    _get,
    _set,
    {
      projectId,
      version,
      price = 0,
    }: {
      projectId: string;
      version: number;
      price?: number;
    },
  ) => {
    try {
      const response = await fetch(
        `${CONFIG.API.BASE_URL}/api/projects/${projectId}/convert`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ version, price }),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to convert to app: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Failed to convert to app:", error);
      throw error;
    }
  },
);

// Export types for use in components
export type { ProjectsResponse };
