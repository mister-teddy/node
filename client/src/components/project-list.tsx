import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/libs/utils";
import { useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import { projectsAtom } from "@/state/app-ecosystem";
import GridRenderer from "@/components/grid-renderer";
import { ProjectAPI } from "@/libs/projects";
import { Trash2 } from "lucide-react";

export function ProjectList() {
  const navigate = useNavigate();
  const projects = useAtomValue(projectsAtom);

  const handleDeleteProject = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (
      !confirm(
        "Are you sure you want to delete this project? All versions will be lost.",
      )
    )
      return;

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
      <div className="flex flex-col items-center justify-center py-24 px-4">
        <div className="text-6xl mb-6 opacity-60">📱</div>
        <h3 className="text-xl font-semibold mb-3">No projects yet</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Create your first app project to get started building amazing
          applications
        </p>
        <Button onClick={() => navigate("/projects/create")} size="lg">
          Create Your First App
        </Button>
      </div>
    );
  }

  return (
    <GridRenderer
      items={projects}
      keyExtractor={(project) => project.id}
      onClick={(project) => navigate(`/projects/${project.id}/editor`)}
      render={(project) => (
        <>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="text-3xl p-1 bg-muted/50 rounded-lg">
                {project.icon}
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base font-semibold leading-tight truncate">
                  {project.name}
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  Version {project.currentVersion}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => handleDeleteProject(project.id, e)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete project</span>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
            {project.description}
          </p>
          <div className="flex items-center justify-between">
            <Badge
              variant={project.status === "published" ? "default" : "secondary"}
              className="text-xs"
            >
              {project.status}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDate(project.updatedAt)}
            </span>
          </div>
        </>
      )}
    />
  );
}
