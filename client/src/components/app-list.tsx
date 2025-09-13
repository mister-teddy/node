import { installedAppsAtom, storeAppsAtom } from "@/state/app-ecosystem";
import { useAtomValue } from "jotai";
import FormatMoney from "./format/money";
import AppEntry from "./app-entry";
import AppIcon from "./app-icon";
import GridRenderer from "./grid-renderer";

export default function AppList({
  installedOnly = false,
}: {
  installedOnly?: boolean;
}) {
  const apps = useAtomValue(installedOnly ? installedAppsAtom : storeAppsAtom);

  return (
    <GridRenderer
      items={apps}
      keyExtractor={(app) => app.id}
      render={(app) => (
        <AppEntry
          app={app}
          preferedSize={app.id === "db-viewer" ? [20, 9] : undefined}
        >
          {({ onClick }) => (
            <div
              className={`flex items-center py-6 px-2 max-w-full app-list-item`}
            >
              <AppIcon app={app} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div
                    className="font-semibold text-lg"
                    style={{
                      viewTransitionName: `app-name-${app.id}`,
                    }}
                  >
                    {app.name}
                  </div>
                  <button
                    type="button"
                    className="text-blue-600 font-bold text-sm ml-4 bg-bg rounded-full px-4 py-1"
                    onClick={onClick}
                  >
                    {app.price ? (
                      <FormatMoney amount={app.price} />
                    ) : (
                      "Open"
                    )}
                  </button>
                </div>
                <div className="text-gray-500 text-sm mb-2">
                  {app.description}
                </div>
                <div className="flex items-center text-xs text-gray-400">
                  <span className="mr-2">
                    Version: {app.version || "—"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </AppEntry>
      )}
    />
  );
}
