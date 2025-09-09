import { adaptiveIs3DModeAtom, windowsStatesAtom } from "@/state/3d";
import type { AppTable } from "@/types";
import { useAtomValue, useSetAtom } from "jotai";
import {
  type ComponentType,
  type FunctionComponent,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import AppRenderer from "./app-renderer";

interface AppEntryProps {
  app: AppTable;
  preferedSize?: [number, number];
  component?: ComponentType;
  children: (renderProps: { onClick: () => void }) => ReactNode;
}

const AppEntry2D: FunctionComponent<AppEntryProps> = ({ app, children }) => {
  const navigate = useNavigate();

  return children({
    onClick: () => {
      if (app.price === 0) {
        navigate(`/apps/${app.id}`);
      } else {
        alert("Payment with Lightning Network is to be implemented");
      }
    },
  });
};

const AppEntry3D: FunctionComponent<AppEntryProps> = ({
  app,
  preferedSize,
  children,
  component,
}) => {
  const setWindows = useSetAtom(windowsStatesAtom);

  return children({
    onClick: async () => {
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
            title: app.name,
            icon: app.icon,
            component: component ? component : () => <AppRenderer app={app} />,
            size: preferedSize,
            position: [x, HEIGHT, z],
          },
        ];
      });
    },
  });
};

function AppEntry(props: AppEntryProps) {
  const is3D = useAtomValue(adaptiveIs3DModeAtom);
  if (is3D) {
    return <AppEntry3D {...props} />;
  }
  return <AppEntry2D {...props} />;
}

export default AppEntry;
