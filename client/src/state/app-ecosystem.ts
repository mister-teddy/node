import { atom } from "jotai";
import { atomFamily, atomWithRefresh, atomWithStorage } from "jotai/utils";
import type { AppProject, AppProjectVersion } from "@/types/app-project";
import type { ServerProject, ServerVersion } from "@/types";
import type { components } from "@/libs/mini-server.schema";
import type { ModelInfo } from "@/types";
import { miniServer } from "@/libs/mini-server";

// Type aliases for commonly used schema types
type App = components["schemas"]["App"];
type AppListResponse = components["schemas"]["AppListResponse"];
type ModelInfoResponse = components["schemas"]["ModelInfoResponse"];
type CreateVersionRequest = components["schemas"]["CreateVersionRequest"];
type ConvertToAppRequest = components["schemas"]["ConvertToAppRequest"];

// Project types from the generated schema
type Project = components["schemas"]["Project"];
type ProjectResponse = components["schemas"]["ProjectResponse"];
type ProjectListResponse = components["schemas"]["ProjectListResponse"];
type ProjectVersion = components["schemas"]["ProjectVersion"];
type ProjectVersionResponse = components["schemas"]["ProjectVersionResponse"];
type ProjectVersionListResponse =
  components["schemas"]["ProjectVersionListResponse"];

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

export const appsAtom = atomWithRefresh(async (): Promise<App[]> => {
  try {
    const response = await miniServer.GET("/api/apps");
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      const appListResponse = response.data as AppListResponse;
      return appListResponse.data || [];
    }
    return [];
  } catch (error) {
    console.warn("Handled error: ", error);
    return [];
  }
});

export const installedAppsAtom = atom(async (get) => {
  const apps = await get(appsAtom);
  return apps;
});

export const appByIdAtom = atomFamily((id: string) =>
  atom(async (get): Promise<App | undefined> => {
    try {
      const allApps = await get(appsAtom);
      return allApps.find((app) => app.id === id);
    } catch (error) {
      console.error(`Failed to get app ${id}:`, error);
      return undefined;
    }
  }),
);

export const promptState = atomWithStorage("prompt", "");
export const generatedCodeState = atomWithStorage("generatedCode", "");

// Models state management using miniServer
export const modelsAtom = atomWithRefresh(async (): Promise<ModelInfo[]> => {
  try {
    const response = await miniServer.GET("/api/models");
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      const modelInfoResponse = response.data as ModelInfoResponse;
      return modelInfoResponse.data || [];
    }
    return [];
  } catch (error) {
    console.error("Failed to load models:", error);
    return [];
  }
});

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
    const response = await miniServer.GET("/api/projects");
    if (!response.data) {
      return [];
    }

    const projectListResponse = response.data as ProjectListResponse;
    return projectListResponse.data.map((project: Project) => {
      // Convert Project to ProjectData format for mapping
      const projectData = {
        id: project.id,
        name: project.name,
        description: project.description,
        icon: project.icon,
        status: project.status as "draft" | "published",
        current_version: project.current_version,
        initial_prompt: project.initial_prompt || "",
        initial_model: project.initial_model || "",
        versions: project.versions
          ? project.versions.map((version) => ({
              id: version.id,
              collection: "versions",
              data: {
                id: version.id,
                project_id: version.project_id,
                version_number: version.version_number,
                prompt: version.prompt,
                source_code: version.source_code,
                model: version.model || undefined,
                created_at: version.created_at,
              },
              created_at: version.created_at,
              updated_at: version.created_at,
            }))
          : [],
        created_at: project.created_at,
        updated_at: project.updated_at,
      };
      const serverProject: ServerProject = {
        id: project.id,
        collection: "projects",
        created_at: project.created_at,
        updated_at: project.updated_at,
        data: projectData,
      };
      return mapServerProjectToAppProject(serverProject);
    });
  } catch (error) {
    console.error("Failed to load projects from server:", error);
    return [];
  }
});

export const projectByIdAtom = atomFamily((projectId?: string) =>
  atom(async (): Promise<AppProject | null> => {
    if (!projectId) return null;
    try {
      // Using type assertion for path params due to OpenAPI schema generation issue
      const response = await miniServer.GET("/api/projects/{project_id}", {
        params: { path: { project_id: projectId } } as any,
      });

      if (!response.data) {
        return null;
      }

      const projectResponse = response.data as ProjectResponse;
      const project = projectResponse.data;

      // Convert Project to ProjectData format for mapping
      const projectData = {
        id: project.id,
        name: project.name,
        description: project.description,
        icon: project.icon,
        status: project.status as "draft" | "published",
        current_version: project.current_version,
        initial_prompt: project.initial_prompt || "",
        initial_model: project.initial_model || "",
        versions: project.versions
          ? project.versions.map((version) => ({
              id: version.id,
              collection: "versions",
              data: {
                id: version.id,
                project_id: version.project_id,
                version_number: version.version_number,
                prompt: version.prompt,
                source_code: version.source_code,
                model: version.model || undefined,
                created_at: version.created_at,
              },
              created_at: version.created_at,
              updated_at: version.created_at,
            }))
          : [],
        created_at: project.created_at,
        updated_at: project.updated_at,
      };
      const serverProject: ServerProject = {
        id: project.id,
        collection: "projects",
        created_at: project.created_at,
        updated_at: project.updated_at,
        data: projectData,
      };
      return mapServerProjectToAppProject(serverProject);
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        error.status === 404
      ) {
        return null;
      }
      console.error(`Failed to load project ${projectId} from server:`, error);
      return null;
    }
  }),
);

// Project versions atoms - for version control functionality
export const projectVersionsAtom = atomFamily((projectId: string) =>
  atomWithRefresh(async (): Promise<ProjectVersion[]> => {
    try {
      // Using type assertion for path params due to OpenAPI schema generation issue
      const pathParams = { path: { project_id: projectId } };
      const response = await miniServer.GET(
        "/api/projects/{project_id}/versions",
        {
          params: pathParams as any,
        },
      );

      if (!response.data) {
        return [];
      }

      const versionListResponse = response.data as ProjectVersionListResponse;
      return versionListResponse.data.sort(
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
      const requestBody: CreateVersionRequest = {
        prompt: versionData.prompt,
        source_code: versionData.source_code,
        model: versionData.model || null,
      };

      // Using type assertion for path params due to OpenAPI schema generation issue
      const pathParams = { path: { project_id: projectId } };
      const response = await miniServer.POST(
        "/api/projects/{project_id}/versions",
        {
          params: pathParams as any,
          body: requestBody,
        },
      );

      // Refresh the versions atom for this project
      const versionsAtom = projectVersionsAtom(projectId);
      set(versionsAtom);

      return response.data as ProjectVersionResponse;
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
      const requestBody: ConvertToAppRequest = {
        version,
        price: price || null,
      };

      // Using type assertion for path params due to OpenAPI schema generation issue
      const pathParams = { path: { project_id: projectId } };
      const response = await miniServer.POST(
        "/api/projects/{project_id}/convert",
        {
          params: pathParams as any,
          body: requestBody,
        },
      );
      return response.data as components["schemas"]["AppResponse"];
    } catch (error) {
      console.error("Failed to convert to app:", error);
      throw error;
    }
  },
);

// Export types for use in components
export type {
  App,
  AppListResponse,
  ModelInfoResponse,
  Project,
  ProjectResponse,
  ProjectListResponse,
  ProjectVersion,
  ProjectVersionResponse,
  ProjectVersionListResponse,
};
