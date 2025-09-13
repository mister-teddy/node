import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProjectAPI, type ProjectVersion } from "@/libs/projects";
import { formatDate } from "@/libs/utils";

interface VersionControlProps {
  projectId: string;
  onVersionCreate?: (version: ProjectVersion) => void;
}

export function VersionControl({ projectId, onVersionCreate }: VersionControlProps) {
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showNewVersionForm, setShowNewVersionForm] = useState(false);
  const [newVersion, setNewVersion] = useState({
    prompt: "",
    source_code: "",
    model: "",
  });

  useEffect(() => {
    loadVersions();
  }, [projectId]);

  const loadVersions = async () => {
    try {
      const versionList = await ProjectAPI.getVersions(projectId);
      setVersions(versionList.sort((a, b) => b.version_number - a.version_number));
    } catch (error) {
      console.error("Failed to load versions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVersion = async () => {
    if (!newVersion.prompt.trim() || !newVersion.source_code.trim()) {
      alert("Please provide both prompt and source code");
      return;
    }

    setIsCreating(true);
    try {
      const version = await ProjectAPI.createVersion(projectId, {
        prompt: newVersion.prompt,
        source_code: newVersion.source_code,
        model: newVersion.model || undefined,
      });

      await loadVersions(); // Refresh versions list
      onVersionCreate?.(version);
      
      // Reset form
      setNewVersion({ prompt: "", source_code: "", model: "" });
      setShowNewVersionForm(false);
      
    } catch (error) {
      console.error("Failed to create version:", error);
      alert("Failed to create version. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return <div>Loading versions...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Version History</h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowNewVersionForm(!showNewVersionForm)}
        >
          {showNewVersionForm ? "Cancel" : "+ New Version"}
        </Button>
      </div>

      {showNewVersionForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create New Version</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Prompt</label>
              <Textarea
                placeholder="Describe the changes or improvements for this version..."
                value={newVersion.prompt}
                onChange={(e) =>
                  setNewVersion({ ...newVersion, prompt: e.target.value })
                }
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Source Code</label>
              <Textarea
                placeholder="Paste the complete source code for this version..."
                value={newVersion.source_code}
                onChange={(e) =>
                  setNewVersion({ ...newVersion, source_code: e.target.value })
                }
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Model (optional)</label>
              <Input
                placeholder="e.g., claude-3-haiku-20240307"
                value={newVersion.model}
                onChange={(e) =>
                  setNewVersion({ ...newVersion, model: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline"
                onClick={() => setShowNewVersionForm(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateVersion} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Version"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {versions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No versions yet. Create your first version to get started.
          </p>
        ) : (
          versions.map((version) => (
            <Card key={version.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">
                      Version {version.version_number}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {formatDate(new Date(version.created_at))}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {version.model && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {version.model}
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        // TODO: Load this version into editor
                        console.log("Load version", version.version_number);
                      }}
                    >
                      Load
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={async () => {
                        try {
                          await ProjectAPI.convertToApp(projectId, {
                            version: version.version_number,
                            price: 0,
                          });
                          alert(`Version ${version.version_number} converted to app successfully!`);
                        } catch (error) {
                          console.error("Failed to convert to app:", error);
                          alert("Failed to convert to app. Please try again.");
                        }
                      }}
                    >
                      📱 Publish
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-2">{version.prompt}</p>
                {version.source_code && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                      View Source Code ({version.source_code.length} chars)
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto max-h-40">
                      {version.source_code}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}