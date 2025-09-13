import DashboardPage from "./dashboard";
import StorePage from "./store";
import ProjectsPage from "./projects";
import CreateNewProjectPage from "./projects/create";
import ProjectDetailPage from "./projects/[id]";

export const PAGES = {
  "/": DashboardPage,
  "/store": StorePage,
  "/projects": ProjectsPage,
  "/projects/create": CreateNewProjectPage,
  "/projects/:id/editor": ProjectDetailPage,
} as const;
