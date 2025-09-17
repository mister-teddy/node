import { createBrowserRouter, Link } from "react-router-dom";
import RootLayout from "./pages/_layout";
import AppPage from "./pages/app";
import NotFound from "./pages/404";
import DashboardPage from "./pages/dashboard";
import ProjectsPage from "./pages/projects";
import ProjectDetailPage from "./pages/projects/[id]";
import CreateNewProjectPage from "./pages/projects/create";
import StorePage from "./pages/store";
import { Button } from "./components/ui";
import { Wand } from "lucide-react";
import { atom, useSetAtom } from "jotai";
import { createElement, type ReactNode } from "react";
import { widgetDrawerOpenAtom } from "./state/dashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    ErrorBoundary: NotFound,
    children: [
      {
        path: "/",
        Component: DashboardPage,
        handle: {
          crumb: "Dashboard",
          actions: [
            createElement(function AddWidgetButton() {
              const setWidgetDrawerOpen = useSetAtom(widgetDrawerOpenAtom);
              return (
                <Button
                  variant="outline"
                  onClick={() => setWidgetDrawerOpen((o) => !o)}
                >
                  Add Widget
                </Button>
              );
            }),
          ],
        },
      },
      {
        path: "/store",
        Component: StorePage,
        handle: {
          crumb: "Store",
        },
      },
      {
        path: "/projects",
        handle: {
          crumb: "Projects",
        },
        children: [
          {
            path: "",
            Component: ProjectsPage,
            handle: {
              actions: [
                <Button asChild variant="outline">
                  <Link to="/projects/create">
                    <Wand /> New Project
                  </Link>
                </Button>,
              ],
            },
          },
          {
            path: "create",
            Component: CreateNewProjectPage,
            handle: {
              crumb: "New Project",
            },
          },
          {
            path: ":id/editor",
            Component: ProjectDetailPage,
          },
          {
            path: ":id/versions",
            Component: ProjectDetailPage,
          },
          {
            path: ":id/settings",
            Component: ProjectDetailPage,
          },
        ],
      },
      {
        path: "apps/:id",
        Component: AppPage,
      },
    ],
  },
]);

export const customCrumbState = atom<ReactNode>("");
