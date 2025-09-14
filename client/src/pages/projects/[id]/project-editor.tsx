import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useAtomValue } from "jotai";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AppRenderer from "@/components/app-renderer";
import { projectByIdAtom } from "@/state/app-ecosystem";
import toast from "react-hot-toast";
import CONFIG from "@/config";
import { EditorPrompt } from "./eidtor-prompt";
import { AlertTriangle, Copy, Zap } from "lucide-react";

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
        <div className="flex items-center justify-center h-full p-8">
          <Card className="w-full max-w-md border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6 text-center">
              <div className="mb-4">
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-destructive mb-2">
                App Preview Error
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                The generated code contains errors and cannot be previewed.
              </p>
              <details className="text-xs text-muted-foreground text-left">
                <summary className="cursor-pointer hover:text-foreground transition-colors">
                  Show error details
                </summary>
                <pre className="mt-2 p-3 bg-muted rounded text-xs whitespace-pre-wrap overflow-auto max-h-32">
                  {this.state.error?.message || "Unknown error"}
                </pre>
              </details>
            </CardContent>
          </Card>
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
      <Card className="w-full max-w-2xl border-0 shadow-lg">
        <CardHeader className="text-center pb-8">
          <div className="mb-6">
            <div className="text-6xl mb-4 opacity-80">{project.icon}</div>
            <CardTitle className="text-3xl mb-2 tracking-tight">
              Generate Initial Code
            </CardTitle>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">{project.name}</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {project.description}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isGenerating && !generatedCode && (
            <div className="text-center space-y-6">
              <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
                This project doesn't have any code yet. Click the button below
                to generate the initial code using AI.
              </p>
              <Button
                onClick={generateCode}
                size="lg"
                className="h-12 px-8 gap-2"
                disabled={isGenerating}
              >
                <Zap className="h-5 w-5" />
                Generate Code
              </Button>
            </div>
          )}

          {isStreaming && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Generating code...
                </p>
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-primary rounded-full animate-pulse"></div>
                </div>
              </div>

              {streamingText && (
                <Card className="h-80 border-primary/20">
                  <CardContent className="p-0 h-full relative">
                    <div className="absolute top-2 left-2 z-10 bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      Generating
                    </div>
                    <SyntaxHighlighter
                      language="tsx"
                      style={tomorrow}
                      customStyle={{
                        margin: 0,
                        padding: "2rem 0.75rem 0.75rem",
                        fontSize: "0.75rem",
                        borderRadius: "0.5rem",
                        height: "100%",
                        overflow: "auto",
                        background: "transparent",
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
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 text-green-600 font-semibold">
                <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                Code generated successfully! Saving as first version...
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
  const [isStreamingFromPrompt, setIsStreamingFromPrompt] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  const handleStreamingUpdate = (isStreaming: boolean, content?: string) => {
    setIsStreamingFromPrompt(isStreaming);
    if (content !== undefined) {
      setStreamingContent(content);
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

  const currentCode =
    isStreamingFromPrompt && streamingContent
      ? streamingContent
      : project.versions.find((v) => v.versionNumber === project.currentVersion)
          ?.sourceCode || "";

  // If project has no versions (current_version === 0), show code generation UI
  if (project.currentVersion === 0) {
    return <InitialCodeGenerator projectId={project.id} />;
  }

  // After generation is complete
  return (
    <div className="flex h-full gap-6 p-6">
      {/* Left Sidebar - Modify Code with Code Preview */}
      <div className="w-96 flex-shrink-0 flex flex-col space-y-6">
        {/* Modify Code Panel */}
        <EditorPrompt onStreamingUpdate={handleStreamingUpdate} />

        {/* Code Preview Panel - Always visible */}
        <div className="flex-1 min-h-0">
          <Card
            className={`h-full relative overflow-hidden border-0 shadow-md ${
              isStreamingFromPrompt
                ? "ring-2 ring-primary/20 shadow-primary/10"
                : ""
            }`}
          >
            {currentCode && (
              <Button
                className="absolute bottom-3 right-3 z-10 gap-2"
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const codeToCopy =
                      isStreamingFromPrompt && streamingContent
                        ? streamingContent
                        : project.versions[project.versions.length - 1]
                            ?.sourceCode || "";
                    await navigator.clipboard.writeText(codeToCopy);
                    toast.success("Code copied to clipboard!");
                  } catch (error) {
                    console.error("Failed to copy:", error);
                    toast.error("Failed to copy code");
                  }
                }}
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            )}
            {isStreamingFromPrompt && (
              <div className="absolute top-3 left-3 z-10 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                Live update
              </div>
            )}
            <SyntaxHighlighter
              language={detectLanguage(currentCode)}
              style={tomorrow}
              customStyle={{
                margin: 0,
                padding: "1rem",
                fontSize: "0.75rem",
                borderRadius: "0.5rem",
                height: "100%",
                overflow: "auto",
                background: "transparent",
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
      <div className="flex-1 h-full">
        <Card className="h-full border-0 shadow-md overflow-hidden">
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
                  version: `${project.currentVersion}`,
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
