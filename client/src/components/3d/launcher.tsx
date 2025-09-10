import CONFIG from "@/config";
import Profile from "../profile";
import Window3D from "./window";
import { useOpenWindow } from "@/hooks";
import { PAGES } from "@/pages";

function LauncherItem(props: {
  item: (typeof CONFIG.SIDEBAR_ITEMS)[number];
  preferedSize?: [number, number];
}) {
  const [openWindow] = useOpenWindow();

  return (
    <button
      onClick={() =>
        openWindow({
          title: props.item.title,
          icon: props.item.icon,
          component: PAGES[props.item.path],
          size: props.preferedSize,
        })
      }
      className={`flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 aspect-square w-full bg-gray-200 text-gray-700 hover:bg-gray-100 hover:shadow-sm`}
    >
      <span className="text-2xl mb-2">{props.item.icon}</span>
      <span className="text-xs font-medium text-center leading-tight">
        {props.item.title}
      </span>
    </button>
  );
}

export default function Launcher3D() {
  return (
    <Window3D size={[8, 10]}>
      {/* Profile Section */}
      <Profile />
      {/* Navigation Items */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          {CONFIG.SIDEBAR_ITEMS.map((item) => (
            <LauncherItem key={item.path} item={item} />
          ))}
        </div>
      </nav>
    </Window3D>
  );
}
