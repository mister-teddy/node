import { type FC } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useAtomValue } from "jotai";
import { projectByIdAtom } from "@/state/app-ecosystem";
import { ProjectLayout } from "./project-layout";
import { ProjectEditor } from "./project-editor";
import { ProjectVersions } from "./project-versions";
import { ProjectSettings } from "./project-settings";
import NotFound from "@/pages/404";

const ProjectDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const selectedProject = useAtomValue(projectByIdAtom(id));

  // Determine current tab from URL
  const currentTab = location.pathname.includes("/settings")
    ? "settings"
    : location.pathname.includes("/versions")
      ? "versions"
      : "editor";

  if (!selectedProject) {
    return <NotFound />;
  }

  return (
    <ProjectLayout project={selectedProject} currentTab={currentTab}>
      {{
        editor: <ProjectEditor />,
        versions: <ProjectVersions />,
        settings: <ProjectSettings />,
      }}
    </ProjectLayout>
  );
};

export default ProjectDetailPage;
