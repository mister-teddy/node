import CONFIG from "@/config";
import Profile from "../profile";
import Window3D from "./window";
import AppEntry from "../app-entry";
import { PAGES } from "@/pages";

export default function Launcher3D() {
  return (
    <Window3D size={[8, 10]}>
      {/* Profile Section */}
      <Profile />
      {/* Navigation Items */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          {CONFIG.SIDEBAR_ITEMS.map((item) => (
            <AppEntry
              app={{
                id: item.path,
                name: item.title,
                icon: item.icon,
                price: 0,
                description: "",
                version: "1.0.0",
                installed: 1,
              }}
              preferedSize={
                ["/", "/store"].includes(item.path) ? [20, 9] : undefined
              }
              component={PAGES[item.path]}
            >
              {({ onClick }) => (
                <button
                  key={item.path}
                  onClick={onClick}
                  className={`
                    flex flex-col items-center justify-center
                    p-4 rounded-lg transition-all duration-200
                    aspect-square w-full
                    bg-gray-200
                    text-gray-700 hover:bg-gray-100 hover:shadow-sm
                  `}
                >
                  <span className="text-2xl mb-2">{item.icon}</span>
                  <span className="text-xs font-medium text-center leading-tight">
                    {item.title}
                  </span>
                </button>
              )}
            </AppEntry>
          ))}
        </div>
      </nav>
    </Window3D>
  );
}
