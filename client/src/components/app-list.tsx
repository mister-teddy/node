import { installedAppsAtom, storeAppsAtom } from "@/state/app-ecosystem";
import { useAtomValue } from "jotai";
import FormatMoney from "./format/money";
import { useMemo } from "react";
import AppEntry from "./app-entry";
import AppIcon from "./app-icon";

export default function AppList({
  installedOnly = false,
}: {
  installedOnly?: boolean;
}) {
  const apps = useAtomValue(installedOnly ? installedAppsAtom : storeAppsAtom);

  // Split apps into 3 chunks, memoized
  const appChunks = useMemo(() => {
    const chunkSize = Math.ceil(apps.length / 3);
    return [
      apps.slice(0, chunkSize),
      apps.slice(chunkSize, chunkSize * 2),
      apps.slice(chunkSize * 2),
    ];
  }, [apps]);

  return (
    <main className="flex-1 p-8 min-w-0 box-border overflow-y-auto h-full">
      <h1 className="text-3xl font-bold mb-8">
        {installedOnly ? "Dashboard" : "Store"}
      </h1>
      <section className="w-full grid grid-cols-1 xl:grid-cols-3 xl:gap-10">
        {appChunks.map((chunk, i) => (
          <div
            key={i}
            className="flex flex-col border-b border-gray-200 xl:border-none last:border-none"
          >
            {chunk.map((app) => (
              <AppEntry
                key={app.id}
                app={app}
                preferedSize={app.id === "db-viewer" ? [20, 9] : undefined}
              >
                {({ onClick }) => (
                  <div
                    key={app.id}
                    className={`flex items-center py-6 px-2 max-w-full app-list-item border-b border-gray-200 last:border-none`}
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
            ))}
          </div>
        ))}
      </section>
    </main>
  );
}
