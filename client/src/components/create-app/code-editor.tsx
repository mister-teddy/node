import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AppRenderer from "@/components/app-renderer";
import type { AppProject } from "@/types/app-project";
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

interface CodeEditorProps {
  project: AppProject;
  onCodeChange: (code: string) => void;
  showPreview?: boolean;
  isGenerating?: boolean;
  streamingCode?: string;
}

export function CodeEditor({
  project,
  onCodeChange,
  showPreview = true,
  isGenerating = false,
  streamingCode = "",
}: CodeEditorProps) {
  // Mark as used for future implementation
  void onCodeChange;
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

  const currentCode = isGenerating ? streamingCode : project.sourceCode;

  if (!currentCode && !isGenerating) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-4">💻</div>
            <p>No code generated yet</p>
            <p className="text-sm">Generate code to see it here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
      {/* Code View */}
      <Card className="flex flex-col h-full overflow-y-auto">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Source Code</CardTitle>
            {!isGenerating && currentCode && (
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
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <div className="relative h-full">
            <SyntaxHighlighter
              language={detectLanguage(currentCode)}
              style={tomorrow}
              customStyle={{
                margin: 0,
                padding: "1rem",
                fontSize: "0.875rem",
                borderRadius: "0",
                height: "100%",
                overflow: "auto",
              }}
              wrapLongLines={true}
            >
              {currentCode}
            </SyntaxHighlighter>
            {isGenerating && (
              <span className="absolute bottom-4 right-4 inline-block w-2 h-5 bg-gray-200 animate-pulse"></span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {showPreview && !isGenerating && currentCode && (
        <Card className="flex flex-col h-full min-h-0">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="text-lg">Live Preview</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
