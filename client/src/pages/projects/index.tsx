import { type FC } from "react";
import { ProjectList } from "@/components/project-list";

const ProjectsPage: FC = () => {
  return (
    <div className="container max-w-screen-2xl mx-auto px-6 py-6">
      <ProjectList />
    </div>
  );
};

export default ProjectsPage;
