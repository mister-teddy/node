import { type FC, useMemo } from "react";
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
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { Code, Settings, History } from "lucide-react";
import { ProjectEditor } from "./project-editor";
import { ProjectVersions } from "./project-versions";
import { ProjectSettings } from "./project-settings";
import { ProjectDetailProvider } from "./project-detail-context";
import { useCustomCrumb } from "@/hooks";
import ProjectPreview from "./project-previewer";

const ProjectDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const project = useAtomValue(projectByIdAtom(id));

  const navigate = useNavigate();
  useCustomCrumb(
    project ? (
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center w-6 h-6 rounded bg-muted">
          {project.icon}
        </span>
        <span>{project.name}</span>

        <Badge variant="secondary" className="text-xs">
          v{project.currentVersion}
        </Badge>
        <Badge
          variant={project.status === "published" ? "default" : "outline"}
          className="text-xs"
        >
          {project.status}
        </Badge>
      </div>
    ) : undefined,
  );

  // Calculate initial code from current version
  const initialCode = useMemo(() => {
    if (!project) return "";
    const currentVersionData = project.versions.find(
      (v) => v.versionNumber === project.currentVersion,
    );
    return currentVersionData?.sourceCode || "";
  }, [project]);

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

  const TABS = [
    {
      key: "editor",
      label: "Editor",
      icon: <Code className="h-4 w-4" />,
      description: "Edit the project's source code.",
      content: <ProjectEditor />,
    },
    {
      key: "versions",
      label: "Versions",
      icon: <History className="h-4 w-4" />,
      description: "View and manage previous versions of this project.",
      content: <ProjectVersions />,
      action: <Badge>Current: v{project.currentVersion}</Badge>,
    },
    {
      key: "settings",
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
      description: "Configure project settings and preferences.",
      content: <ProjectSettings />,
    },
  ];

  return (
    <ProjectDetailProvider project={project} initialCode={initialCode}>
      <div className="flex flex-col md:flex-row flex-1 min-h-0 gap-6 overflow-hidden px-6 pb-6">
        {/* Left Side - Modify Code with Code Preview */}
        <div className="w-96 flex-shrink-0 flex flex-col space-y-6 overflow-hidden">
          {/* Modify Code Panel */}
          <Tabs
            value={currentTab}
            onValueChange={handleTabChange}
            className="h-full flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-3">
              {TABS.map(({ key, label, icon }) => (
                <TabsTrigger key={key} value={key} className="gap-2">
                  {icon}
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <Card className="flex-1 overflow-y-auto">
              {TABS.map(
                ({ key, label, description, icon, content, action }) => (
                  <TabsContent key={key} value={key}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-muted rounded-lg">{icon}</div>
                          <div>
                            <CardTitle className="mb-1">{label}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                          </div>
                        </div>
                        {action}
                      </div>
                    </CardHeader>
                    {content}
                  </TabsContent>
                ),
              )}
            </Card>
          </Tabs>
        </div>

        {/* Right Side - Live Preview takes all remaining space */}
        <Card className="flex-1">
          <ProjectPreview />
        </Card>
      </div>
    </ProjectDetailProvider>
  );
};

export default ProjectDetailPage;
