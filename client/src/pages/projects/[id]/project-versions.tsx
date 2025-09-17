import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CardContent, CardFooter } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { useProjectDetail } from "./project-detail-context";
import toast from "react-hot-toast";
import { Code, Trash2, RotateCcw, Rocket, DollarSign } from "lucide-react";
import { miniServer } from "@/libs/mini-server";

export function ProjectVersions() {
  const { project, setCurrentCode } = useProjectDetail();
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);
  const [releasePrice, setReleasePrice] = useState<{ [key: number]: string }>(
    {},
  );
  const [isReleasing, setIsReleasing] = useState<number | null>(null);

  if (!project) {
    return (
      <>
        <CardContent>
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground text-sm">
              <p>Loading project...</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-3" />
      </>
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
      await miniServer.POST("/api/projects/{project_id}/release", {
        params: { path: { project_id: project.id } } as any,
        body: {
          price,
          version_number: versionNumber,
        },
      });
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
    <>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {sortedVersions.map((version) => {
            const isCurrent = version.versionNumber === project.currentVersion;
            const isExpanded = expandedVersion === version.versionNumber;

            return (
              <div
                key={version.id}
                className={`border rounded-lg p-3 transition-all duration-200 ${
                  isCurrent
                    ? "border-primary/50 bg-primary/5 shadow-sm"
                    : "border-border hover:shadow-sm hover:border-border/60"
                }`}
              >
                {/* Version Header */}
                <div className="flex flex-col mb-2">
                  <div className="flex justify-between items-center gap-2">
                    <Badge
                      variant={isCurrent ? "default" : "secondary"}
                      className="font-mono text-xs px-2 py-1"
                    >
                      v{version.versionNumber}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(version.createdAt, {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>

                {/* Prompt */}
                <div className="mb-2">
                  <button
                    onClick={() =>
                      setExpandedVersion(
                        isExpanded ? null : version.versionNumber,
                      )
                    }
                    className="w-full text-left p-2.5 bg-muted/50 rounded-md hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground mb-1">
                          Prompt{" "}
                          {version.model && (
                            <Badge variant="outline">
                              {version.model.replace("claude-3-", "")}
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground leading-snug">
                          {version.prompt.length > 200 && !isExpanded
                            ? version.prompt.slice(0, 200) + "..."
                            : version.prompt}
                        </p>
                      </div>
                      <div className="ml-2 pt-0.5">
                        <Code className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </div>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {!isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSwitchVersion(version.versionNumber)}
                      className="h-7 gap-1.5 px-2 flex-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Switch
                    </Button>
                  )}
                  {project.versions.length > 1 && !isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteVersion(version.versionNumber)}
                      className="h-7 px-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="space-y-3 pt-2 border-t">
                    {/* Code Preview */}
                    {version.sourceCode && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Code className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium">
                            Source Code
                          </span>
                        </div>
                        <div className="bg-muted/30 rounded-md p-3 text-xs font-mono max-h-32 overflow-auto border">
                          <pre className="whitespace-pre-wrap text-foreground leading-tight">
                            {version.sourceCode.slice(0, 800) +
                              (version.sourceCode.length > 800
                                ? "\n\n..."
                                : "")}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Release Section */}
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-md p-3 border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Rocket className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-xs font-medium text-emerald-900 dark:text-emerald-100">
                          Release as App
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <DollarSign className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
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
                            className="pl-8 h-8 w-20 text-xs"
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
                          className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3 flex-1"
                        >
                          {isReleasing === version.versionNumber ? (
                            <div className="flex items-center gap-1.5">
                              <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span className="text-xs">Releasing...</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <Rocket className="h-3 w-3" />
                              <span className="text-xs">Release</span>
                            </div>
                          )}
                        </Button>
                      </div>
                      {!version.sourceCode && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center gap-1.5">
                          <Code className="h-3.5 w-3.5" />
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
      </CardContent>

      <CardFooter className="pt-0" />
    </>
  );
}
