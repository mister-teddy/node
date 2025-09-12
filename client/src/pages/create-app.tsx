import { useEffect, type FC } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAtomValue } from "jotai";
import { ProjectLayout } from "@/components/create-app/project-layout";
import { EnhancedEditor } from "@/components/create-app/enhanced-editor";
import { projectByIdAtom } from "@/state/app-ecosystem";
import { ProjectVersions } from "@/components/create-app/project-versions";
import { ProjectSettings } from "@/components/create-app/project-settings";

const CreateAppPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedProject = useAtomValue(projectByIdAtom(id || ""));

  // Determine current tab from URL
  const currentTab = location.pathname.includes("/settings")
    ? "settings"
    : location.pathname.includes("/versions")
      ? "versions"
      : "editor";

  // Redirect if project not found
  useEffect(() => {
    if (id && selectedProject === null) {
      navigate("/projects");
    }
  }, [id, selectedProject, navigate]);

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
        editor: <EnhancedEditor />,
        versions: <ProjectVersions />,
        settings: <ProjectSettings />,
      }}
    </ProjectLayout>
  );
};

export default CreateAppPage;
