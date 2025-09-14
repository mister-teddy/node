import { atom } from "jotai";
import { atomWithRefresh } from "jotai/utils";
import CONFIG from "@/config";
import type { AppProject } from "@/types/app-project";
import type { ServerResponse, ServerProject, ServerVersion } from "@/types";

type PublishedAppsResponse = ServerResponse<ServerProject[]>;

// Dashboard widget layout interfaces
export interface DashboardWidget {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  appId: string;
}

export interface DashboardLayout {
  widgets: DashboardWidget[];
  updatedAt: string;
}

type DashboardLayoutResponse = ServerResponse<DashboardLayout>;

// Helper function to convert ServerVersion to AppProjectVersion
function mapServerVersionToAppVersion(serverVersion: ServerVersion) {
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

  const parseDate = (dateString: string): Date => {
    if (!dateString) return new Date();
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const versions = (data.versions || []).map(mapServerVersionToAppVersion);
  const currentVersionData = versions.find(
    (v) => v.versionNumber === data.current_version,
  );

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    icon: data.icon,
    price: 0,
    createdAt: parseDate(data.created_at),
    updatedAt: parseDate(data.updated_at),
    status: data.status,
    model: currentVersionData?.model || data.initial_model,
    originalPrompt: currentVersionData?.prompt || data.initial_prompt || "",
    currentVersion: data.current_version,
    versions: versions,
  };
}

// Published apps atom - loads published apps from server
export const availableWidgetsState = atomWithRefresh(
  async (): Promise<AppProject[]> => {
    try {
      const response = await fetch(
        `${CONFIG.API.BASE_URL}/api/published-projects`,
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch published apps: ${response.status}`);
      }
      const result: PublishedAppsResponse = await response.json();
      const serverProjects = result.data || [];
      return serverProjects.map(mapServerProjectToAppProject);
    } catch (error) {
      console.error("Failed to load published apps from server:", error);
      return [];
    }
  },
);

// Dashboard layout atoms
export const dashboardLayoutState = atomWithRefresh(
  async (): Promise<DashboardLayout> => {
    try {
      const response = await fetch(
        `${CONFIG.API.BASE_URL}/api/dashboard/layout`,
      );
      if (!response.ok) {
        if (response.status === 404) {
          // No saved layout, return empty default
          return { widgets: [], updatedAt: new Date().toISOString() };
        }
        throw new Error(`Failed to fetch dashboard layout: ${response.status}`);
      }
      const result: DashboardLayoutResponse = await response.json();
      return result.data || { widgets: [], updatedAt: new Date().toISOString() };
    } catch (error) {
      console.error("Failed to load dashboard layout:", error);
      return { widgets: [], updatedAt: new Date().toISOString() };
    }
  },
);

// Dashboard widgets currently on dashboard
export const dashboardWidgetsAtom = atom<DashboardWidget[]>([]);

// Derive widgets that are available to add (not currently on dashboard)
export const availableToAddWidgetsAtom = atom(async (get) => {
  const availableWidgets = await get(availableWidgetsState);
  const currentWidgets = get(dashboardWidgetsAtom);
  const currentWidgetAppIds = new Set(currentWidgets.map(w => w.appId));

  return availableWidgets.filter(app => !currentWidgetAppIds.has(app.id));
});

// Save dashboard layout to server
export const saveDashboardLayoutAtom = atom(
  null,
  async (_get, set, widgets: DashboardWidget[]) => {
    try {
      const layout: DashboardLayout = {
        widgets,
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch(
        `${CONFIG.API.BASE_URL}/api/dashboard/layout`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(layout),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to save dashboard layout: ${response.status}`);
      }

      // Update local state
      set(dashboardWidgetsAtom, widgets);

      return layout;
    } catch (error) {
      console.error("Failed to save dashboard layout:", error);
      throw error;
    }
  },
);

// Add widget to dashboard
export const addWidgetAtom = atom(
  null,
  async (get, set, appProject: AppProject) => {
    const currentWidgets = get(dashboardWidgetsAtom);

    // Find next available position
    const getNextPosition = () => {
      const occupiedPositions = new Set(
        currentWidgets.map(w => `${w.x}-${w.y}`)
      );

      let x = 0, y = 0;
      while (occupiedPositions.has(`${x}-${y}`)) {
        x += 4;
        if (x >= 12) {
          x = 0;
          y += 2;
        }
      }
      return { x, y };
    };

    const { x, y } = getNextPosition();

    const newWidget: DashboardWidget = {
      id: `widget-${appProject.id}-${Date.now()}`,
      x,
      y,
      w: 4, // Default width
      h: 2, // Default height
      appId: appProject.id,
    };

    const updatedWidgets = [...currentWidgets, newWidget];

    // Save to server
    await set(saveDashboardLayoutAtom, updatedWidgets);
  },
);

// Remove widget from dashboard
export const removeWidgetAtom = atom(
  null,
  async (get, set, widgetId: string) => {
    const currentWidgets = get(dashboardWidgetsAtom);
    const updatedWidgets = currentWidgets.filter(w => w.id !== widgetId);

    // Save to server
    await set(saveDashboardLayoutAtom, updatedWidgets);
  },
);
