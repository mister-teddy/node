import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "./pages/_layout";
import AppPage from "./pages/app";
import CONFIG from "./config";
import { PAGES } from "./pages";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: CONFIG.SIDEBAR_ITEMS.map((item) => ({
      path: item.path as string,
      Component: PAGES[item.path],
    })).concat([
      {
        path: "apps/:id",
        Component: AppPage,
      },
    ]),
  },
]);
