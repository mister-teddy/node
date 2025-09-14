import { atom } from "jotai";
import { atomWithRefresh } from "jotai/utils";
import CONFIG from "@/config";
import type { ServerResponse, ProjectData } from "@/types";

// Dashboard widget layout interfaces
export interface DashboardWidget {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardLayout {
  widgets: DashboardWidget[];
  updatedAt: string;
}

type DashboardLayoutResponse = ServerResponse<DashboardLayout>;

// Published apps atom - loads published apps from server
export const availableWidgetsState = atomWithRefresh(async () => {
  try {
    const response = await fetch(
      `${CONFIG.API.BASE_URL}/api/published-projects`,
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch published apps: ${response.status}`);
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Failed to load published apps from server:", error);
    return [];
  }
});

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
      return (
        result.data || { widgets: [], updatedAt: new Date().toISOString() }
      );
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
  const currentWidgetAppIds = new Set(currentWidgets.map((w) => w.id));

  return availableWidgets.filter(
    (app: ProjectData) => !currentWidgetAppIds.has(app.id),
  );
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
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
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
export const addWidgetAtom = atom(null, async (get, set, app: ProjectData) => {
  const currentWidgets = get(dashboardWidgetsAtom);

  // Find next available position
  const getNextPosition = () => {
    const occupiedPositions = new Set(
      currentWidgets.map((w) => `${w.x}-${w.y}`),
    );

    let x = 0,
      y = 0;
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
    id: app.id,
    x,
    y,
    w: 4, // Default width
    h: 2, // Default height
  };

  const updatedWidgets = [...currentWidgets, newWidget];

  // Save to server
  await set(saveDashboardLayoutAtom, updatedWidgets);
});

// Remove widget from dashboard
export const removeWidgetAtom = atom(
  null,
  async (get, set, widgetId: string) => {
    const currentWidgets = get(dashboardWidgetsAtom);
    const updatedWidgets = currentWidgets.filter((w) => w.id !== widgetId);

    // Save to server
    await set(saveDashboardLayoutAtom, updatedWidgets);
  },
);
