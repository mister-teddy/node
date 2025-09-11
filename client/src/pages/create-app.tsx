import { useState, useEffect, type FC } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppMetadataForm } from "@/components/create-app/app-metadata-form";
import { CodeEditor } from "@/components/create-app/code-editor";
import { VersionHistory } from "@/components/create-app/version-history";
import { CodeModifier } from "@/components/create-app/code-modifier";
import { AppProjectStorage } from "@/libs/app-projects";
import { modifyAppCodeStream, generateAppCodeStream } from "@/libs/anthropic";
import type { AppProject } from "@/types/app-project";
import toast from "react-hot-toast";

const CreateAppPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedProject, setSelectedProject] = useState<AppProject | null>(
    null,
  );
  const [isModifying, setIsModifying] = useState(false);
  const [streamingCode, setStreamingCode] = useState("");

  // Determine current tab from URL
  const currentTab = location.pathname.includes("/settings")
    ? "settings"
    : location.pathname.includes("/versions")
    ? "versions"
    : "editor";

  // Load project on mount and when ID changes
  useEffect(() => {
    if (id) {
      const project = AppProjectStorage.getById(id);
      if (project) {
        setSelectedProject(project);
        
        // Auto-generate if project has empty source code (newly created)
        if (!project.sourceCode.trim() && project.originalPrompt) {
          handleAutoGenerate(project);
        }
      } else {
        // Project not found, redirect to projects page
        navigate("/projects");
      }
    }
  }, [id, navigate]);

  const handleAutoGenerate = async (project: AppProject) => {
    if (!project.originalPrompt) return;
    
    setIsModifying(true);
    setStreamingCode("");

    try {
      const generatedCode = await generateAppCodeStream(
        project.originalPrompt,
        (status) => console.log("Status:", status),
        (token) => {
          setStreamingCode((prev) => prev + token);
        },
        project.model,
      );

      // Update the project with generated content
      const updatedProject = AppProjectStorage.update({
        id: project.id,
        sourceCode: generatedCode,
      });

      if (updatedProject) {
        setSelectedProject(updatedProject);
        toast.success("App generated successfully!");
      }
    } catch (error) {
      console.error("Failed to generate app:", error);
      toast.error("Failed to generate app");
    } finally {
      setIsModifying(false);
      setStreamingCode("");
    }
  };

  const handleUpdateProject = (updates: Partial<AppProject>) => {
    if (!selectedProject) return;

    const updatedProject = AppProjectStorage.update({
      id: selectedProject.id,
      ...updates,
    });

    if (updatedProject) {
      setSelectedProject(updatedProject);
    }
  };

  const handlePublishProject = () => {
    if (!selectedProject) return;

    handleUpdateProject({ status: "published" });
  };

  const handleModifyCode = async (modificationPrompt: string) => {
    if (!selectedProject) return;

    setIsModifying(true);
    setStreamingCode("");

    try {
      const modifiedCode = await modifyAppCodeStream(
        selectedProject.sourceCode,
        modificationPrompt,
        (status) => console.log("Status:", status),
        (token) => {
          setStreamingCode((prev) => prev + token);
        },
        selectedProject.model,
      );

      // Create new version with modified code
      const updatedProject = AppProjectStorage.createVersion(
        {
          projectId: selectedProject.id,
          modificationPrompt,
          model: selectedProject.model,
        },
        modifiedCode,
      );

      if (updatedProject) {
        setSelectedProject(updatedProject);
        toast.success(`Created version ${updatedProject.currentVersion}`);
      }
    } catch (error) {
      console.error("Failed to modify code:", error);
      toast.error("Failed to modify code");
    } finally {
      setIsModifying(false);
      setStreamingCode("");
    }
  };

  const handleSwitchVersion = (versionNumber: number) => {
    if (!selectedProject) return;

    const updatedProject = AppProjectStorage.switchToVersion(
      selectedProject.id,
      versionNumber,
    );

    if (updatedProject) {
      setSelectedProject(updatedProject);
      toast.success(`Switched to version ${versionNumber}`);
    } else {
      toast.error("Failed to switch version");
    }
  };

  const handleDeleteVersion = (versionNumber: number) => {
    if (!selectedProject) return;

    const updatedProject = AppProjectStorage.deleteVersion(
      selectedProject.id,
      versionNumber,
    );

    if (updatedProject) {
      setSelectedProject(updatedProject);
      toast.success(`Deleted version ${versionNumber}`);
    } else {
      toast.error("Cannot delete this version");
    }
  };

  const handleTabChange = (tab: string) => {
    if (id && tab !== currentTab) {
      navigate(`/projects/${id}/${tab}`);
    }
  };

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Loading project...</p>
        </div>
      </div>
    );
  }

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
                {selectedProject.name}
              </h1>
              <Button variant="outline" onClick={() => navigate("/projects")}>
                ← Back to Projects
              </Button>
            </div>

            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="versions">Versions</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden p-4">
            <TabsContent value="editor" className="h-full overflow-hidden">
              <div className="h-full flex flex-col gap-4">
                <CodeModifier
                  project={selectedProject}
                  onModifyCode={handleModifyCode}
                  isModifying={isModifying}
                />
                <div className="flex-1 overflow-hidden">
                  <CodeEditor
                    project={selectedProject}
                    onCodeChange={(code) =>
                      handleUpdateProject({ sourceCode: code })
                    }
                    isGenerating={isModifying}
                    streamingCode={streamingCode}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="versions" className="h-full overflow-auto">
              <VersionHistory
                project={selectedProject}
                onSwitchVersion={handleSwitchVersion}
                onDeleteVersion={handleDeleteVersion}
              />
            </TabsContent>

            <TabsContent value="settings" className="h-full overflow-auto">
              <div className="max-w-4xl mx-auto">
                <AppMetadataForm
                  project={selectedProject}
                  onUpdate={handleUpdateProject}
                  onPublish={handlePublishProject}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default CreateAppPage;
