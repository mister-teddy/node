import { useSetAtom } from "jotai";
import { windowsStatesAtom } from "./state/3d";
import AppRenderer from "./components/app-renderer";
import type { Active3DWindow, AppTable } from "./types";
import { useEffect, type ReactNode } from "react";
import { customCrumbState } from "./router";

export function useOpenWindow() {
  const setWindows = useSetAtom(windowsStatesAtom);

  return [
    async (window: Omit<Active3DWindow, "position">) => {
      setWindows((prev) => {
        // Cylindrical positioning constants
        const RADIUS = 9; // Distance from center
        const HEIGHT = 3; // Y position (eye level)
        const MAX_WINDOWS = 12; // Maximum windows before overlapping

        // Calculate angle for new window position
        const windowIndex = prev.length;
        const angleStep = (2 * Math.PI) / MAX_WINDOWS;
        const angle = windowIndex * angleStep;

        // Convert cylindrical coordinates to Cartesian
        const x = Math.cos(angle) * RADIUS;
        const z = Math.sin(angle) * RADIUS;

        return [
          ...prev,
          {
            ...window,
            position: [x, HEIGHT, z],
          },
        ];
      });
    },
  ];
}

export function useOpenAppAsWindow({
  app,
  preferedSize,
}: {
  app: AppTable;
  preferedSize?: [number, number];
}) {
  const [openWindow] = useOpenWindow();

  return [
    async () => {
      openWindow({
        title: app.name,
        icon: app.icon,
        size: preferedSize,
        component: () => <AppRenderer app={app} />,
      });
    },
  ];
}

export function useCustomCrumb(title?: ReactNode) {
  const setCustomCrumb = useSetAtom(customCrumbState);
  useEffect(() => {
    if (title) {
      setCustomCrumb(title);
      return () => {
        setCustomCrumb("");
      };
    }
  }, [title, setCustomCrumb]);
}
