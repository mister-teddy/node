import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/libs/utils";
import { useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import { projectsAtom } from "@/state/app-ecosystem";
import CONFIG from "@/config";

interface ProjectListProps {
  selectedProjectId?: string;
}

export function ProjectList({ selectedProjectId }: ProjectListProps) {
  const navigate = useNavigate();
  const projects = useAtomValue(projectsAtom);

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      // Find the project by id
      const project = projects.find((p) => p.id === id);
      if (!project) return;

      const response = await fetch(`${CONFIG.API.BASE_URL}/api/db/apps/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Refresh projects list
        window.location.reload(); // Simple refresh for now
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card
          key={project.id}
          className={`cursor-pointer transition-colors hover:bg-gray-50 ${
            selectedProjectId === project.id ? "ring-2 ring-blue-500" : ""
          }`}
          onClick={() => {
            navigate(`/projects/${project.id}/editor`);
          }}
        >
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(project.id);
                  }}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                >
                  🗑️
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
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
        </Card>
      ))}
    </div>
  );
}
