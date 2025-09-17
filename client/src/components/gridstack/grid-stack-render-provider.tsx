import {
  type PropsWithChildren,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { useGridStackContext } from "./grid-stack-context";
import {
  GridStack,
  type GridStackOptions,
  type GridStackWidget,
} from "gridstack";
import { GridStackRenderContext } from "./grid-stack-render-context";
import isEqual from "react-fast-compare";

// WeakMap to store widget containers for each grid instance
export const gridWidgetContainersMap = new WeakMap<
  GridStack,
  Map<string, HTMLElement>
>();

export function GridStackRenderProvider({ children }: PropsWithChildren) {
  const {
    _gridStack: { value: gridStack, set: setGridStack },
    initialOptions,
    onLayoutChange,
  } = useGridStackContext();

  const widgetContainersRef = useRef<Map<string, HTMLElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<GridStackOptions>(initialOptions);

  const renderCBFn = useCallback(
    (element: HTMLElement, widget: GridStackWidget & { grid?: GridStack }) => {
      if (widget.id && widget.grid) {
        // Get or create the widget container map for this grid instance
        let containers = gridWidgetContainersMap.get(widget.grid);
        if (!containers) {
          containers = new Map<string, HTMLElement>();
          gridWidgetContainersMap.set(widget.grid, containers);
        }
        containers.set(widget.id, element);

        // Also update the local ref for backward compatibility
        widgetContainersRef.current.set(widget.id, element);
      }
    },
    [],
  );

  const initGrid = useCallback(() => {
    if (containerRef.current) {
      GridStack.renderCB = renderCBFn;
      const grid = GridStack.init(optionsRef.current, containerRef.current);

      // Add change event handlers for layout persistence
      if (grid && onLayoutChange) {
        grid
          .on("change", (_event, items) => {
            // Save the layout when items are moved or resized
            if (items && items.length > 0) {
              const savedNodes = grid.save(false, false) as any[];
              onLayoutChange(savedNodes);
            }
          })
          .on("resize", (_event, _element) => {
            // Save layout after resize is complete
            const savedNodes = grid.save(false, false) as any[];
            onLayoutChange(savedNodes);
          });
      }

      return grid;
    }
    return null;
  }, [renderCBFn, onLayoutChange]);

  useLayoutEffect(() => {
    if (!isEqual(initialOptions, optionsRef.current) && gridStack) {
      try {
        gridStack.removeAll(false);
        gridStack.destroy(false);
        widgetContainersRef.current.clear();
        // Clean up the WeakMap entry for this grid instance
        gridWidgetContainersMap.delete(gridStack);
        optionsRef.current = initialOptions;
        setGridStack(initGrid());
      } catch (e) {
        console.error("Error reinitializing gridstack", e);
      }
    }
  }, [initialOptions, gridStack, initGrid, setGridStack]);

  useLayoutEffect(() => {
    if (!gridStack) {
      try {
        setGridStack(initGrid());
      } catch (e) {
        console.error("Error initializing gridstack", e);
      }
    }
  }, [gridStack, initGrid, setGridStack]);

  return (
    <GridStackRenderContext.Provider
      value={useMemo(
        () => ({
          getWidgetContainer: (widgetId: string) => {
            // First try to get from the current grid instance's map
            if (gridStack) {
              const containers = gridWidgetContainersMap.get(gridStack);
              if (containers?.has(widgetId)) {
                return containers.get(widgetId) || null;
              }
            }
            // Fallback to local ref for backward compatibility
            return widgetContainersRef.current.get(widgetId) || null;
          },
        }),
        // ! gridStack is required to reinitialize the grid when the options change
        [gridStack],
      )}
    >
      <div ref={containerRef} className="flex-1 overflow-auto">
        {gridStack ? children : null}
      </div>
    </GridStackRenderContext.Provider>
  );
}
