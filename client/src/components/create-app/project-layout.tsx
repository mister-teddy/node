import { type FC, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AppProject } from "@/types/app-project";

interface ProjectLayoutProps {
  project: AppProject;
  currentTab: string;
  children: {
    editor?: ReactNode;
    versions?: ReactNode;
    settings?: ReactNode;
  };
}

export const ProjectLayout: FC<ProjectLayoutProps> = ({
  project,
  currentTab,
  children,
}) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const handleTabChange = (tab: string) => {
    if (id && tab !== currentTab) {
      navigate(`/projects/${id}/${tab}`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <Tabs
          value={currentTab}
          onValueChange={handleTabChange}
          className="h-full flex flex-col"
        >
          <div className="flex-shrink-0 px-4 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {project.name}
              </h1>
              <Button
                variant="outline"
                onClick={() => navigate("/projects")}
              >
                ← Back to Projects
              </Button>
            </div>

            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="versions">Versions</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="editor" className="h-full">
              {children.editor}
            </TabsContent>

            <TabsContent value="versions" className="h-full overflow-auto p-4">
              {children.versions}
            </TabsContent>

            <TabsContent value="settings" className="h-full overflow-auto p-4">
              <div className="max-w-4xl mx-auto">
                {children.settings}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};