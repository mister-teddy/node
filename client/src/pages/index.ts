import DashboardPage from "./dashboard";
import StorePage from "./store";
import ProjectsPage from "./projects";
import CreateNewProjectPage from "./projects/create";
import ProjectEditorPage from "./projects/editor";

export const PAGES = {
  "/": DashboardPage,
  "/store": StorePage,
  "/projects": ProjectsPage,
  "/projects/create": CreateNewProjectPage,
  "/projects/:id/editor": ProjectEditorPage,
} as const;
