import { useState, useEffect, type FC } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ProjectList } from "@/components/create-app/project-list";
import { CreateAppGenerator } from "@/components/create-app/create-app-generator";
import { AppProjectStorage } from "@/libs/app-projects";
import type { AppProject } from "@/types/app-project";

const ProjectsPage: FC = () => {
  const [projects, setProjects] = useState<AppProject[]>([]);
  const [showCreateApp, setShowCreateApp] = useState(false);
  const navigate = useNavigate();

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    const loadedProjects = AppProjectStorage.getAll();
    setProjects(loadedProjects);
  };


  const handleSelectProject = (project: AppProject) => {
    navigate(`/projects/${project.id}/editor`);
  };

  const handleDeleteProject = (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      AppProjectStorage.delete(id);
      loadProjects();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-4 pt-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          {!showCreateApp && (
            <Button onClick={() => setShowCreateApp(true)}>
              <span className="text-lg mr-1">✨</span>
              Create App
            </Button>
          )}
          {showCreateApp && (
            <Button 
              variant="outline" 
              onClick={() => setShowCreateApp(false)}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4">
        {showCreateApp ? (
          <div className="h-full overflow-auto">
            <div className="max-w-2xl mx-auto">
              <CreateAppGenerator />
            </div>
          </div>
        ) : (
          <div className="h-full overflow-auto">
            <ProjectList
              projects={projects}
              onSelectProject={handleSelectProject}
              onDeleteProject={handleDeleteProject}
              // Remove onDuplicateProject to remove clone feature
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;