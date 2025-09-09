import CreateAppPage from "./create-app";
import DashboardPage from "./dashboard";
import StorePage from "./store";

export const PAGES = {
  "/": DashboardPage,
  "/store": StorePage,
  "/create-app": CreateAppPage,
} as const;
