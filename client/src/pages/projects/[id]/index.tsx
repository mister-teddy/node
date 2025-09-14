import { type FC } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import { projectByIdAtom } from "@/state/app-ecosystem";
import NotFound from "@/pages/404";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
} from "@/components/ui";
import { Code, Settings, History } from "lucide-react";
import { ProjectEditor } from "./project-editor";
import { ProjectVersions } from "./project-versions";
import { ProjectSettings } from "./project-settings";
import { useCustomCrumb } from "@/hooks";

const ProjectDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const project = useAtomValue(projectByIdAtom(id));

  const navigate = useNavigate();
  useCustomCrumb(project?.name);

  const handleTabChange = (tab: string) => {
    if (id && tab !== currentTab) {
      navigate(`/projects/${id}/${tab}`);
    }
  };

  // Determine current tab from URL
  const currentTab = location.pathname.includes("/settings")
    ? "settings"
    : location.pathname.includes("/versions")
      ? "versions"
      : "editor";

  if (!project) {
    return <NotFound />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <Tabs
          value={currentTab}
          onValueChange={handleTabChange}
          className="h-full flex flex-col"
        >
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container max-w-screen-2xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl p-1.5 bg-muted/50 rounded-lg">
                      {project.icon}
                    </div>
                    <div>
                      <h1 className="text-xl font-bold tracking-tight">
                        {project.name}
                      </h1>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-xs">
                          v{project.currentVersion}
                        </Badge>
                        <Badge
                          variant={
                            project.status === "published"
                              ? "default"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="editor" className="gap-2">
                  <Code className="h-4 w-4" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="versions" className="gap-2">
                  <History className="h-4 w-4" />
                  Versions
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {[
              {
                value: "editor",
                content: <ProjectEditor />,
              },
              {
                value: "versions",
                content: <ProjectVersions />,
              },
              {
                value: "settings",
                content: <ProjectSettings />,
              },
            ].map(({ value, content }) => (
              <TabsContent key={value} value={value}>
                {content}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
