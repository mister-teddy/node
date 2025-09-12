import { useState, useEffect, type FC } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ProjectLayout } from "@/components/create-app/project-layout";
import { AppMetadataForm } from "@/components/create-app/app-metadata-form";
import { EnhancedEditor } from "@/components/create-app/enhanced-editor";
import { VersionHistory } from "@/components/create-app/version-history";
import { AppProjectStorage } from "@/libs/app-projects";
import { modifyAppCodeStream, generateAppWithMetadata } from "@/libs/anthropic";
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
      const result = await generateAppWithMetadata(
        project.originalPrompt,
        project.model,
        () => {}, // Usage callback not needed here
      );

      // Update the project with generated content and metadata
      const updatedProject = AppProjectStorage.update({
        id: project.id,
        name: result.metadata.name,
        description: result.metadata.description,
        icon: result.metadata.icon,
        price: result.metadata.price,
        version: result.metadata.version,
        sourceCode: result.sourceCode,
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
    <ProjectLayout project={selectedProject} currentTab={currentTab}>
      {{
        editor: (
          <EnhancedEditor
            project={selectedProject}
            onCodeChange={(code) =>
              handleUpdateProject({ sourceCode: code })
            }
            onModifyCode={handleModifyCode}
            isGenerating={isModifying}
            streamingCode={streamingCode}
          />
        ),
        versions: (
          <VersionHistory
            project={selectedProject}
            onSwitchVersion={handleSwitchVersion}
            onDeleteVersion={handleDeleteVersion}
          />
        ),
        settings: (
          <AppMetadataForm
            project={selectedProject}
            onUpdate={handleUpdateProject}
            onPublish={handlePublishProject}
          />
        ),
      }}
    </ProjectLayout>
  );
};

export default CreateAppPage;
