import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { useProjectDetail } from "./project-detail-context";
import CONFIG from "@/config";
import toast from "react-hot-toast";
import {
  History,
  Clock,
  Code,
  Trash2,
  RotateCcw,
  Rocket,
  DollarSign,
} from "lucide-react";

export function ProjectVersions() {
  const { project, setCurrentCode } = useProjectDetail();
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);
  const [releasePrice, setReleasePrice] = useState<{ [key: number]: string }>(
    {},
  );
  const [isReleasing, setIsReleasing] = useState<number | null>(null);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground text-sm">
          <p>Loading project...</p>
        </div>
      </div>
    );
  }

  const sortedVersions = [...project.versions].sort(
    (a, b) => b.versionNumber - a.versionNumber,
  );

  const handleSwitchVersion = (versionNumber: number) => {
    const selectedVersion = project?.versions.find(
      (v) => v.versionNumber === versionNumber,
    );
    if (selectedVersion?.sourceCode) {
      setCurrentCode(selectedVersion.sourceCode);
      toast.success(`Switched to version ${versionNumber}`);
    } else {
      toast.error("No source code available for this version");
    }
  };

  const handleDeleteVersion = (versionNumber: number) => {
    if (confirm(`Are you sure you want to delete version ${versionNumber}?`)) {
      // TODO: Implement version deletion functionality
      console.log("Delete version:", versionNumber);
    }
  };

  const handleReleaseVersion = async (versionNumber: number) => {
    if (!project.id) return;
    const price = parseFloat(releasePrice[versionNumber] || "0");
    setIsReleasing(versionNumber);
    try {
      const response = await fetch(
        `${CONFIG.API.BASE_URL}/api/projects/${project.id}/release`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            version_number: versionNumber,
            price: price > 0 ? price : undefined,
          }),
        },
      );
      if (!response.ok)
        throw new Error(`Failed to release version: ${response.status}`);
      toast.success(`Version ${versionNumber} released successfully!`);
      setReleasePrice((prev) => ({ ...prev, [versionNumber]: "" }));
    } catch (error) {
      console.error("Failed to release version:", error);
      toast.error("Failed to release version");
    } finally {
      setIsReleasing(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <History className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Version History
            </h2>
            <p className="text-sm text-muted-foreground">
              {project.versions.length}{" "}
              {project.versions.length === 1 ? "version" : "versions"}
            </p>
          </div>
        </div>
        <Badge variant="default" className="text-sm px-3 py-1">
          Current: v{project.currentVersion}
        </Badge>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-3">
          {sortedVersions.map((version) => {
            const isCurrent = version.versionNumber === project.currentVersion;
            const isExpanded = expandedVersion === version.versionNumber;

            return (
              <div
                key={version.id}
                className={`border rounded-lg p-4 transition-all duration-200 ${
                  isCurrent
                    ? "border-primary/50 bg-primary/5 shadow-sm"
                    : "border-border hover:shadow-sm hover:border-border/60"
                }`}
              >
                  {/* Version Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={isCurrent ? "default" : "secondary"}
                        className="font-mono text-sm px-2.5 py-1"
                      >
                        v{version.versionNumber}
                      </Badge>
                      {isCurrent && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(version.createdAt, {
                          addSuffix: true,
                        })}
                      </span>
                      {version.model && (
                        <Badge variant="outline" className="text-xs bg-muted">
                          {version.model.replace("claude-3-", "")}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!isCurrent && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleSwitchVersion(version.versionNumber)
                          }
                          className="h-8 gap-2"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Switch
                        </Button>
                      )}
                      {project.versions.length > 1 && !isCurrent && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDeleteVersion(version.versionNumber)
                          }
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Prompt */}
                  <div className="mb-3">
                    <button
                      onClick={() =>
                        setExpandedVersion(
                          isExpanded ? null : version.versionNumber,
                        )
                      }
                      className="w-full text-left p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground mb-1">
                            Prompt
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {version.prompt.length > 200 && !isExpanded
                              ? version.prompt.slice(0, 200) + "..."
                              : version.prompt}
                          </p>
                        </div>
                        <div className="ml-2 pt-1">
                          <Code className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="space-y-4 pt-3 border-t">
                      {/* Code Preview */}
                      {version.sourceCode && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Code className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              Source Code
                            </span>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-4 text-xs font-mono max-h-40 overflow-auto border">
                            <pre className="whitespace-pre-wrap text-foreground">
                              {version.sourceCode.slice(0, 800) +
                                (version.sourceCode.length > 800
                                  ? "\n\n..."
                                  : "")}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Release Section */}
                      <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center gap-2 mb-3">
                          <Rocket className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                            Release as App
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={releasePrice[version.versionNumber] || ""}
                              onChange={(e) =>
                                setReleasePrice((prev) => ({
                                  ...prev,
                                  [version.versionNumber]: e.target.value,
                                }))
                              }
                              className="pl-10 h-9 w-24 text-sm"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleReleaseVersion(version.versionNumber)
                            }
                            disabled={
                              isReleasing === version.versionNumber ||
                              !version.sourceCode
                            }
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-4"
                          >
                            {isReleasing === version.versionNumber ? (
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Releasing...
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Rocket className="h-3 w-3" />
                                Release
                              </div>
                            )}
                          </Button>
                        </div>
                        {!version.sourceCode && (
                          <div className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            No source code available - cannot release
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
