import { useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Plus, Loader2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { availableToAddWidgetsAtom, addWidgetAtom } from "@/state/dashboard";
import type { components } from "@/libs/mini-server.schema";

type App = components["schemas"]["App"];

interface WidgetDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WidgetDrawer({
  open,
  onOpenChange,
}: WidgetDrawerProps) {
  const availableWidgets = useAtomValue(availableToAddWidgetsAtom);
  const addWidget = useSetAtom(addWidgetAtom);
  const [addingWidgetId, setAddingWidgetId] = useState<string | null>(null);

  const handleAddWidget = async (widget: App) => {
    try {
      setAddingWidgetId(widget.id);
      await addWidget(widget);
      onOpenChange(false); // Close drawer after successful addition
    } catch (error) {
      console.error("Failed to add widget:", error);
    } finally {
      setAddingWidgetId(null);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="h-[80vh]">
        <DrawerHeader className="border-b">
          <DrawerTitle>Add Widgets</DrawerTitle>
          <DrawerDescription>
            Add widgets to customize your dashboard
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 p-6 overflow-auto">
          {availableWidgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No widgets available
              </h3>
              <p className="text-muted-foreground max-w-sm">
                All available widgets are already on your dashboard. Create new
                apps in the Projects section to add more widgets.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {availableWidgets.map((widget: App) => (
                <WidgetCard
                  key={widget.id}
                  widget={widget}
                  isAdding={addingWidgetId === widget.id}
                  onAdd={() => handleAddWidget(widget)}
                />
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

interface WidgetCardProps {
  widget: App;
  isAdding: boolean;
  onAdd: () => void;
}

function WidgetCard({ widget, isAdding, onAdd }: WidgetCardProps) {
  return (
    <div className="group relative bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-200">
      {/* Hover effect overlay */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      <div className="relative">
        {/* App Icon */}
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted mb-4 text-2xl">
          {widget.icon}
        </div>

        {/* App Info */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-base leading-tight pr-2">
              {widget.name}
            </h3>
            {widget.status === "published" && (
              <Badge variant="secondary" className="text-xs">
                Published
              </Badge>
            )}
          </div>

          <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
            {widget.description}
          </p>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>v{widget.version}</span>
            {widget.price > 0 && (
              <span className="text-primary font-medium">${widget.price}</span>
            )}
          </div>
        </div>

        {/* Add Button */}
        <Button
          onClick={onAdd}
          disabled={isAdding}
          className="w-full group-hover:shadow-md transition-shadow duration-200"
          size="sm"
        >
          {isAdding ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Widget
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
