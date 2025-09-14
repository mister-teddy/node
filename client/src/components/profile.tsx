import { enabled3DModeAtom, adaptiveIs3DModeAtom } from "@/state/3d";
import { useAtomValue, useSetAtom } from "jotai";
import { hostAPI } from "@/libs/host-api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ChevronsUpDown, Monitor, RotateCcw } from "lucide-react";

export default function Profile() {
  const { isMobile } = useSidebar();
  const setEnabled3DMode = useSetAtom(enabled3DModeAtom);
  const is3D = useAtomValue(adaptiveIs3DModeAtom);

  const handleReset = async () => {
    try {
      await hostAPI.db.reset();
    } catch (error) {
      console.warn("Failed to reset server database:", error);
    }

    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.warn("Failed to clear browser storage:", error);
    }

    location.reload();
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">🐻</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Hồng Phát Nguyễn</span>
                <span className="truncate text-xs">Developer</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            {!is3D && (
              <>
                <DropdownMenuItem onClick={() => setEnabled3DMode(true)}>
                  <Monitor className="mr-2 h-4 w-4" />
                  3D Mode
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear Storage & Reload
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
