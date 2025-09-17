import React, { useMemo, useCallback } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import type { AppTable } from "@/types";

type AppForRendering = Omit<AppTable, "price" | "version" | "installed"> & {
  source_code?: string;
};
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
  updateDashboardLayoutAtom,
  type DashboardWidget,
  widgetDrawerOpenAtom,
} from "@/state/dashboard";
import AppRenderer from "@/components/app-renderer";
import { Card } from "@/components/ui";

const DashboardPage: React.FC = () => {
  const dashboardLayout = useAtomValue(dashboardLayoutState);
  const availableWidgets = useAtomValue(availableWidgetsState);
  const dashboardWidgets = useAtomValue(dashboardWidgetsAtom);
  const updateDashboardLayout = useSetAtom(updateDashboardLayoutAtom);
  const [isWidgetDrawerOpen, setIsWidgetDrawerOpen] =
    useAtom(widgetDrawerOpenAtom);

  // Build gridOptions from dashboard state
  const gridOptions = useMemo(() => {
    const children = dashboardLayout.widgets
      .map((widget) => {
        const app = availableWidgets.find((w) => w.id === widget.id);
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
      margin: 24,
      marginTop: 0,
      cellHeight: 120,
      children,
    };
  }, [dashboardLayout, availableWidgets]);

  const handleAddWidget = () => setIsWidgetDrawerOpen(true);

  // Handle GridStack layout changes (move, resize)
  const handleLayoutChange = useCallback(
    (savedNodes: any[]) => {
      const updatedWidgets: DashboardWidget[] = savedNodes.map((node) => ({
        id: node.id,
        x: node.x,
        y: node.y,
        w: node.w,
        h: node.h,
      }));

      // Only update if widgets have actually changed
      if (JSON.stringify(updatedWidgets) !== JSON.stringify(dashboardWidgets)) {
        // updateDashboardLayout(updatedWidgets);
      }
    },
    [updateDashboardLayout, dashboardWidgets],
  );

  return (
    <GridStackProvider
      initialOptions={gridOptions}
      onLayoutChange={handleLayoutChange}
    >
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
                    const app = availableWidgets.find(
                      (w) => w.id === widget.id,
                    );
                    if (!app) return null;

                    // Convert App to AppForRendering format
                    const appForRendering: AppForRendering = {
                      id: app.id,
                      name: app.name,
                      description: app.description,
                      icon: app.icon,
                      source_code: app.source_code || "",
                    };

                    return (
                      <Card className="w-full h-full !overflow-hidden p-0">
                        <AppRenderer app={appForRendering as AppTable} />
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
