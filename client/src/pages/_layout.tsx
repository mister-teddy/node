import { Suspense, useEffect, useRef } from "react";
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
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip navigation on initial mount to prevent redirect on page reload
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!is3DMode) {
      // If switching to 2D mode, navigate to window path
      const lastWindow = getWindows().at(-1);
      const path = CONFIG.SIDEBAR_ITEMS.find(
        (item) => item.title === lastWindow?.title
      )?.path;
      if (path) {
        navigate(path);
      }
    } else {
      // If switching to 3D mode, go to dashboard
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
