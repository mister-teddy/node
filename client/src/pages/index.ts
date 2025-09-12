import CreateAppPage from "./create-app";
import CreateNewAppPage from "./create-new-app";
import DashboardPage from "./dashboard";
import StorePage from "./store";
import ProjectsPage from "./projects";

export const PAGES = {
  "/": DashboardPage,
  "/store": StorePage,
  "/create-app": CreateNewAppPage,
  "/projects": ProjectsPage,
  "/projects/:id/editor": CreateAppPage,
} as const;
