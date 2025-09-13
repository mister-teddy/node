import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAtomValue } from "jotai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { projectByIdAtom } from "@/state/app-ecosystem";
import CONFIG from "@/config";
import toast from "react-hot-toast";

export function ProjectVersions() {
  const { id } = useParams<{ id: string }>();
  const project = useAtomValue(projectByIdAtom(id || ""));
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);
  const [releasePrice, setReleasePrice] = useState<{[key: number]: string}>({});
  const [isReleasing, setIsReleasing] = useState<number | null>(null);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p>Loading project...</p>
        </div>
      </div>
    );
  }

  const sortedVersions = [...project.versions].sort(
    (a, b) => b.versionNumber - a.versionNumber,
  );

  const handleSwitchVersion = (versionNumber: number) => {
    console.log("Switch to version:", versionNumber);
    // TODO: Implement version switching functionality
  };

  const handleDeleteVersion = (versionNumber: number) => {
    if (confirm(`Are you sure you want to delete version ${versionNumber}?`)) {
      console.log("Delete version:", versionNumber);
      // TODO: Implement version deletion functionality
    }
  };

  const handleReleaseVersion = async (versionNumber: number) => {
    if (!project.id) return;

    const price = parseFloat(releasePrice[versionNumber] || "0");

    setIsReleasing(versionNumber);
    try {
      const response = await fetch(`${CONFIG.API.BASE_URL}/api/projects/${project.id}/release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version_number: versionNumber,
          price: price > 0 ? price : undefined
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to release version: ${response.status}`);
      }

      toast.success(`Version ${versionNumber} released successfully!`);
      // Reset price input
      setReleasePrice(prev => ({...prev, [versionNumber]: ''}));
    } catch (error) {
      console.error('Failed to release version:', error);
      toast.error('Failed to release version');
    } finally {
      setIsReleasing(null);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          🕒 Version History
          <Badge variant="secondary">{project.versions.length} versions</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-2 p-4">
            {sortedVersions.map((version) => (
              <div
                key={version.id}
                className={`border rounded-lg p-3 transition-colors ${
                  version.versionNumber === project.currentVersion
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        version.versionNumber === project.currentVersion
                          ? "default"
                          : "outline"
                      }
                      className="text-xs"
                    >
                      v{version.versionNumber}
                    </Badge>
                    {version.versionNumber === project.currentVersion && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {version.versionNumber !== project.currentVersion && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSwitchVersion(version.versionNumber)}
                        className="text-xs h-6 px-2"
                      >
                        Switch
                      </Button>
                    )}
                    {project.versions.length > 1 &&
                      version.versionNumber !== project.currentVersion && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDeleteVersion(version.versionNumber)
                          }
                          className="text-xs h-6 px-2 text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      )}
                  </div>
                </div>

                <div className="text-sm text-gray-600 mb-2">
                  {formatDistanceToNow(version.createdAt, { addSuffix: true })}
                  {version.model && (
                    <span className="ml-2 text-xs text-gray-400">
                      • {version.model}
                    </span>
                  )}
                </div>

                <div className="mb-2">
                  <button
                    onClick={() =>
                      setExpandedVersion(
                        expandedVersion === version.versionNumber
                          ? null
                          : version.versionNumber,
                      )
                    }
                    className="text-sm text-gray-700 hover:text-gray-900 transition-colors text-left"
                  >
                    <span className="font-medium">Prompt:</span>{" "}
                    {version.prompt.length > 100 &&
                    expandedVersion !== version.versionNumber
                      ? version.prompt.slice(0, 100) + "..."
                      : version.prompt}
                  </button>
                </div>

                {expandedVersion === version.versionNumber && (
                  <div className="mt-2 pt-2 border-t border-gray-200 space-y-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        Code Preview:
                      </div>
                      <div className="bg-gray-100 rounded p-2 text-xs font-mono max-h-32 overflow-auto">
                        {version.sourceCode ? (
                          version.sourceCode.slice(0, 500) +
                          (version.sourceCode.length > 500 ? "..." : "")
                        ) : (
                          <span className="text-gray-400">No code generated</span>
                        )}
                      </div>
                    </div>

                    {/* Release Version Section */}
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <div className="text-xs font-medium text-green-800 mb-2">
                        Release as App
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Price (USD)"
                          value={releasePrice[version.versionNumber] || ''}
                          onChange={(e) => setReleasePrice(prev => ({
                            ...prev,
                            [version.versionNumber]: e.target.value
                          }))}
                          className="text-xs h-6 w-20"
                          min="0"
                          step="0.01"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleReleaseVersion(version.versionNumber)}
                          disabled={isReleasing === version.versionNumber || !version.sourceCode}
                          className="text-xs h-6 bg-green-600 hover:bg-green-700"
                        >
                          {isReleasing === version.versionNumber ? 'Releasing...' : 'Release'}
                        </Button>
                      </div>
                      {!version.sourceCode && (
                        <div className="text-xs text-red-600 mt-1">
                          No source code available - cannot release
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}