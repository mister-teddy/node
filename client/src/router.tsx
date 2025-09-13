import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "./pages/_layout";
import AppPage from "./pages/app";
import { PAGES } from "./pages";
import NotFound from "./pages/404";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    ErrorBoundary: NotFound,
    children: [
      {
        path: "/",
        Component: PAGES["/"],
      },
      {
        path: "/store",
        Component: PAGES["/store"],
      },
      {
        path: "/projects",
        Component: PAGES["/projects"],
      },
      {
        path: "/projects/create",
        Component: PAGES["/projects/create"],
      },
      {
        path: "apps/:id",
        Component: AppPage,
      },
      {
        path: "projects/:id/editor",
        Component: PAGES["/projects/:id/editor"],
      },
      {
        path: "projects/:id/versions",
        Component: PAGES["/projects/:id/editor"],
      },
      {
        path: "projects/:id/settings",
        Component: PAGES["/projects/:id/editor"],
      },
    ],
  },
]);
