import { Link, useLocation } from "react-router-dom";
import Profile from "./profile";
import CONFIG from "@/config";
import StyledInput from "./forms/input";

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="flex flex-col sticky top-0 h-full z-10 p-6 pr-0">
      <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-[28px] shadow-[0_4px_24px_0_rgba(0,0,0,0.06)] w-72 border border-gray-100">
        <div className="p-4">
          <StyledInput
            name="search"
            type="text"
            placeholder="Search"
            className="px-5 py-2 rounded-full"
          />
        </div>
        <nav className="flex-1 overflow-y-auto no-scrollbar">
          <ul className="space-y-0.5">
            {CONFIG.SIDEBAR_ITEMS.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-5 py-2 cursor-pointer transition-colors select-none font-normal tracking-tight ${
                    location.pathname === item.path
                      ? "text-blue-600 bg-gray-100 font-medium"
                      : "text-gray-700 hover:bg-bg"
                  }`}
                >
                  <span className="mr-2 text-lg">{item.icon}</span>
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Profile />
      </div>
    </aside>
  );
}
