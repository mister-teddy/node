import { appsAtom } from "@/state/app-ecosystem";
import { useAtomValue } from "jotai";
import FormatMoney from "./format/money";
import AppEntry from "./app-entry";
import AppIcon from "./app-icon";
import GridRenderer from "./grid-renderer";
import { Button } from "@/components/ui/button";

export default function AppList() {
  const apps = useAtomValue(appsAtom);

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
              className={`flex items-center py-3 px-2 max-w-full app-list-item`}
            >
              <AppIcon app={app} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <div
                    className="font-semibold text-base"
                    style={{
                      viewTransitionName: `app-name-${app.id}`,
                    }}
                  >
                    {app.name}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="ml-2"
                    onClick={onClick}
                  >
                    {app.price ? <FormatMoney amount={app.price} /> : "Open"}
                  </Button>
                </div>
                <div className="text-muted-foreground text-sm mb-1 h-10 line-clamp-2">
                  {app.description}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span className="mr-2">Version: {app.version || "—"}</span>
                </div>
              </div>
            </div>
          )}
        </AppEntry>
      )}
    />
  );
}
