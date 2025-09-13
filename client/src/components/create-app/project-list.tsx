import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/libs/utils";
import { useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import { projectsAtom } from "@/state/app-ecosystem";
import GridRenderer from "@/components/grid-renderer";
import { ProjectAPI } from "@/libs/projects";

export function ProjectList() {
  const navigate = useNavigate();
  const projects = useAtomValue(projectsAtom);

  const handleDeleteProject = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm("Are you sure you want to delete this project? All versions will be lost.")) return;

    try {
      await ProjectAPI.deleteProject(id);
      // Refresh projects list
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete project:", error);
      alert("Failed to delete project. Please try again.");
    }
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📱</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No projects yet
        </h3>
        <p className="text-gray-500">
          Create your first app project to get started
        </p>
      </div>
    );
  }

  return (
    <GridRenderer
      items={projects}
      keyExtractor={(project) => project.id}
      render={(project) => (
        <div>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{project.icon}</span>
                <div>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription className="text-sm">
                    v{project.version}
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleDeleteProject(project.id, e)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                >
                  🗑️
                </Button>
                <button
                  type="button"
                  className="text-blue-600 font-bold text-sm ml-2 bg-bg rounded-full px-4 py-1"
                  onClick={() => navigate(`/projects/${project.id}/editor`)}
                >
                  Load
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-gray-600 mb-3 line-clamp-2 h-10">
              {project.description}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span
                className={`px-2 py-1 rounded-full ${
                  project.status === "published"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {project.status}
              </span>
              <span>{formatDate(project.updatedAt)}</span>
            </div>
          </CardContent>
        </div>
      )}
    />
  );
}
