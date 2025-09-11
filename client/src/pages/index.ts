import CreateAppPage from "./create-app";
import DashboardPage from "./dashboard";
import StorePage from "./store";
import ProjectsPage from "./projects";

export const PAGES = {
  "/": DashboardPage,
  "/store": StorePage,
  "/create-app": CreateAppPage,
  "/projects": ProjectsPage,
} as const;
