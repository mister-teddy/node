import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useAtomValue } from "jotai";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeModifier } from "@/components/create-app/code-modifier";
import AppRenderer from "@/components/app-renderer";
import { projectByIdAtom } from "@/state/app-ecosystem";
import toast from "react-hot-toast";

interface AppPreviewErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class AppPreviewErrorBoundary extends React.Component<
  { children: React.ReactNode },
  AppPreviewErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AppPreviewErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("AppRenderer error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-8 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              App Preview Error
            </h3>
            <p className="text-sm text-red-600 mb-3">
              The generated code contains errors and cannot be previewed.
            </p>
            <details className="text-xs text-red-500">
              <summary className="cursor-pointer hover:text-red-700">
                Show error details
              </summary>
              <pre className="mt-2 p-2 bg-red-100 rounded text-left whitespace-pre-wrap">
                {this.state.error?.message || "Unknown error"}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ProjectEditor() {
  const { id } = useParams<{ id: string }>();
  const project = useAtomValue(projectByIdAtom(id || ""));
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [isCodeExpanded, setIsCodeExpanded] = useState(false);
  const [showCodePanel, setShowCodePanel] = useState(false);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p>Loading project...</p>
        </div>
      </div>
    );
  }

  const detectLanguage = (code: string): string => {
    if (
      code.includes("import React") ||
      code.includes("export default") ||
      code.includes(".tsx")
    )
      return "tsx";
    if (
      code.includes("function ") ||
      code.includes("const ") ||
      code.includes("=>")
    )
      return "javascript";
    if (
      code.includes("interface ") ||
      code.includes("type ") ||
      code.includes(": string")
    )
      return "typescript";
    return "javascript";
  };

  const currentCode = project.sourceCode;

  // If there's no source code, show a message (this should be rare since server auto-generates)
  if (!currentCode.trim()) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-lg">No source code available</p>
          <p className="text-sm">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  if (isPreviewFullscreen) {
    return (
      <div className="h-full relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsPreviewFullscreen(false)}
          className="absolute top-4 right-4 z-10 bg-white shadow-md"
        >
          ← Exit Fullscreen
        </Button>
        <div className="h-full">
          <AppPreviewErrorBoundary>
            <AppRenderer
              app={{
                id: project.id,
                name: project.name,
                source_code: currentCode,
                description: project.description,
                icon: project.icon,
                price: project.price,
                version: project.version,
                installed: 1,
              }}
            />
          </AppPreviewErrorBoundary>
        </div>
      </div>
    );
  }

  // After generation is complete
  return (
    <div className="flex h-full">
      {/* Left Sidebar - Modify Code */}
      <div className="w-80 flex-shrink-0 border-r border-gray-200 p-4">
        <CodeModifier />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Live Preview - Takes 1/2 of the screen */}
        <div className={`${isCodeExpanded ? "h-1/2" : "flex-1"} min-h-0 p-4`}>
          <Card className="h-full">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Live Preview</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCodePanel(!showCodePanel)}
                  >
                    {showCodePanel ? "Hide Code" : "Show Code"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPreviewFullscreen(true)}
                  >
                    ⛶ Fullscreen
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              {currentCode && (
                <AppPreviewErrorBoundary>
                  <AppRenderer
                    app={{
                      id: project.id,
                      name: project.name,
                      source_code: currentCode,
                      description: project.description,
                      icon: project.icon,
                      price: project.price,
                      version: project.version,
                      installed: 1,
                    }}
                  />
                </AppPreviewErrorBoundary>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Source Code - Toggle panel */}
        {showCodePanel && (
          <div
            className={`${isCodeExpanded ? "h-1/2" : "h-48"} min-h-0 border-t border-gray-200 transition-all duration-300`}
          >
            <div className="h-full p-4">
              <Card className="h-full">
                <CardHeader className="flex-shrink-0 py-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Source Code</CardTitle>
                    <div className="flex gap-2">
                      {currentCode && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(currentCode);
                              toast.success("Code copied to clipboard!");
                            } catch (error) {
                              console.error("Failed to copy:", error);
                              toast.error("Failed to copy code");
                            }
                          }}
                        >
                          📋 Copy
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCodeExpanded(!isCodeExpanded)}
                      >
                        {isCodeExpanded ? "↓ Minimize" : "↑ Expand"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <div className="relative h-full">
                    <SyntaxHighlighter
                      language={detectLanguage(currentCode)}
                      style={tomorrow}
                      customStyle={{
                        margin: 0,
                        padding: "0.75rem",
                        fontSize: "0.75rem",
                        borderRadius: "0",
                        height: "100%",
                        overflow: "auto",
                      }}
                      wrapLongLines={true}
                      showLineNumbers={isCodeExpanded}
                    >
                      {currentCode}
                    </SyntaxHighlighter>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
