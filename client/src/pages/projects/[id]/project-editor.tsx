import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useAtomValue } from "jotai";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NextPrompt } from "./next-prompt";
import AppRenderer from "@/components/app-renderer";
import { projectByIdAtom } from "@/state/app-ecosystem";
import toast from "react-hot-toast";
import CONFIG from "@/config";

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

interface InitialCodeGeneratorProps {
  projectId: string;
}

function InitialCodeGenerator({ projectId }: InitialCodeGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const project = useAtomValue(projectByIdAtom(projectId));

  const generateCode = async () => {
    if (!project) return;

    setIsGenerating(true);
    setIsStreaming(true);
    setStreamingText("");
    setGeneratedCode("");

    try {
      // Get the initial prompt from project data
      const initialPrompt = project.originalPrompt || project.name;

      const response = await fetch(`${CONFIG.API.BASE_URL}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: `Create a React TypeScript component for: ${initialPrompt}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullCode = "";

      const readStream = async (): Promise<void> => {
        const { done, value } = await reader.read();

        if (done) {
          setIsStreaming(false);
          setGeneratedCode(fullCode);

          // Create the first version with the generated code
          await createFirstVersion(fullCode, initialPrompt);
          return;
        }

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith("data: ")) {
            const data = trimmedLine.substring(6);

            if (data === "[DONE]") {
              setIsStreaming(false);
              setGeneratedCode(fullCode);

              // Create the first version with the generated code
              await createFirstVersion(fullCode, initialPrompt);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "token" && parsed.text) {
                fullCode += parsed.text;
                setStreamingText(fullCode);
              }
            } catch (e) {
              // Handle non-JSON data as plain text
              if (data && !data.includes("{")) {
                console.log("Status:", data);
              }
            }
          }
        }

        readStream();
      };

      await readStream();
    } catch (error) {
      console.error("Code generation failed:", error);
      toast.error("Code generation failed. Please try again.");
      setIsStreaming(false);
      setIsGenerating(false);
    }
  };

  const createFirstVersion = async (sourceCode: string, prompt: string) => {
    try {
      const response = await fetch(
        `${CONFIG.API.BASE_URL}/api/projects/${projectId}/versions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            source_code: sourceCode,
            model: "claude-3-haiku-20240307",
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to create version: ${response.status}`);
      }

      // Refresh the project to show the new version
      window.location.reload();
      toast.success("Code generated and first version created!");
    } catch (error) {
      console.error("Failed to create first version:", error);
      toast.error("Failed to save generated code");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p>Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl mb-2">Generate Initial Code</CardTitle>
          <div className="text-gray-600 mb-4">
            <div className="text-4xl mb-2">{project.icon}</div>
            <h3 className="text-lg font-semibold">{project.name}</h3>
            <p className="text-sm">{project.description}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isGenerating && !generatedCode && (
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                This project doesn't have any code yet. Click the button below
                to generate the initial code using AI.
              </p>
              <Button
                onClick={generateCode}
                size="lg"
                className="w-full max-w-xs"
                disabled={isGenerating}
              >
                🤖 Generate Code
              </Button>
            </div>
          )}

          {isStreaming && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Generating code...</p>
                <div className="animate-pulse h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full animate-pulse"></div>
                </div>
              </div>

              {streamingText && (
                <Card className="h-64">
                  <CardContent className="p-0 h-full">
                    <SyntaxHighlighter
                      language="tsx"
                      style={tomorrow}
                      customStyle={{
                        margin: 0,
                        padding: "0.75rem",
                        fontSize: "0.75rem",
                        borderRadius: "0.375rem",
                        height: "100%",
                        overflow: "auto",
                      }}
                      wrapLongLines={true}
                    >
                      {streamingText}
                    </SyntaxHighlighter>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {generatedCode && !isStreaming && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-green-600 font-semibold">
                  ✅ Code generated successfully! Saving as first version...
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ProjectEditor() {
  const { id } = useParams<{ id: string }>();
  const project = useAtomValue(projectByIdAtom(id || ""));

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

  // If project has no versions (current_version === 0), show code generation UI
  if (project.currentVersion === 0 || !currentCode.trim()) {
    return <InitialCodeGenerator projectId={project.id} />;
  }

  // After generation is complete
  return (
    <div className="flex h-full space-x-4">
      {/* Left Sidebar - Modify Code with Code Preview */}
      <div className="w-96 flex-shrink-0 flex flex-col p-4 pr-0 space-y-4">
        {/* Modify Code Panel */}
        <NextPrompt />

        {/* Code Preview Panel - Always visible */}
        <div className="flex-1 min-h-0">
          <Card className="h-full relative overflow-hidden">
            {currentCode && (
              <Button
                className="absolute bottom-2 right-2 z-10"
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
            <SyntaxHighlighter
              language={detectLanguage(currentCode)}
              style={tomorrow}
              customStyle={{
                margin: 0,
                padding: "0.5rem",
                fontSize: "0.7rem",
                borderRadius: "0",
                height: "100%",
                overflow: "auto",
              }}
              wrapLongLines={true}
              showLineNumbers={false}
            >
              {currentCode}
            </SyntaxHighlighter>
          </Card>
        </div>
      </div>

      {/* Right Side - Live Preview takes all remaining space */}
      <div className="w-full h-full p-4 pl-0">
        <Card>
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
        </Card>
      </div>
    </div>
  );
}
