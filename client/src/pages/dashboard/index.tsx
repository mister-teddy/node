import React, { useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import { installedAppsAtom } from "@/state/app-ecosystem";
import type { AppTable, ProjectData } from "@/types";
import WidgetDrawer from "@/components/widget-drawer";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Plus } from "lucide-react";
import "gridstack/dist/gridstack.min.css";
import {
  GridStackProvider,
  GridStackRender,
  GridStackRenderProvider,
} from "@/components/gridstack";
import {
  dashboardLayoutState,
  dashboardWidgetsAtom,
  availableWidgetsState,
} from "@/state/dashboard";
import AppRenderer from "@/components/app-renderer";
import { Card } from "@/components/ui";

const DashboardPage: React.FC = () => {
  const dashboardLayout = useAtomValue(dashboardLayoutState);
  const availableWidgets = useAtomValue(availableWidgetsState);
  const installedApps = useAtomValue(installedAppsAtom);
  const dashboardWidgets = useAtomValue(dashboardWidgetsAtom);
  const [isWidgetDrawerOpen, setIsWidgetDrawerOpen] = useState(false);

  const appsById = useMemo(() => {
    const appsById = new Map<string, ProjectData | AppTable>();
    installedApps.forEach((app) => appsById.set(app.id, app));
    availableWidgets.forEach((widget: ProjectData) =>
      appsById.set(widget.id, widget),
    );
    return appsById;
  }, [installedApps, availableWidgets]);

  // Build gridOptions from dashboard state
  const gridOptions = useMemo(() => {
    // Compose children from dashboardLayout.widgets and app/widget data
    if (!dashboardLayout || (!availableWidgets.length && !installedApps.length))
      return { acceptWidgets: true, margin: 8, cellHeight: 120, children: [] };

    const children = dashboardLayout.widgets
      .map((widget) => {
        const app = appsById.get(widget.id);
        if (!app || !widget.id) return {};
        // You can customize the content serialization as needed
        return {
          id: widget.id,
          x: widget.x,
          y: widget.y,
          w: widget.w,
          h: widget.h,
          content: JSON.stringify({
            name: app.id,
          }),
        };
      })
      .filter(Boolean);

    return {
      acceptWidgets: true,
      margin: 12,
      cellHeight: 120,
      children,
    };
  }, [dashboardLayout, availableWidgets, installedApps, dashboardWidgets]);

  const handleAddWidget = () => setIsWidgetDrawerOpen(true);

  return (
    <GridStackProvider initialOptions={gridOptions}>
      <div className="p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your widgets. Drag and resize to customize your layout.
            </p>
          </div>
          <Button onClick={handleAddWidget} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Widget
          </Button>
        </div>
      </div>

      {dashboardWidgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center self-center py-24 text-center">
          <div className="flex-none w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
            <LayoutDashboard />
          </div>
          <h3 className="text-xl font-semibold mb-2">No widgets yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Add your first widget to get started. Choose from your published
            apps or installed applications.
          </p>
          <Button onClick={handleAddWidget} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Your First Widget
          </Button>
        </div>
      ) : (
        <GridStackRenderProvider>
          <GridStackRender
            componentMap={dashboardWidgets.reduce(
              (map, widget) =>
                Object.assign(map, {
                  [widget.id]: () => {
                    const app = appsById.get(widget.id)!;
                    if ("versions" in app) {
                      (app as unknown as AppTable).source_code =
                        app.versions[0]?.source_code || "";
                    }
                    return (
                      <Card className="min-h-0">
                        <AppRenderer app={app as AppTable} />
                      </Card>
                    );
                  },
                }),
              {},
            )}
          />
        </GridStackRenderProvider>
      )}

      <WidgetDrawer
        open={isWidgetDrawerOpen}
        onOpenChange={setIsWidgetDrawerOpen}
      />
    </GridStackProvider>
  );
};

export default DashboardPage;
