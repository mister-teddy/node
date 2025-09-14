import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { GridStack } from "gridstack";
import { useAtomValue, useSetAtom } from "jotai";
import { installedAppsAtom } from "@/state/app-ecosystem";
import type { AppTable } from "@/types";
import type { AppProject } from "@/types/app-project";
import AppEntry from "@/components/app-entry";
import FormatMoney from "@/components/format/money";
import WidgetDrawer from "@/components/widget-drawer";
import { Button } from "@/components/ui/button";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import "gridstack/dist/gridstack.min.css";
import {
  dashboardLayoutState,
  dashboardWidgetsAtom,
  saveDashboardLayoutAtom,
  removeWidgetAtom,
  availableWidgetsState,
  type DashboardWidget,
} from "@/state/dashboard";

interface DashboardApp {
  widget: DashboardWidget;
  app: AppProject | AppTable;
}

const DashboardPage: React.FC = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  const gridStackRef = useRef<GridStack | null>(null);
  const rootsRef = useRef<Map<string, any>>(new Map());

  // Atoms
  const dashboardLayout = useAtomValue(dashboardLayoutState);
  const dashboardWidgets = useAtomValue(dashboardWidgetsAtom);
  const availableWidgets = useAtomValue(availableWidgetsState);
  const installedApps = useAtomValue(installedAppsAtom);
  const saveDashboardLayout = useSetAtom(saveDashboardLayoutAtom);
  const removeWidget = useSetAtom(removeWidgetAtom);

  // Local state
  const [dashboardApps, setDashboardApps] = useState<DashboardApp[]>([]);
  const [isWidgetDrawerOpen, setIsWidgetDrawerOpen] = useState(false);
  const [layoutLoaded, setLayoutLoaded] = useState(false);

  // Initialize GridStack
  useEffect(() => {
    if (!gridRef.current) return;

    gridStackRef.current = GridStack.init(
      {
        cellHeight: 120,
        margin: 12,
        minRow: 1,
        column: 12,
        acceptWidgets: false,
        resizable: { handles: "se" },
        draggable: { handle: ".drag-handle" },
        float: true,
      },
      gridRef.current,
    );

    // Add change listener for layout changes
    gridStackRef.current.on('change', (_event, items) => {
      if (!layoutLoaded) return; // Don't save during initial load

      const updatedWidgets = dashboardWidgets.map(widget => {
        const item = items.find(i => i.id === widget.id);
        if (item) {
          return {
            ...widget,
            x: item.x || widget.x,
            y: item.y || widget.y,
            w: item.w || widget.w,
            h: item.h || widget.h,
          };
        }
        return widget;
      });

      // Debounced save (you might want to add proper debouncing)
      setTimeout(() => {
        saveDashboardLayout(updatedWidgets).catch(console.error);
      }, 1000);
    });

    return () => {
      // Clean up React roots
      rootsRef.current.forEach((root) => {
        root.unmount();
      });
      rootsRef.current.clear();

      if (gridStackRef.current) {
        gridStackRef.current.destroy();
        gridStackRef.current = null;
      }
    };
  }, []);

  // Load dashboard layout and sync with widgets
  useEffect(() => {
    if (!dashboardLayout || (!availableWidgets.length && !installedApps.length)) return;

    const appsById = new Map<string, AppProject | AppTable>();

    // Add installed apps
    installedApps.forEach(app => {
      appsById.set(app.id, app);
    });

    // Add available widgets (published projects)
    availableWidgets.forEach(widget => {
      appsById.set(widget.id, widget);
    });

    // Create dashboard apps from saved layout
    const newDashboardApps: DashboardApp[] = dashboardLayout.widgets
      .map(widget => {
        const app = appsById.get(widget.appId);
        if (app) {
          return { widget, app };
        }
        return null;
      })
      .filter((item): item is DashboardApp => item !== null);

    setDashboardApps(newDashboardApps);
    setLayoutLoaded(true);
  }, [dashboardLayout, availableWidgets, installedApps]);

  // Sync dashboardWidgets atom with layout
  useEffect(() => {
    if (dashboardLayout && layoutLoaded) {
      // Update the dashboardWidgetsAtom to keep it in sync
      // Note: This might need adjustment based on your atom setup
    }
  }, [dashboardLayout, layoutLoaded]);

  // Render widgets when dashboardApps changes
  useEffect(() => {
    if (!gridStackRef.current || !dashboardApps.length || !layoutLoaded) return;

    // Clean up existing roots
    rootsRef.current.forEach((root) => {
      root.unmount();
    });
    rootsRef.current.clear();

    // Clear existing widgets
    gridStackRef.current.removeAll();

    // Add dashboard apps as widgets
    dashboardApps.forEach(({ widget, app }) => {
      const element = document.createElement("div");
      element.className = "grid-stack-item";
      element.setAttribute("gs-id", widget.id);
      element.setAttribute("gs-x", widget.x.toString());
      element.setAttribute("gs-y", widget.y.toString());
      element.setAttribute("gs-w", widget.w.toString());
      element.setAttribute("gs-h", widget.h.toString());

      const content = document.createElement("div");
      content.className = "grid-stack-item-content p-0 overflow-hidden";

      element.appendChild(content);
      gridStackRef.current?.addWidget(element);

      // Create React root and render component
      const root = createRoot(content);
      rootsRef.current.set(widget.id, root);

      const handleRemoveWidget = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        removeWidget(widget.id).catch(console.error);
      };

      root.render(
        <AppEntry app={app as AppTable}>
          {({ onClick }) => (
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow h-full relative group">
              {/* Widget Controls */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={handleRemoveWidget}
                  title="Remove widget"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <div className="drag-handle cursor-move h-6 w-6 flex items-center justify-center rounded hover:bg-muted">
                  <GripVertical className="h-3 w-3" />
                </div>
              </div>

              <div className="flex items-center gap-3 h-full pr-12">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl">
                    {app.icon}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className="font-semibold text-base truncate pr-2"
                      style={{
                        viewTransitionName: `app-name-${app.id}`,
                      }}
                    >
                      {app.name}
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
                    {app.description || ""}
                  </p>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={onClick}
                  >
                    {"price" in app && app.price ? <FormatMoney amount={app.price} /> : "Open"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </AppEntry>,
      );
    });
  }, [dashboardApps, layoutLoaded, removeWidget]);

  const handleAddWidget = () => {
    setIsWidgetDrawerOpen(true);
  };

  return (
    <div className="flex-1 p-6 overflow-hidden">
      <div className="mb-6">
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

      {dashboardApps.length === 0 && layoutLoaded ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
            <Plus className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No widgets yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Add your first widget to get started. Choose from your published apps
            or installed applications.
          </p>
          <Button onClick={handleAddWidget} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Your First Widget
          </Button>
        </div>
      ) : (
        <div
          ref={gridRef}
          className="grid-stack h-full overflow-auto"
          style={{ minHeight: "600px" }}
        />
      )}

      <WidgetDrawer
        open={isWidgetDrawerOpen}
        onOpenChange={setIsWidgetDrawerOpen}
      />
    </div>
  );
};

export default DashboardPage;