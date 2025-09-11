import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import type { AppProject } from "@/types/app-project";

interface VersionHistoryProps {
  project: AppProject;
  onSwitchVersion: (versionNumber: number) => void;
  onDeleteVersion: (versionNumber: number) => void;
}

export function VersionHistory({
  project,
  onSwitchVersion,
  onDeleteVersion,
}: VersionHistoryProps) {
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);

  const sortedVersions = [...project.versions].sort((a, b) => b.versionNumber - a.versionNumber);

  const handleDeleteVersion = (versionNumber: number) => {
    if (confirm(`Are you sure you want to delete version ${versionNumber}?`)) {
      onDeleteVersion(versionNumber);
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
                      variant={version.versionNumber === project.currentVersion ? "default" : "outline"}
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
                        onClick={() => onSwitchVersion(version.versionNumber)}
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
                        onClick={() => handleDeleteVersion(version.versionNumber)}
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
                    onClick={() => setExpandedVersion(
                      expandedVersion === version.versionNumber ? null : version.versionNumber
                    )}
                    className="text-sm text-gray-700 hover:text-gray-900 transition-colors text-left"
                  >
                    <span className="font-medium">Prompt:</span> {
                      version.prompt.length > 100 && expandedVersion !== version.versionNumber
                        ? version.prompt.slice(0, 100) + "..."
                        : version.prompt
                    }
                  </button>
                </div>

                {expandedVersion === version.versionNumber && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Code Preview:</div>
                    <div className="bg-gray-100 rounded p-2 text-xs font-mono max-h-32 overflow-auto">
                      {version.sourceCode ? (
                        version.sourceCode.slice(0, 500) + 
                        (version.sourceCode.length > 500 ? "..." : "")
                      ) : (
                        <span className="text-gray-400">No code generated</span>
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