import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "./pages/_layout";
import AppPage from "./pages/app";
import CONFIG from "./config";
import { PAGES } from "./pages";
import NotFound from "./pages/404";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    ErrorBoundary: NotFound,
    children: CONFIG.SIDEBAR_ITEMS.map((item) => ({
      path: item.path as string,
      Component: PAGES[item.path],
    })).concat([
      {
        path: "apps/:id",
        Component: AppPage,
      },
      {
        path: "projects",
        Component: PAGES["/projects"],
      },
      {
        path: "projects/:id/editor",
        Component: PAGES["/create-app"],
      },
      {
        path: "projects/:id/versions",
        Component: PAGES["/create-app"],
      },
      {
        path: "projects/:id/settings",
        Component: PAGES["/create-app"],
      },
    ]),
  },
]);
