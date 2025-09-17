import { atom } from "jotai";
import { atomWithRefresh } from "jotai/utils";
import { miniServer } from "@/libs/mini-server";
import type { components } from "@/libs/mini-server.schema";
import { appsAtom } from "./app-ecosystem";

type App = components["schemas"]["App"];

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

// Published apps atom - loads published apps from server
export const availableWidgetsState = atomWithRefresh(
  async (get): Promise<App[]> => {
    const apps = await get(appsAtom);
    return apps.filter((app) => !!app.source_code);
  },
);

// Dashboard layout atoms
export const dashboardLayoutState = atomWithRefresh(async () => {
  try {
    const response = await miniServer.GET("/api/dashboard/layout");
    if (!response.data?.data) {
      throw new Error("No layout data");
    }
    return response.data?.data;
  } catch {
    return { id: "", widgets: [], updatedAt: new Date().toISOString() };
  }
});

// Dashboard widgets currently on dashboard - automatically synced with server layout
export const dashboardWidgetsAtom = atom(
  // Getter: load from server layout
  async (get) => {
    const layout = await get(dashboardLayoutState);
    return layout.widgets;
  },
  // Setter: allow manual updates and trigger save
  async (_get, set, widgets: DashboardWidget[]) => {
    // Save to server and update local state
    await set(saveDashboardLayoutAtom, widgets);
  },
);

// Derive widgets that are available to add (not currently on dashboard)
export const availableToAddWidgetsAtom = atom(async (get): Promise<App[]> => {
  const availableWidgets = await get(availableWidgetsState);
  const currentWidgets = await get(dashboardWidgetsAtom);
  const currentWidgetAppIds = new Set(
    currentWidgets.map((w: DashboardWidget) => w.id),
  );

  return availableWidgets.filter(
    (app: App) => !currentWidgetAppIds.has(app.id),
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

      await miniServer.PUT("/api/dashboard/layout", {
        body: {
          widgets: layout.widgets,
        },
      });

      // Refresh the dashboard layout state from server
      set(dashboardLayoutState);

      return layout;
    } catch (error) {
      console.error("Failed to save dashboard layout:", error);
      throw error;
    }
  },
);

// Add widget to dashboard
export const addWidgetAtom = atom(null, async (get, set, app: App) => {
  const currentWidgets = await get(dashboardWidgetsAtom);

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

  // Save to server using the widget atom setter
  await set(dashboardWidgetsAtom, updatedWidgets);
});

// Remove widget from dashboard
export const removeWidgetAtom = atom(
  null,
  async (get, set, widgetId: string) => {
    const currentWidgets = await get(dashboardWidgetsAtom);
    const updatedWidgets = currentWidgets.filter((w) => w.id !== widgetId);

    // Save to server using the widget atom setter
    await set(dashboardWidgetsAtom, updatedWidgets);
  },
);

// Update dashboard layout from GridStack changes
export const updateDashboardLayoutAtom = atom(
  null,
  async (_get, set, newWidgets: DashboardWidget[]) => {
    // Save to server using the widget atom setter
    await set(dashboardWidgetsAtom, newWidgets);
  },
);

export const widgetDrawerOpenAtom = atom(false);
