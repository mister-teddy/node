import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAtomValue } from "jotai";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { projectByIdAtom } from "@/state/app-ecosystem";
import CONFIG from "@/config";
import toast from "react-hot-toast";
import { History, Clock, Code, Trash2, RotateCcw, Rocket, DollarSign } from "lucide-react";

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-muted/50 rounded-lg">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Version History</h2>
            <p className="text-sm text-muted-foreground">
              {project.versions.length} {project.versions.length === 1 ? 'version' : 'versions'} created
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          Current: v{project.currentVersion}
        </Badge>
      </div>

      <div className="space-y-3">
        {sortedVersions.map((version) => (
          <Card
            key={version.id}
            className={`transition-all duration-200 hover:shadow-md ${
              version.versionNumber === project.currentVersion
                ? "ring-2 ring-primary/20 bg-primary/5"
                : "hover:bg-muted/30"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        version.versionNumber === project.currentVersion
                          ? "default"
                          : "outline"
                      }
                      className="font-mono"
                    >
                      v{version.versionNumber}
                    </Badge>
                    {version.versionNumber === project.currentVersion && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Clock className="h-3 w-3" />
                        Current
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {version.versionNumber !== project.currentVersion && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSwitchVersion(version.versionNumber)}
                      className="gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
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
                        className="gap-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Clock className="h-4 w-4" />
                <span>{formatDistanceToNow(version.createdAt, { addSuffix: true })}</span>
                {version.model && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="text-xs bg-muted px-2 py-1 rounded">
                      {version.model}
                    </span>
                  </>
                )}
              </div>

              <div className="mb-3">
                <button
                  onClick={() =>
                    setExpandedVersion(
                      expandedVersion === version.versionNumber
                        ? null
                        : version.versionNumber,
                    )
                  }
                  className="text-sm text-left w-full p-2.5 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <span className="font-medium text-foreground">Prompt:</span>
                  <p className="mt-1 text-muted-foreground leading-relaxed">
                    {version.prompt.length > 150 &&
                    expandedVersion !== version.versionNumber
                      ? version.prompt.slice(0, 150) + "..."
                      : version.prompt}
                  </p>
                </button>
              </div>

              {expandedVersion === version.versionNumber && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium mb-3">
                      <Code className="h-4 w-4" />
                      Code Preview
                    </div>
                    <div className="bg-muted/80 rounded-lg p-4 text-xs font-mono max-h-40 overflow-auto border">
                      {version.sourceCode ? (
                        <pre className="whitespace-pre-wrap">
                          {version.sourceCode.slice(0, 800) +
                          (version.sourceCode.length > 800 ? "\n\n..." : "")}
                        </pre>
                      ) : (
                        <span className="text-muted-foreground italic">No code generated</span>
                      )}
                    </div>
                  </div>

                  {/* Release Version Section */}
                  <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-green-800 mb-3">
                        <Rocket className="h-4 w-4" />
                        Release as App
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={releasePrice[version.versionNumber] || ''}
                            onChange={(e) => setReleasePrice(prev => ({
                              ...prev,
                              [version.versionNumber]: e.target.value
                            }))}
                            className="pl-6 h-8 w-24 text-xs"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleReleaseVersion(version.versionNumber)}
                          disabled={isReleasing === version.versionNumber || !version.sourceCode}
                          className="gap-1 bg-green-600 hover:bg-green-700"
                        >
                          {isReleasing === version.versionNumber ? (
                            <>Loading...</>
                          ) : (
                            <>
                              <Rocket className="h-3 w-3" />
                              Release
                            </>
                          )}
                        </Button>
                      </div>
                      {!version.sourceCode && (
                        <div className="text-xs text-destructive mt-2 flex items-center gap-1">
                          <Code className="h-3 w-3" />
                          No source code available - cannot release
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}