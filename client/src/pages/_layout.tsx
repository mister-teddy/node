import { Suspense, useEffect } from "react";
import { useAtomValue } from "jotai";
import { adaptiveIs3DModeAtom, windowsStatesAtom } from "@/state/3d";
import LayoutManager3D from "@/components/3d/layout-manager";
import Spinner from "@/components/spinner";
// 2D Layout Components
import Sidebar from "@/components/sidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { useAtomCallback } from "jotai/utils";
import CONFIG from "@/config";

// Layout wrapper that contains 3D/2D layout logic - used by individual pages
export function RootLayout() {
  const is3DMode = useAtomValue(adaptiveIs3DModeAtom);
  const navigate = useNavigate();
  const getWindows = useAtomCallback((get) => get(windowsStatesAtom));

  useEffect(() => {
    if (!is3DMode) {
      // If switching to 3D mode, ensure at least one window is open
      const lastWindow = getWindows().at(-1);
      const path = CONFIG.SIDEBAR_ITEMS.find(
        (item) => item.title === lastWindow?.title
      )?.path;
      if (path) {
        navigate(path);
      }
    } else {
      navigate("/");
    }
  }, [is3DMode]);

  if (is3DMode) {
    return (
      <Suspense fallback={<Spinner />}>
        <LayoutManager3D />
      </Suspense>
    );
  }

  // 2D fallback for mobile or when 3D is disabled
  return (
    <div className="flex w-full h-full">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
