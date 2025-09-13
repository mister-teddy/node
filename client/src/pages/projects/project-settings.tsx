import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAtomValue } from "jotai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { projectByIdAtom } from "@/state/app-ecosystem";
import CONFIG from "@/config";
import toast from "react-hot-toast";
import type { AppProject } from "@/types/app-project";

export function ProjectSettings() {
  const { id } = useParams<{ id: string }>();
  const project = useAtomValue(projectByIdAtom(id || ""));
  const [isUpdating, setIsUpdating] = useState(false);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p>Loading project...</p>
        </div>
      </div>
    );
  }

  const handleInputChange = async (
    field: 'name' | 'description' | 'icon' | 'status',
    value: string,
  ) => {
    if (!project.id) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`${CONFIG.API.BASE_URL}/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      });

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
    handleInputChange('status', 'published');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">{project.icon}</span>
          App Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="app-name"
              className="block text-sm font-medium text-gray-700 mb-1"
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
            />
          </div>

          <div>
            <label
              htmlFor="app-icon"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Icon (Emoji)
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
              className="text-center text-2xl"
              maxLength={2}
              disabled={isUpdating}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="app-description"
            className="block text-sm font-medium text-gray-700 mb-1"
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
            placeholder="Describe what your app does"
            rows={3}
            disabled={isUpdating}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Version
            </label>
            <div className="p-2 bg-gray-50 rounded-md text-sm text-gray-600">
              v{project.currentVersion} ({project.versions.length} total versions)
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="flex gap-2">
              <Button
                variant={project.status === "draft" ? "default" : "outline"}
                size="sm"
                onClick={() => handleInputChange("status", "draft")}
                disabled={isUpdating}
              >
                Draft
              </Button>
              <Button
                variant={project.status === "published" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePublish()}
                disabled={isUpdating}
              >
                Publish
              </Button>
            </div>
          </div>
        </div>

        {project.originalPrompt && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Original Prompt
            </label>
            <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-600">
              {project.originalPrompt}
            </div>
          </div>
        )}

        {project.model && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              AI Model Used
            </label>
            <div className="p-2 bg-blue-50 rounded-md text-sm text-blue-700">
              {project.model}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}