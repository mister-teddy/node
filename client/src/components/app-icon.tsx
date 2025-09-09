import type { AppTable } from "@/types";
import type { Selectable } from "kysely";

function AppIcon(props: { app: Selectable<AppTable> }) {
  return (
    <div
      className="flex-shrink-0 w-16 h-16 flex items-center justify-center bg-gray-100 rounded-lg mr-6 text-4xl"
      style={{
        viewTransitionName: `app-icon-${props.app.id}`,
      }}
    >
      {props.app.icon}
    </div>
  );
}

export default AppIcon;
