import * as React from "react";
import { Suspense, useEffect, useRef } from "react";
import { useAtomValue } from "jotai";
import { adaptiveIs3DModeAtom, windowsStatesAtom } from "@/state/3d";
import LayoutManager3D from "@/components/3d/layout-manager";
import Spinner from "@/components/spinner";
import {
  Outlet,
  useNavigate,
  useLocation,
  Link,
  useMatches,
  type UIMatch,
} from "react-router-dom";
import { useAtomCallback } from "jotai/utils";
import Profile from "@/components/profile";
import CONFIG from "@/config";

// New UI imports
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  Sidebar,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarHeader,
  SidebarContent,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { customCrumbState } from "@/router";

// Layout wrapper that contains 3D/2D layout logic - used by individual pages
export default function RootLayout() {
  const matches = useMatches() as UIMatch<
    unknown,
    { crumb?: string; actions?: React.ReactNode[] } | undefined
  >[];
  const is3DMode = useAtomValue(adaptiveIs3DModeAtom);
  const navigate = useNavigate();
  const getWindows = useAtomCallback((get) => get(windowsStatesAtom));
  const isInitialMount = useRef(true);
  const location = useLocation();
  const customCrumb = useAtomValue(customCrumbState);

  useEffect(() => {
    // Skip navigation on initial mount to prevent redirect on page reload
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!is3DMode) {
      // If switching to 2D mode, navigate to window path
      const lastWindow = getWindows().at(-1);
      const path = CONFIG.SIDEBAR_ITEMS.find(
        (item) => item.title === lastWindow?.title,
      )?.path;
      if (path) {
        navigate(path);
      }
    } else {
      // If switching to 3D mode, go to dashboard
      navigate("/");
    }
  }, [is3DMode]);

  if (is3DMode) {
    return (
      <Suspense fallback={<Spinner />}>
        <LayoutManager3D />
      </Suspense>
    );
  }

  // Build breadcrumb from matches
  const breadcrumbs = matches
    .filter((match) => Boolean(match.handle?.crumb))
    .map((match) => ({
      title: match.handle?.crumb,
      path: match.pathname,
    }))
    .concat(
      customCrumb
        ? [
            {
              title: customCrumb,
              path: location.pathname,
            },
          ]
        : [],
    );

  // Build actions from current route handle
  const actions = matches.at(-1)?.handle?.actions ?? [];

  // Sidebar component using dynamic CONFIG.SIDEBAR_ITEMS
  function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
    return (
      <Sidebar variant="inset" {...props}>
        <SidebarHeader>
          <Profile />
        </SidebarHeader>
        <SidebarContent>
          {/* You can add additional sidebar content/components here if needed */}
          <SidebarSeparator className="mx-0" />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            {CONFIG.SIDEBAR_ITEMS.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === item.path}
                >
                  <Link to={item.path}>
                    <span className="mr-2 text-lg">{item.icon}</span>
                    {item.title}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            {breadcrumbs.length > 0 && (
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.path}>
                      <BreadcrumbItem>
                        {index === breadcrumbs.length - 1 ? (
                          <BreadcrumbPage className="line-clamp-1">
                            {crumb.title}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link to={crumb.path} className="line-clamp-1">
                              {crumb.title}
                            </Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbs.length - 1 && (
                        <BreadcrumbSeparator />
                      )}
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2 px-3">
            {actions.map((action, index) => (
              <div key={index}>{action}</div>
            ))}
            <ModeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Suspense
            fallback={
              <>
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                  <div className="bg-muted/50 aspect-video rounded-xl" />
                  <div className="bg-muted/50 aspect-video rounded-xl" />
                  <div className="bg-muted/50 aspect-video rounded-xl" />
                </div>
                <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
              </>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
