import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "./pages/_layout";
import AppPage from "./pages/app";
import CONFIG from "./config";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: CONFIG.SIDEBAR_ITEMS.map((item) => ({
      path: item.path,
      Component: item.component,
    })).concat([
      {
        path: "apps/:id",
        Component: AppPage,
      },
    ]),
  },
]);
