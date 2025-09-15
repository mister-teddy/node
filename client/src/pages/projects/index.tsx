import { type FC } from "react";
import { ProjectList } from "@/components/project-list";

const ProjectsPage: FC = () => {
  return (
    <div className="px-6 pb-6">
      <ProjectList />
    </div>
  );
};

export default ProjectsPage;
