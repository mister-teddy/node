import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAtomValue } from "jotai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { projectByIdAtom } from "@/state/app-ecosystem";
import CONFIG from "@/config";
import toast from "react-hot-toast";
import {
  Settings,
  FileText,
  Tag,
  Globe,
  Bot,
  Palette,
  Save,
} from "lucide-react";

export function ProjectSettings() {
  const { id } = useParams<{ id: string }>();
  const project = useAtomValue(projectByIdAtom(id || ""));
  const [isUpdating, setIsUpdating] = useState(false);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <p>Loading project...</p>
        </div>
      </div>
    );
  }

  const handleInputChange = async (
    field: "name" | "description" | "icon" | "status",
    value: string,
  ) => {
    if (!project.id) return;

    setIsUpdating(true);
    try {
      const response = await fetch(
        `${CONFIG.API.BASE_URL}/api/projects/${project.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ [field]: value }),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to update project: ${response.status}`);
      }

      toast.success(`Updated ${field} successfully`);
      // Note: In a real app, you'd want to refresh the atom or use optimistic updates
      window.location.reload();
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
      toast.error(`Failed to update ${field}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePublish = () => {
    handleInputChange("status", "published");
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="px-6">
        <div className="pb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Basic Information
          </h3>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="app-name"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                App Name
              </label>
              <Input
                id="app-name"
                defaultValue={project.name}
                onBlur={(e) => {
                  if (e.target.value !== project.name) {
                    handleInputChange("name", e.target.value);
                  }
                }}
                placeholder="Enter app name"
                disabled={isUpdating}
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="app-icon"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Icon (Emoji)
                </div>
              </label>
              <Input
                id="app-icon"
                defaultValue={project.icon}
                onBlur={(e) => {
                  if (e.target.value !== project.icon) {
                    handleInputChange("icon", e.target.value);
                  }
                }}
                placeholder="📱"
                className="text-center text-xl h-10"
                maxLength={2}
                disabled={isUpdating}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="app-description"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Description
            </label>
            <Textarea
              id="app-description"
              defaultValue={project.description}
              onBlur={(e) => {
                if (e.target.value !== project.description) {
                  handleInputChange("description", e.target.value);
                }
              }}
              placeholder="Describe what your app does and its key features..."
              rows={4}
              disabled={isUpdating}
              className="resize-none"
            />
          </div>
        </div>
      </div>

      {/* Status and Version */}
      <div className="px-6">
        <div className="pb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Publication Settings
          </h3>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Current Version
              </label>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm">
                  v{project.currentVersion}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {project.versions.length}{" "}
                  {project.versions.length === 1 ? "version" : "versions"}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Publication Status
              </label>
              <div className="flex gap-2">
                <Button
                  variant={project.status === "draft" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleInputChange("status", "draft")}
                  disabled={isUpdating}
                  className="flex-1"
                >
                  {project.status === "draft" && (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  Draft
                </Button>
                <Button
                  variant={
                    project.status === "published" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => handlePublish()}
                  disabled={isUpdating}
                  className="flex-1"
                >
                  {project.status === "published" && (
                    <Globe className="h-4 w-4 mr-1" />
                  )}
                  Published
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      {(project.originalPrompt || project.model) && (
        <div className="px-6">
          <div className="pb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Generation Details
            </h3>
          </div>
          <div className="space-y-4">
            {project.originalPrompt && (
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Original Prompt
                </label>
                <div className="p-4 bg-muted/50 rounded-lg border text-sm leading-relaxed">
                  {project.originalPrompt}
                </div>
              </div>
            )}

            {project.model && (
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  AI Model Used
                </label>
                <div className="inline-flex items-center gap-2 p-2 bg-primary/10 text-primary rounded-lg text-sm">
                  <Bot className="h-4 w-4" />
                  {project.model}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
